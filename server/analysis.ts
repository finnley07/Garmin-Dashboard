import { createHash } from "node:crypto";
import { getAppConfig, type AppLanguage } from "./app-config.js";
import {
  analyzeWithClaudeCli,
  isClaudeCliAvailable,
  MAX_RECOMMENDATIONS,
  type ClaudeUsage,
} from "./claude-cli.js";
import { compactProfileLine, getAthleteTypeLabel } from "./user-profile.js";
import { sumTargetSessions } from "./profile-config.js";
import { logger } from "./logger.js";
import { tr } from "./lang.js";
import { filterDashboardActivities } from "./activity-filters.js";
import {
  compactBodyLine,
  resolveBodyMetrics,
  vo2maxReference,
  type ResolvedBodyMetrics,
} from "./body-metrics.js";
import {
  analyzeTraining,
  compactTrainingLine,
  type TrainingAnalysis,
} from "./training-analysis.js";
import { compactRaceLine } from "./race-calendar.js";
import {
  selectRecommendations,
  type FamilyRecommendation,
} from "./recommendation-select.js";
import type {
  DashboardAnalysis,
  DashboardStats,
  GarminActivity,
  Recommendation,
  UserProfileSettings,
} from "./types.js";

type AnalysisContext = {
  profile: Record<string, unknown> | null;
  trainingStatus: Record<string, unknown> | null;
  trainingReadiness: Record<string, unknown> | unknown[] | null;
  vo2max: Record<string, unknown> | unknown[] | null;
  personalRecords: unknown;
  sleepData?: Record<string, unknown> | unknown[] | null;
  healthSnapshot?: Record<string, unknown> | null;
  racePredictions?: Record<string, unknown> | null;
  userProfile: UserProfileSettings;
  /** Day the wellness metrics belong to (Garmin lags one day). */
  metricsDate?: string | null;
  /** Body data with Garmin fallbacks – turns absolute thresholds into personal ones. */
  body?: ResolvedBodyMetrics | null;
  /** Load, monotony and intensity distribution computed from the stored activities. */
  training?: TrainingAnalysis | null;
};

function normalizeReadiness(
  trainingReadiness: Record<string, unknown> | unknown[] | null,
): Record<string, unknown> | null {
  if (Array.isArray(trainingReadiness)) {
    return (trainingReadiness[0] as Record<string, unknown>) ?? null;
  }
  return trainingReadiness;
}

function normalizeVo2Entry(
  vo2max: Record<string, unknown> | unknown[] | null,
): Record<string, unknown> | null {
  if (Array.isArray(vo2max)) {
    return (vo2max[0] as Record<string, unknown>) ?? null;
  }
  return vo2max;
}

function extractStatusKey(
  trainingStatus: Record<string, unknown> | null,
): string | null {
  const mostRecent = trainingStatus?.mostRecentTrainingStatus as
    | Record<string, unknown>
    | undefined;
  const latestMap = mostRecent?.latestTrainingStatusData as
    | Record<string, unknown>
    | undefined;
  const firstDevice = latestMap
    ? (Object.values(latestMap)[0] as Record<string, unknown>)
    : null;
  return (
    (firstDevice?.trainingStatusFeedbackPhrase as string | undefined) ?? null
  );
}

function extractReadinessScore(
  trainingReadiness: Record<string, unknown> | unknown[] | null,
): number | null {
  const readiness = normalizeReadiness(trainingReadiness);
  const score = readiness?.score as number | undefined;
  return score ?? null;
}

function extractSleepScore(
  trainingReadiness: Record<string, unknown> | unknown[] | null,
): number | null {
  const readiness = normalizeReadiness(trainingReadiness);
  const score = readiness?.sleepScore as number | undefined;
  return score ?? null;
}

function extractVo2(
  vo2max: Record<string, unknown> | unknown[] | null,
): number | null {
  const entry = normalizeVo2Entry(vo2max);
  const generic = entry?.generic as Record<string, unknown> | undefined;
  return (
    (generic?.vo2MaxPreciseValue as number | undefined) ??
    (generic?.vo2MaxValue as number | undefined) ??
    null
  );
}

function extractAcwr(
  trainingStatus: Record<string, unknown> | null,
): number | null {
  const mostRecent = trainingStatus?.mostRecentTrainingStatus as
    | Record<string, unknown>
    | undefined;
  const latestMap = mostRecent?.latestTrainingStatusData as
    | Record<string, unknown>
    | undefined;
  const firstDevice = latestMap
    ? (Object.values(latestMap)[0] as Record<string, unknown>)
    : null;
  const acute = firstDevice?.acuteTrainingLoadDTO as
    | Record<string, unknown>
    | undefined;
  return (acute?.dailyAcuteChronicWorkloadRatio as number | undefined) ?? null;
}

type AnalysisMode = "smart" | "always" | "off";

export type AnalysisTrigger = {
  newCount: number;
  fingerprint: string;
  previousFingerprint?: string;
  lastAnalyzedAt?: string;
  hasRecommendations: boolean;
  /** Skip Claude and return local rules immediately. */
  forceLocal?: boolean;
  /** Profile changed – allow Claude refresh even if fingerprint was just updated. */
  profileChanged?: boolean;
};

