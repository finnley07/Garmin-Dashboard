import {
  analyzeActivities,
  computeAnalysisFingerprint,
  computeStats,
  createAnalysisContext,
} from "./analysis.js";
import {
  fetchAllActivities,
  fetchLiveMetrics,
  fetchNewActivities,
  withGarminClient,
} from "./garmin-mcp.js";
import {
  buildSyncMeta,
  loadStoredData,
  mergeActivities,
  saveStoredData,
  toDashboardDataWithProfile,
} from "./storage.js";
import {
  beginSync,
  finishSync,
  getSyncLock,
  setSyncLock,
  updateSyncPhase,
} from "./sync-state.js";
import { appendTrainingStatusHistory } from "./training-status-history.js";
import { loadUserProfile } from "./user-profile.js";
import type { DashboardData, StoredData } from "./types.js";

export async function loadDashboardFromDisk(): Promise<DashboardData | null> {
  const stored = await loadStoredData();
  return stored ? toDashboardDataWithProfile(stored) : null;
}

async function syncDashboardInternal(
  forceFull = false,
): Promise<DashboardData> {
  const existing = await loadStoredData();
  const previousSyncedAt = existing?.sync.lastSyncedAt ?? null;

  updateSyncPhase("connecting", 10, "Connecting to Garmin…");

  const result = await withGarminClient(async (call) => {
    let activities = existing?.activities ?? [];
    let syncMode: "full" | "incremental" = "full";
    let newCount = 0;

    updateSyncPhase("activities", 25, "Fetching activities…");

    if (forceFull || !existing || existing.activities.length === 0) {
      activities = await fetchAllActivities(call);
      syncMode = "full";
      newCount = activities.length;
    } else {
      const sinceDate = existing.sync.latestActivityDate;
      if (sinceDate) {
        const incoming = await fetchNewActivities(call, sinceDate);
        const merged = mergeActivities(activities, incoming);
        activities = merged.merged;
        newCount = merged.newCount;
        syncMode = "incremental";
      } else {
        activities = await fetchAllActivities(call);
        syncMode = "full";
        newCount = activities.length;
      }
    }

    updateSyncPhase("metrics", 55, "Fetching wellness metrics…");
    const metrics = await fetchLiveMetrics(call);
    return { activities, syncMode, newCount, metrics };
  });

  updateSyncPhase("stats", 70, "Computing statistics…");
  const stats = computeStats(result.activities);
  const userProfile = await loadUserProfile();

  const analysisContext = createAnalysisContext(
    { ...result.metrics, metricsDate: result.metrics.metricsDate },
    userProfile,
    result.activities,
  );
  const fingerprint = computeAnalysisFingerprint(
    result.activities,
    stats,
    analysisContext,
  );
  const needsRefresh =
    !existing?.recommendations.length ||
    existing.analysisFingerprint !== fingerprint;

  let recommendations = existing?.recommendations ?? [];
  let analysisSource = existing?.analysisSource ?? "local";
  let lastAnalyzedAt = existing?.lastAnalyzedAt;
  let claudeUsage = existing?.claudeUsage ?? null;
  // Persisting the new fingerprint after a failed Claude call would mark the
  // data as "analyzed" and block every retry until new activities arrive.
  let storedFingerprint = fingerprint;

  if (needsRefresh) {
    updateSyncPhase("analysis", 85, "Updating recommendations…");
    const analysis = await analyzeActivities(
      result.activities,
      stats,
      analysisContext,
      {
        newCount: result.newCount,
        fingerprint,
        previousFingerprint: existing?.analysisFingerprint,
        lastAnalyzedAt: existing?.lastAnalyzedAt,
        hasRecommendations: (existing?.recommendations.length ?? 0) > 0,
      },
    );

    recommendations = analysis.recommendations;
    analysisSource = analysis.source;
    if (analysis.source === "claude") {
      lastAnalyzedAt = new Date().toISOString();
      claudeUsage = analysis.usage ?? null;
    }
    if (analysis.claudeFailed) {
      storedFingerprint = existing?.analysisFingerprint ?? "";
    }
  }

  updateSyncPhase("saving", 95, "Saving data…");

  const stored: StoredData = {
    version: 1,
    profile: result.metrics.profile,
    activities: result.activities,
    trainingStatus: result.metrics.trainingStatus,
    trainingReadiness: result.metrics.trainingReadiness,
    vo2max: result.metrics.vo2max,
    personalRecords: result.metrics.personalRecords,
    sleepData: result.metrics.sleepData,
    healthSnapshot: result.metrics.healthSnapshot,
    vo2maxHistory: result.metrics.vo2maxHistory,
    readinessHistory: result.metrics.readinessHistory,
    sleepHistory: result.metrics.sleepHistory,
    hrvHistory: result.metrics.hrvHistory,
    stressHistory: result.metrics.stressHistory,
    bodyBatteryHistory: result.metrics.bodyBatteryHistory,
    trainingStatusHistory: appendTrainingStatusHistory(
      existing?.trainingStatusHistory,
      result.metrics.trainingStatus,
      result.metrics.metricsDate,
    ),
    racePredictions: result.metrics.racePredictions,
    stats,
    recommendations,
    analysisSource,
    analysisFingerprint: storedFingerprint,
    lastAnalyzedAt,
    claudeUsage,
    metricsDate: result.metrics.metricsDate,
    fetchedAt: new Date().toISOString(),
    sync: buildSyncMeta(
      result.activities,
      result.newCount,
      result.syncMode,
      previousSyncedAt,
    ),
  };

  await saveStoredData(stored);
  return await toDashboardDataWithProfile(stored);
}

export async function runSyncJob(
  forceFull = false,
  triggeredBy: "manual" | "auto" | "startup" = "manual",
): Promise<DashboardData> {
  const existing = getSyncLock();
  if (existing) return existing;

  beginSync(triggeredBy);

  const job = (async () => {
    try {
      const data = await syncDashboardInternal(forceFull);
      finishSync(true);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      finishSync(false, message);
      throw error;
    } finally {
      setSyncLock(null);
    }
  })();

  setSyncLock(job);
  return job;
}

export async function syncDashboard(forceFull = false): Promise<DashboardData> {
  return runSyncJob(forceFull, "manual");
}
