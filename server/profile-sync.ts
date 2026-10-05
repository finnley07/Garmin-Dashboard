import {
  analyzeActivities,
  computeAnalysisFingerprint,
  computeStats,
  createAnalysisContext,
  getClaudeAnalysisMode,
} from "./analysis.js";
import { logger } from "./logger.js";
import { loadStoredData, saveStoredData, toDashboardData } from "./storage.js";
import type { DashboardData, UserProfileSettings } from "./types.js";

interface RefreshResult {
  dashboard: DashboardData | null;
  /** True only when Claude was supposed to run for this refresh and failed. */
  claudeFailed: boolean;
}

async function refreshRecommendations(
  userProfile: UserProfileSettings,
  options: { claude: boolean },
): Promise<RefreshResult> {
  const stored = await loadStoredData();
  if (!stored || stored.activities.length === 0)
    return { dashboard: null, claudeFailed: false };

  const stats = computeStats(stored.activities);
  const context = createAnalysisContext(
    {
      profile: stored.profile,
      trainingStatus: stored.trainingStatus,
      trainingReadiness: stored.trainingReadiness,
      vo2max: stored.vo2max,
      personalRecords: stored.personalRecords,
      sleepData: stored.sleepData ?? null,
      healthSnapshot: stored.healthSnapshot ?? null,
      racePredictions: stored.racePredictions ?? null,
      metricsDate: stored.metricsDate ?? null,
    },
    userProfile,
    stored.activities,
  );

  const fingerprint = computeAnalysisFingerprint(
    stored.activities,
    stats,
    context,
  );
  const analysis = await analyzeActivities(stored.activities, stats, context, {
    newCount: 0,
    fingerprint,
    previousFingerprint: stored.analysisFingerprint,
    lastAnalyzedAt: stored.lastAnalyzedAt,
    hasRecommendations: Boolean(stored.recommendations?.length),
    forceLocal: !options.claude,
    profileChanged: options.claude,
  });

  const updated = {
    ...stored,
    recommendations: analysis.recommendations,
    analysisSource: analysis.source,
    // Keep the old fingerprint when Claude failed so the next sync retries.
    analysisFingerprint: analysis.claudeFailed
      ? stored.analysisFingerprint
      : fingerprint,
    lastAnalyzedAt:
      analysis.source === "claude"
        ? new Date().toISOString()
        : stored.lastAnalyzedAt,
    claudeUsage:
      analysis.source === "claude"
        ? (analysis.usage ?? null)
        : stored.claudeUsage,
    fetchedAt: new Date().toISOString(),
  };

  await saveStoredData(updated);
  return {
    dashboard: toDashboardData(updated, userProfile),
    claudeFailed: options.claude && analysis.claudeFailed,
  };
}

export async function refreshRecommendationsAfterProfileChange(
  userProfile: UserProfileSettings,
  options?: { claude?: boolean },
): Promise<DashboardData | null> {
  const { dashboard } = await refreshRecommendations(userProfile, {
    claude: options?.claude ?? false,
  });
  return dashboard;
}

export function scheduleClaudeRecommendationsAfterProfileChange(
  userProfile: UserProfileSettings,
): boolean {
  if (getClaudeAnalysisMode() === "off") return false;

  void refreshRecommendations(userProfile, { claude: true })
    .then(({ dashboard }) => {
      if (dashboard?.analysisSource === "claude") {
        logger.info(
          "Profile save: Claude recommendations updated in background",
        );
      }
    })
    .catch((error) => {
      logger.warn(
        "Profile save: background Claude recommendations failed",
        error instanceof Error ? error.message : error,
      );
    });

  return true;
}

export type ManualReanalysisResult =
  | { status: "ok"; dashboard: DashboardData; claudeFailed: boolean }
  | { status: "no-data" }
  | { status: "claude-off" };

/**
 * Backs the manual "Check data" button: re-runs the coaching analysis on the
 * data already on disk (without a Garmin re-sync) and forces a Claude call
 * regardless of the smart-mode fingerprint/time gating in shouldRunClaudeAnalysis –
 * that gating exists to avoid redundant *automatic* calls, not to block an
 * explicit "check now" click.
 *
 * Respects an explicit claudeAnalysisMode of 'off' rather than overriding it:
 * that setting means "never call Claude", which a manual button should not
 * second-guess.
 */
export async function runManualReanalysis(
  userProfile: UserProfileSettings,
): Promise<ManualReanalysisResult> {
  if (getClaudeAnalysisMode() === "off") {
    return { status: "claude-off" };
  }

  const { dashboard, claudeFailed } = await refreshRecommendations(
    userProfile,
    { claude: true },
  );
  if (!dashboard) return { status: "no-data" };

  return { status: "ok", dashboard, claudeFailed };
}