function getAnalysisMode(): AnalysisMode {
  return getAppConfig().claudeAnalysisMode;
}

function getMaxActivities(): number {
  return getAppConfig().claudeMaxActivities;
}

/** Monday 00:00 local time of the week containing `reference`. */
function startOfWeek(reference = new Date()): Date {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

/**
 * Stats for the current calendar week (Monday to now) – weekly targets and the
 * "this week" dashboard cards reset on Monday, so a rolling 7-day window would
 * still show last week's sessions on a quiet Monday.
 */
/** Exported for tests – the calendar-week boundary is the part most likely to regress. */
export function computeRecentWeekStats(activities: GarminActivity[]) {
  const cutoff = startOfWeek().getTime();
  const recent = filterDashboardActivities(activities).filter(
    (activity) => new Date(activity.startTimeLocal).getTime() >= cutoff,
  );

  return {
    sessions: recent.length,
    km:
      recent.reduce((sum, activity) => sum + (activity.distance ?? 0), 0) /
      1000,
    hours:
      recent.reduce((sum, activity) => sum + (activity.duration ?? 0), 0) /
      3600,
    byType: recent.reduce<Record<string, number>>((map, activity) => {
      const type = activity.activityType?.typeKey ?? "unknown";
      map[type] = (map[type] ?? 0) + 1;
      return map;
    }, {}),
  };
}

export function computeStats(activities: GarminActivity[]): DashboardStats {
  const dashboardActivities = filterDashboardActivities(activities);
  const activityBreakdown: Record<string, number> = {};
  let totalDistance = 0;
  let totalDuration = 0;
  let totalCalories = 0;
  let hrSum = 0;
  let hrCount = 0;

  for (const activity of dashboardActivities) {
    const type = activity.activityType?.typeKey ?? "unknown";
    activityBreakdown[type] = (activityBreakdown[type] ?? 0) + 1;
    totalDistance += activity.distance ?? 0;
    totalDuration += activity.duration ?? 0;
    totalCalories += activity.calories ?? 0;

    if (activity.averageHR) {
      hrSum += activity.averageHR;
      hrCount++;
    }
  }

  return {
    totalActivities: dashboardActivities.length,
    totalDistanceKm: totalDistance / 1000,
    totalDurationHours: totalDuration / 3600,
    totalCalories,
    avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : 0,
    activityBreakdown,
  };
}

export function computeAnalysisFingerprint(
  activities: GarminActivity[],
  stats: DashboardStats,
  context: AnalysisContext,
): string {
  const recent = activities
    .slice(0, 7)
    .map(
      (activity) =>
        `${activity.activityId}:${activity.startTimeLocal.slice(0, 10)}`,
    )
    .join(",");

  const payload = [
    recent,
    stats.totalActivities,
    Math.round(stats.totalDistanceKm),
    Math.round(stats.totalDurationHours),
    stats.avgHeartRate,
    extractStatusKey(context.trainingStatus) ?? "",
    extractReadinessScore(context.trainingReadiness) ?? "",
    extractVo2(context.vo2max) ?? "",
    Object.entries(stats.activityBreakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, count]) => `${type}:${count}`)
      .join("|"),
    compactProfileLine(context.userProfile),
    context.userProfile.updatedAt,
    // Load state and body data change the analysis even when the activity list
    // is unchanged, so they belong in the fingerprint.
    context.training
      ? [
          context.training.acuteLoad7d,
          context.training.chronicLoadWeekly,
          context.training.monotony ?? "",
          context.training.restDays7d,
          context.training.intensity?.easySharePct ?? "",
        ].join("/")
      : "",
    context.body ? compactBodyLine(context.body) : "",
  ].join(";");

  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function shouldRunClaudeAnalysis(trigger: AnalysisTrigger): boolean {
  if (trigger.forceLocal) return false;

  const mode = getAnalysisMode();
  if (mode === "off") return false;
  if (mode === "always") return true;
  if (trigger.profileChanged) return true;

  if (!trigger.hasRecommendations) return true;
  if (trigger.previousFingerprint === trigger.fingerprint) return false;

  const hoursSince = trigger.lastAnalyzedAt
    ? (Date.now() - new Date(trigger.lastAnalyzedAt).getTime()) / 3_600_000
    : Number.POSITIVE_INFINITY;

  if (trigger.newCount >= 2) return true;
  if (trigger.newCount >= 1 && hoursSince >= 48) return true;
  if (trigger.newCount === 0 && hoursSince >= 24) return true;

  return false;
}

/**
 * Deliberately does NOT compare partial-week actuals against full-week targets
 * (e.g. "0/3 runs so far") - on a Monday that is always true and says nothing
 * useful, since the week isn't over. That comparison is exactly why this used
 * to fire "weekly target missed" on day one of every week.
 *
 * The plain progress numbers (current/target per discipline) are already
 * visible in the "This week" stat card and the WeeklyProgress panel, which is
 * where a neutral count belongs. Whether a given day-of-week/progress
 * combination is actually worth a comment is a judgment call this function
 * has no way to make well - Claude sees the same week-vs-plan numbers in the
 * prompt (with today's date) and can decide that with real reasoning instead
 * of a blind ratio check.
 */
function buildProfileRecommendations(
  activities: GarminActivity[],
  userProfile: UserProfileSettings,
  recommendations: FamilyRecommendation[],
): void {
  const week = computeRecentWeekStats(activities);
  const targets = userProfile.weeklyTargets;
  const plannedSessions =
    (targets.runningSessions ?? 0) +
    (targets.strengthSessions ?? 0) +
    (targets.swimmingSessions ?? 0) +
    (targets.otherSessions ?? 0);

  if (userProfile.injuryNotes) {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr("Einschränkungen beachten", "Keep limitations in mind"),
      family: "injury",
      description: tr(
        `Berücksichtige: „${userProfile.injuryNotes.slice(0, 80)}“.`,
        `Keep in mind: "${userProfile.injuryNotes.slice(0, 80)}".`,
      ),
    });
  }

  const plannedMax = plannedSessions || 7;
  if (
    userProfile.experienceLevel === "beginner" &&
    week.sessions > plannedMax + 2
  ) {
    recommendations.push({
      category: "recovery",
      priority: "medium",
      title: tr("Steigerung dosieren", "Pace the progression"),
      family: "beginner-ramp",
      description: tr(
        "Als Einsteiger lieber langsam steigern – Erholungstage sind genauso wichtig.",
        "As a beginner it is better to ramp up slowly – rest days matter just as much.",
      ),
    });
  }
}

/**
 * Rules on top of the locally computed load series. They cover what Garmin does
 * not report: monotony/strain, intensity distribution and week-over-week jumps.
 */
function buildTrainingLoadRecommendations(
  context: AnalysisContext,
  recommendations: FamilyRecommendation[],
): void {
  const training = context.training;
  if (!training) return;

  const garminAcwr = extractAcwr(context.trainingStatus);

  // Only report the locally computed ratio when Garmin has none, otherwise the
  // same fact would appear twice with slightly different numbers.
  if (
    garminAcwr === null &&
    training.acwr !== null &&
    training.sessions28d >= 6
  ) {
    if (training.acwr > 1.4) {
      recommendations.push({
        category: "recovery",
        priority: "high",
        title: tr("Belastungssprung erkannt", "Load spike detected"),
        family: "acute-fatigue",
        description: tr(
          `Deine Wochenlast liegt bei ${training.acuteLoad7d} gegenüber ${training.chronicLoadWeekly} im 4-Wochen-Schnitt (Verhältnis ${training.acwr.toFixed(2)}). Sprünge über 1,4 gehen erfahrungsgemäß mit mehr Verletzungen einher – die nächste Woche flacher gestalten.`,
          `Your weekly load is ${training.acuteLoad7d} against a 4-week average of ${training.chronicLoadWeekly} (ratio ${training.acwr.toFixed(2)}). Jumps above 1.4 correlate with more injuries – keep next week flatter.`,
        ),
      });
    } else if (training.acwr < 0.7 && training.sessions7d > 0) {
      recommendations.push({
        category: "training",
        priority: "medium",
        title: tr("Belastung eingebrochen", "Load has dropped off"),
        family: "load-low",
        description: tr(
          `Diese Woche ${training.acuteLoad7d} Last gegenüber ${training.chronicLoadWeekly} im Schnitt (Verhältnis ${training.acwr.toFixed(2)}). Ein bewusster Entlastungsblock ist gut, dauerhaft verlierst du damit Grundlage – nächste Woche wieder aufbauen.`,
          `This week's load is ${training.acuteLoad7d} against an average of ${training.chronicLoadWeekly} (ratio ${training.acwr.toFixed(2)}). A deliberate easy block is fine, but staying here long-term costs you fitness – build back up next week.`,
        ),
      });
    }
  }

  // Foster monotony/strain: same load every day is harder to absorb than the
  // same weekly total with clear hard/easy contrast.
  if (
    training.monotony !== null &&
    training.monotony > 2 &&
    training.sessions7d >= 4
  ) {
    recommendations.push({
      // Categorised as training, not recovery: the fix is restructuring the week.
      category: "training",
      priority: training.monotony > 2.5 ? "high" : "medium",
      title: tr("Trainingsmonotonie hoch", "Training monotony is high"),
      family: "monotony",
      description: tr(
        `Monotonie ${training.monotony.toFixed(2)} bei ${training.sessions7d} Einheiten und ${training.restDays7d} Ruhetagen – deine Tage sind fast gleich belastet. Mehr Kontrast (ein klar harter Tag, ein klar leichter, ein echter Ruhetag) verbessert die Anpassung bei gleichem Volumen.`,
        `Monotony ${training.monotony.toFixed(2)} across ${training.sessions7d} sessions and ${training.restDays7d} rest days – your days carry almost the same load. More contrast (one clearly hard day, one clearly easy, one real rest day) improves adaptation at the same volume.`,
      ),
    });
  }

  if (
    training.intensity &&
    training.intensity.verdict === "too-hard" &&
    context.userProfile.preferredIntensity !== "hard"
  ) {
    recommendations.push({
      category: "training",
      priority: "medium",
      title: tr("Zu wenig echte Grundlage", "Not enough real easy volume"),
      family: "intensity",
      description: tr(
        `Nur ${training.intensity.easySharePct} % deiner Trainingszeit lagen in den leichten Herzfrequenzzonen (${training.intensity.hardSharePct} % hart). Bewährt sind 75–85 % leicht – die harten Reize wirken erst, wenn die Grundlage locker genug ist.`,
        `Only ${training.intensity.easySharePct}% of your training time was in the easy heart-rate zones (${training.intensity.hardSharePct}% hard). 75–85% easy is the established pattern – hard efforts only pay off once the base is genuinely easy.`,
      ),
    });
  } else if (
    training.intensity &&
    training.intensity.verdict === "too-easy" &&
    training.sessions28d >= 8
  ) {
    recommendations.push({
      category: "performance",
      priority: "low",
      title: tr("Reize fehlen", "Missing hard stimuli"),
      family: "intensity",
      description: tr(
        `${training.intensity.easySharePct} % deiner Zeit war leicht und nur ${training.intensity.hardSharePct} % intensiv. Ein bis zwei gezielte Intervalleinheiten pro Woche würden Schwelle und VO₂max wieder ansprechen.`,
        `${training.intensity.easySharePct}% of your time was easy and only ${training.intensity.hardSharePct}% intense. One or two targeted interval sessions per week would engage threshold and VO₂max again.`,
      ),
    });
  }

  if (
    training.loadTrendPct !== null &&
    training.loadTrendPct > 60 &&
    training.sessions28d >= 8
  ) {
    recommendations.push({
      category: "recovery",
      priority: "medium",
      title: tr("Wochenlast stark gestiegen", "Weekly load jumped sharply"),
      family: "acute-fatigue",
      description: tr(
        `Diese Woche ${training.loadTrendPct} % mehr Last als im Schnitt der drei Wochen davor. Steigerungen von 5–10 % pro Woche sind gut verträglich – nach einem so großen Sprung lohnt eine ruhigere Woche.`,
        `This week's load is ${training.loadTrendPct}% higher than the average of the three weeks before. 5–10% weekly increases are well tolerated – after a jump this big, a quieter week is worth it.`,
      ),
    });
  }

  if (training.restDays7d === 0 && training.sessions7d >= 6) {
    recommendations.push({
      category: "training",
      priority: "high",
      title: tr("Kein Ruhetag", "No rest day"),
      family: "monotony",
      description: tr(
        `${training.sessions7d} Einheiten in 7 Tagen ohne einen einzigen trainingsfreien Tag. Anpassung passiert in der Pause – plane mindestens einen vollständigen Ruhetag ein.`,
        `${training.sessions7d} sessions in 7 days without a single day off. Adaptation happens during the break – plan at least one full rest day.`,
      ),
    });
  }

  if (
    training.daysSinceLastSession !== null &&
    training.daysSinceLastSession >= 7 &&
    training.sessions28d > 0
  ) {
    recommendations.push({
      category: "training",
      priority: "medium",
      title: tr("Längere Trainingspause", "Extended training break"),
      family: "layoff",
      description: tr(
        `Die letzte Einheit liegt ${training.daysSinceLastSession} Tage zurück. Nach so einer Pause mit 60–70 % der vorherigen Umfänge wieder einsteigen, statt direkt am alten Niveau anzuknüpfen.`,
        `Your last session was ${training.daysSinceLastSession} days ago. After a break like this, ease back in at 60–70% of your previous volume instead of picking up where you left off.`,
      ),
    });
  }

  // Only for profiles whose plan is genuinely strength-heavy. A runner with one
  // strength session per week is covered by the weekly-target rules instead – a
  // 25-40 % time share would be the wrong yardstick there.
  const strengthFocused =
    context.userProfile.athleteType === "hybrid" ||
    context.userProfile.athleteType === "bodybuilding";
  if (
    strengthFocused &&
    training.strengthShare28dPct !== null &&
    training.strengthShare28dPct < 15 &&
    training.sessions28d >= 8
  ) {
    recommendations.push({
      category: "training",
      priority: "medium",
      title: tr("Kraftanteil zu gering", "Strength share too low"),
      family: "strength-share",
      description: tr(
        `Nur ${training.strengthShare28dPct} % deiner Trainingszeit der letzten 4 Wochen war Krafttraining. Für dein Profil sind eher 25–40 % sinnvoll – Kraft schützt zusätzlich vor Überlastungsbeschwerden.`,
        `Only ${training.strengthShare28dPct}% of your training time over the last 4 weeks was strength work. For your profile 25–40% makes more sense – strength work also protects against overuse issues.`,
      ),
    });
  }
}

function buildLocalRecommendations(
  activities: GarminActivity[],
  stats: DashboardStats,
  context: AnalysisContext,
): Recommendation[] {
  const recommendations: FamilyRecommendation[] = [];

  // Registered first on purpose: these findings are quantified and name a
  // concrete change, so within one priority level they beat the generic status
  // readouts that the dashboard already shows elsewhere.
  buildTrainingLoadRecommendations(context, recommendations);

  const statusKey = extractStatusKey(context.trainingStatus);

  if (statusKey?.startsWith("RECOVERY") || statusKey === "DETRAINING") {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr("Erholungsphase beachten", "Mind the recovery phase"),
      family: "acute-fatigue",
      description: tr(
        "Dein Trainingsstatus zeigt Erholung/Detraining. Plane leichtere Einheiten und achte auf ausreichend Schlaf.",
        "Your training status shows recovery/detraining. Plan lighter sessions and get enough sleep.",
      ),
    });
  }

  if (statusKey === "OVERREACHING") {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr("Überlastung erkannt", "Overreaching detected"),
      family: "acute-fatigue",
      description: tr(
        "Garmin meldet Überlastung. Reduziere Intensität und baue mindestens 1–2 Ruhetage ein.",
        "Garmin is reporting overreaching. Reduce intensity and build in at least 1–2 rest days.",
      ),
    });
  }

  const readinessScore = extractReadinessScore(context.trainingReadiness);
  if (readinessScore !== null && readinessScore < 50) {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr("Niedrige Trainingsbereitschaft", "Low training readiness"),
      family: "acute-fatigue",
      description: tr(
        `Readiness-Score ${readinessScore}. Fokus auf Regeneration statt harter Intervalle.`,
        `Readiness score ${readinessScore}. Focus on recovery instead of hard intervals.`,
      ),
    });
  }

  const sleepScore = extractSleepScore(context.trainingReadiness);
  if (sleepScore !== null && sleepScore < 60) {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr("Schlaf verbessern", "Improve sleep"),
      family: "sleep",
      description: tr(
        `Schlaf-Score ${sleepScore}/100. Priorisiere längere Schlafzeit – Regeneration wirkt direkt auf Leistung und Readiness.`,
        `Sleep score ${sleepScore}/100. Prioritise more sleep – recovery feeds directly into performance and readiness.`,
      ),
    });
  }

  const acwr = extractAcwr(context.trainingStatus);
  if (acwr !== null && acwr > 1.3) {
    recommendations.push({
      category: "recovery",
      priority: "high",
      title: tr(
        "Hohe Belastungssteigerung (ACWR)",
        "High load increase (ACWR)",
      ),
      family: "acute-fatigue",
      description: tr(
        `ACWR ${acwr.toFixed(2)} – akute Last deutlich über chronischer Basis. Leichtere Einheiten oder Ruhetag einplanen.`,
        `ACWR ${acwr.toFixed(2)} – acute load clearly above the chronic baseline. Plan lighter sessions or a rest day.`,
      ),
    });
  } else if (
    acwr !== null &&
    acwr < 0.8 &&
    readinessScore !== null &&
    readinessScore >= 60
  ) {
    recommendations.push({
      category: "training",
      priority: "medium",
      title: tr("Raum für mehr Volumen", "Room for more volume"),
      family: "load-low",
      description: tr(
        `ACWR ${acwr.toFixed(2)} ist niedrig bei moderater Readiness – gute Gelegenheit für eine zusätzliche Grundlageneinheit.`,
        `ACWR ${acwr.toFixed(2)} is low with decent readiness – a good opportunity for an extra easy session.`,
      ),
    });
  }

  buildProfileRecommendations(activities, context.userProfile, recommendations);

  const runningActivities = activities.filter(
    (a) => a.activityType?.typeKey === "running",
  );
  const focusesRunning =
    context.userProfile.athleteType === "runner" ||
    context.userProfile.athleteType === "hybrid" ||
    context.userProfile.athleteType === "triathlon" ||
    (context.userProfile.weeklyTargets.runningSessions ?? 0) > 0;

  if (runningActivities.length >= 3 && focusesRunning) {
    const avgHrRuns = runningActivities
      .filter((a) => a.averageHR)
      .map((a) => a.averageHR!);
    if (avgHrRuns.length > 0) {
      const avgRunHr = Math.round(
        avgHrRuns.reduce((sum, value) => sum + value, 0) / avgHrRuns.length,
      );
      const maxHr = context.body?.maxHr ?? null;
      // Relative to HFmax where known – 170 bpm is easy for one athlete and
      // near-maximal for another.
      const sharePct = maxHr ? Math.round((avgRunHr / maxHr) * 100) : null;
      const tooHard = sharePct !== null ? sharePct > 85 : avgRunHr > 170;

      if (tooHard && context.userProfile.preferredIntensity !== "hard") {
        const estimated = context.body?.sources.maxHr === "estimated";
        recommendations.push({
          category: "training",
          priority: "medium",
          title: tr("Lauf-HF senken", "Lower your running heart rate"),
          family: "intensity",
          description:
            sharePct !== null
              ? tr(
                  `Deine Läufe liegen im Schnitt bei ${avgRunHr} bpm, also ${sharePct} % deiner HFmax von ${maxHr}${estimated ? " (aus dem Alter geschätzt)" : ""}. Locker heißt 65–80 % – plane mehr Einheiten in diesem Bereich ein, harte Reize wirken dann besser.`,
                  `Your runs average ${avgRunHr} bpm, i.e. ${sharePct}% of your max HR of ${maxHr}${estimated ? " (estimated from age)" : ""}. Easy means 65–80% – plan more sessions in that range so hard efforts pay off better.`,
                )
              : tr(
                  `Durchschnittliche Lauf-HF ${avgRunHr} bpm ist hoch. Mehr lockere Zone-2-Einheiten einplanen – trage HFmax im Profil ein, dann wird diese Bewertung persönlich statt pauschal.`,
                  `Average running HR of ${avgRunHr} bpm is high. Plan more easy zone-2 sessions – add your max HR to the profile to make this assessment personal instead of generic.`,
                ),
        });
      }
    }
  }

  const weeklyKm = stats.totalDistanceKm;
  if (
    weeklyKm > 0 &&
    stats.totalActivities >= 5 &&
    weeklyKm / stats.totalActivities < 3 &&
    (context.userProfile.athleteType === "runner" ||
      context.userProfile.athleteType === "triathlon" ||
      context.userProfile.athleteType === "cyclist")
  ) {
    recommendations.push({
      category: "training",
      priority: "medium",
      title: tr("Mehr Volumen sinnvoll", "More volume would help"),
      family: "volume",
      description: tr(
        "Viele kurze Einheiten – längere Grundlageneinheiten würden die aerobe Basis stärken.",
        "Lots of short sessions – longer easy sessions would strengthen the aerobic base.",
      ),
    });
  }

  const vo2Value = extractVo2(context.vo2max);
  if (vo2Value && context.userProfile.athleteType !== "bodybuilding") {
    // Age/sex reference instead of a flat 45 – the same value is strong at 55
    // and unremarkable at 25.
    const reference = vo2maxReference(
      context.body?.age ?? null,
      context.body?.sex ?? "unspecified",
    );
    const belowReference =
      reference !== null ? vo2Value < reference : vo2Value < 45;

    if (belowReference) {
      recommendations.push({
        category: "performance",
        priority: "medium",
        title: tr("VO₂max steigern", "Raise your VO₂max"),
        family: "vo2max",
        description:
          reference !== null
            ? tr(
                `VO₂max ${Math.round(vo2Value)} liegt unter dem Referenzwert von etwa ${reference} ml/kg/min für dein Alter. Intervalle (z. B. 4×4 min bei hoher Intensität) plus lange lockere Läufe sind der wirksamste Hebel.`,
                `VO₂max ${Math.round(vo2Value)} is below the reference of about ${reference} ml/kg/min for your age. Intervals (e.g. 4x4 min at high intensity) plus long easy runs are the most effective lever.`,
              )
            : tr(
                "Intervalle (z. B. 4×4 min) plus lange lockere Läufe verbessern die aerobe Kapazität. Trage Alter und Geschlecht im Profil ein, dann wird der Wert gegen die passende Referenz bewertet.",
                "Intervals (e.g. 4x4 min) plus long easy runs improve aerobic capacity. Add your age and sex to the profile so this gets checked against the right reference value.",
              ),
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      category: "general",
      priority: "low",
      title: tr("Solides Trainingsmuster", "Solid training pattern"),
      family: "ok",
      description: tr(
        `Dein Profil „${getAthleteTypeLabel(context.userProfile)}“ passt zu den aktuellen Daten. Weiter so!`,
        `Your "${getAthleteTypeLabel(context.userProfile)}" profile matches your current data. Keep it up!`,
      ),
    });
  }

  return selectRecommendations(recommendations, { limit: MAX_RECOMMENDATIONS });
}

function compactStatsLine(stats: DashboardStats): string {
  const topTypes = Object.entries(stats.activityBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([type, count]) => `${type}:${count}`)
    .join(",");

  return `${stats.totalActivities} act | ${Math.round(stats.totalDistanceKm)} km | ${Math.round(stats.totalDurationHours)} h | AvgHR ${stats.avgHeartRate || "-"} | ${topTypes}`;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Earliest activity in the store – gives the lifetime stats a time frame. */
function earliestActivityDate(activities: GarminActivity[]): string | null {
  let earliest: string | null = null;
  for (const activity of filterDashboardActivities(activities)) {
    const date = activity.startTimeLocal?.slice(0, 10);
    if (!date) continue;
    if (!earliest || date.localeCompare(earliest) < 0) earliest = date;
  }
  return earliest;
}

function compactMetricsLine(context: AnalysisContext): string {
  const parts: string[] = [];
  const status = extractStatusKey(context.trainingStatus);
  if (status) parts.push(`Status=${status}`);
  const readiness = extractReadinessScore(context.trainingReadiness);
  if (readiness !== null) parts.push(`Readiness=${readiness}`);
  const vo2 = extractVo2(context.vo2max);
  if (vo2 !== null) parts.push(`VO2=${vo2}`);
  return parts.join(" ") || "Metriken=n/a";
}

function compactRecentActivities(activities: GarminActivity[]): string {
  const typeShort: Record<string, string> = {
    running: "run",
    cycling: "cyc",
    strength_training: "str",
    swimming: "swm",
  };

  return filterDashboardActivities(activities)
    .slice(0, getMaxActivities())
    .map((activity) => {
      const typeKey = activity.activityType?.typeKey ?? "?";
      const type = typeShort[typeKey] ?? typeKey.slice(0, 3);
      const km = Math.round(((activity.distance ?? 0) / 1000) * 10) / 10;
      const min = Math.round((activity.duration ?? 0) / 60);
      const hr = activity.averageHR ?? "-";
      return `${activity.startTimeLocal.slice(0, 10)} ${type} ${km}km ${min}m HR${hr}`;
    })
    .join("; ");
}

/**
 * Baseline block: the local rules with their reasoning, not just their titles.
 * Without the numbers behind a rule the model can only rephrase it – with them
 * it can confirm, sharpen or reject it.
 */
function compactBaseline(localRecs: Recommendation[]): string {
  return localRecs
    .map(
      (rec) =>
        `- ${rec.priority}/${rec.category}: ${rec.title} — ${rec.description.slice(0, 140)}`,
    )
    .join("\n");
}

export function buildAnalysisPrompt(
  stats: DashboardStats,
  activities: GarminActivity[],
  context: AnalysisContext,
  localRecs: Recommendation[],
  language: AppLanguage = getAppConfig().language,
): string {
  const week = computeRecentWeekStats(activities);
  const today = todayIsoDate();
  const since = earliestActivityDate(activities);
  const metricsDate = context.metricsDate ?? null;
  const plannedSessions = sumTargetSessions(context.userProfile.weeklyTargets);
  const bodyLine = context.body ? compactBodyLine(context.body) : "";
  const trainingLine = context.training
    ? compactTrainingLine(context.training)
    : "";
  const raceLine = compactRaceLine(
    context.userProfile.plannedRaces,
    context.racePredictions ?? null,
  );
  const schemaLine =
    '{"recommendations":[{"category":"training|recovery|performance|general","priority":"high|medium|low","title":"","description":""}]}';

  if (language === "de") {
    return [
      `Garmin-Daten-Coach. Garmin Connect ist oft unübersichtlich – erkläre die Metriken in einfacher Sprache und gib 3–${MAX_RECOMMENDATIONS} konkrete, umsetzbare Tipps. Antworte auf Deutsch, nur JSON:`,
      schemaLine,
      "",
      `Heute: ${today}${metricsDate ? ` | Wellness-Metriken vom ${metricsDate}` : ""}`,
      `Profil: ${compactProfileLine(context.userProfile)}`,
      bodyLine ? `Körper: ${bodyLine}` : "",
      `Diese Woche (seit Montag): ${week.sessions} Einh. (${Math.round(week.km)} km, ${week.hours.toFixed(1)} h) | Plan: ${plannedSessions} Einh./Woche`,
      `Gesamt${since ? ` (seit ${since})` : ""}: ${compactStatsLine(stats)}`,
      `Metriken: ${compactMetricsLine(context)}`,
      trainingLine,
      raceLine,
      `Letzte Einheiten: ${compactRecentActivities(activities)}`,
      "",
      "Baseline aus lokalen Regeln (Faktenbasis, bereits gegen die Daten geprüft):",
      compactBaseline(localRecs),
      "",
      `Aufgabe: Nutze die Baseline als Faktenbasis – bestätige, präzisiere oder verwirf sie mit Begründung, statt sie nur umzuformulieren. Jede description 2–3 Sätze: erst WAS die Zahl bedeutet, dann WAS konkret zu tun ist. Verknüpfe Training mit Gesundheitsdaten (Readiness, Schlaf, ACWR).${raceLine ? " Berücksichtige das anstehende Rennen: passe Empfehlungen an Taper/Aufbau je nach Tagen bis zum Rennen an." : ""} Berücksichtige Profil, Ziele und Einschränkungen. Beachte, dass die Gesamt-Statistik den ganzen gespeicherten Zeitraum abdeckt, nicht die aktuelle Woche.`,
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  return [
    `Garmin data coach. Garmin Connect is hard to read – explain the metrics in plain language and give 3–${MAX_RECOMMENDATIONS} concrete, actionable tips. Answer in English, JSON only:`,
    schemaLine,
    "",
    `Today: ${today}${metricsDate ? ` | wellness metrics from ${metricsDate}` : ""}`,
    `Profile: ${compactProfileLine(context.userProfile)}`,
    bodyLine ? `Body: ${bodyLine}` : "",
    `This week (since Monday): ${week.sessions} sessions (${Math.round(week.km)} km, ${week.hours.toFixed(1)} h) | plan: ${plannedSessions} sessions/week`,
    `All time${since ? ` (since ${since})` : ""}: ${compactStatsLine(stats)}`,
    `Metrics: ${compactMetricsLine(context)}`,
    trainingLine,
    raceLine,
    `Recent sessions: ${compactRecentActivities(activities)}`,
    "",
    "Baseline from local rules (already checked against the data):",
    compactBaseline(localRecs),
    "",
    `Task: treat the baseline as your fact base – confirm, sharpen or reject it with reasoning instead of rephrasing it. Each description 2–3 sentences: first WHAT the number means, then WHAT to do about it.${raceLine ? " Factor in the upcoming race: adjust recommendations for taper/build-up based on days remaining." : ""} Respect profile and limitations. Note that the all-time stats cover the whole stored period, not the current week.`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * Claude writes the better explanations, but it can also silently skip a finding
 * the rules proved from the data. Any local high-priority recommendation whose
 * category Claude did not touch at all is therefore added back – a whole missing
 * domain is the failure mode
 * worth guarding against, while rewording the same topic is not.
 */
function mergeClaudeWithLocal(
  claudeRecs: Recommendation[],
  localRecs: Recommendation[],
): { recommendations: Recommendation[]; localAdded: number } {
  const coveredCategories = new Set(claudeRecs.map((rec) => rec.category));
  const gaps = localRecs.filter(
    (rec) => rec.priority === "high" && !coveredCategories.has(rec.category),
  );

  const merged = selectRecommendations([...claudeRecs, ...gaps], {
    limit: MAX_RECOMMENDATIONS,
  });

  const claudeTitles = new Set(claudeRecs.map((rec) => rec.title));
  return {
    recommendations: merged,
    localAdded: merged.filter((rec) => !claudeTitles.has(rec.title)).length,
  };
}

export interface AnalysisResult {
  recommendations: Recommendation[];
  source: "claude" | "local";
  /** Token/cost data of the Claude call, null when the local rules answered. */
  usage?: ClaudeUsage | null;
  /**
   * True only when Claude was supposed to run and then failed. Callers must not
   * persist the analysis fingerprint in that case, otherwise the unchanged
   * fingerprint suppresses every retry until new activities show up.
   */
  claudeFailed: boolean;
}

export async function analyzeActivities(
  activities: GarminActivity[],
  stats: DashboardStats,
  context: AnalysisContext,
  trigger: AnalysisTrigger,
): Promise<AnalysisResult> {
  const localRecs = buildLocalRecommendations(activities, stats, context);

  const runClaude = shouldRunClaudeAnalysis(trigger);
  if (!runClaude) {
    return {
      recommendations: localRecs,
      source: "local",
      claudeFailed: false,
      usage: null,
    };
  }

  const claudeAvailable = await isClaudeCliAvailable();
  if (!claudeAvailable) {
    logger.warn("Claude CLI not found – falling back to local rules");
    return {
      recommendations: localRecs,
      source: "local",
      claudeFailed: true,
      usage: null,
    };
  }

  try {
    const prompt = buildAnalysisPrompt(stats, activities, context, localRecs);
    const analysis = await analyzeWithClaudeCli(prompt);

    // Same diversity rule as for the local rules – the model can also return
    // four variants of one theme.
    const claudeRecs = selectRecommendations(analysis.recommendations, {
      limit: MAX_RECOMMENDATIONS,
    });
    const { recommendations, localAdded } = mergeClaudeWithLocal(
      claudeRecs,
      localRecs,
    );

    logger.info(
      `Claude analysis: ${analysis.usage.model ?? "default model"}, ${analysis.usage.inputTokens ?? "?"}→${analysis.usage.outputTokens ?? "?"} tokens, ${
        analysis.usage.costUsd !== null
          ? `$${analysis.usage.costUsd.toFixed(4)}`
          : "cost n/a"
      }, ${analysis.usage.durationMs !== null ? `${Math.round(analysis.usage.durationMs / 1000)}s` : "duration n/a"}${
        localAdded > 0 ? `, +${localAdded} local rule(s)` : ""
      }`,
    );

    return {
      recommendations,
      source: "claude",
      claudeFailed: false,
      usage: { ...analysis.usage, localAdded },
    };
  } catch (error) {
    logger.warn("Claude CLI analysis failed, using local rules", error);
    return {
      recommendations: localRecs,
      source: "local",
      claudeFailed: true,
      usage: null,
    };
  }
}

export function getClaudeAnalysisMode(): AnalysisMode {
  return getAnalysisMode();
}

/**
 * The derived analysis for the dashboard payload. Cheap enough (one pass over at
 * most a few hundred activities) to recompute on every read, which keeps it in
 * sync with the profile without another stored copy that could go stale.
 */
export function buildDashboardAnalysis(
  activities: GarminActivity[],
  garminProfile: Record<string, unknown> | null,
  userProfile: UserProfileSettings,
): DashboardAnalysis {
  const body = resolveBodyMetrics(userProfile, garminProfile);
  return {
    body,
    training: analyzeTraining(activities, body.maxHr),
  };
}

export function createAnalysisContext(
  metrics: {
    profile: Record<string, unknown> | null;
    trainingStatus: Record<string, unknown> | null;
    trainingReadiness: Record<string, unknown> | unknown[] | null;
    vo2max: Record<string, unknown> | unknown[] | null;
    personalRecords: unknown;
    sleepData?: Record<string, unknown> | unknown[] | null;
    healthSnapshot?: Record<string, unknown> | null;
    racePredictions?: Record<string, unknown> | null;
    metricsDate?: string | null;
  },
  userProfile: UserProfileSettings,
  activities: GarminActivity[] = [],
): AnalysisContext {
  const body = resolveBodyMetrics(userProfile, metrics.profile);
  const training = analyzeTraining(activities, body.maxHr);

  return {
    ...metrics,
    userProfile,
    body,
    training,
  };
}
