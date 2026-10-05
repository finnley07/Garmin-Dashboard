import { describe, expect, it, vi } from "vitest";

const state = { language: "de" as "de" | "en" };

vi.mock("./app-config.js", () => ({
  getAppConfig: () => ({ language: state.language, claudeMaxActivities: 5 }),
}));

const { analyzeActivities, computeStats, createAnalysisContext } =
  await import("./analysis.js");
const { DEFAULT_USER_PROFILE } = await import("./user-profile.js");

const NOW = Date.now();

/** Every "weekly target" phrase the old rules used to produce, in both languages. */
const NAGGING_PHRASES = [
  "Wochenziel offen",
  "weekly target open",
  "Einheiten fehlen",
  "sessions missing",
  "Gesamtplan hinterher",
  "Behind the overall plan",
  "unter Plan",
  "behind plan",
  "Trainingszeit ausbauen",
  "Increase training time",
  "verfehlt",
  "missed",
  "Lauf-Einheit fehlt",
  "Missing a run",
  "Kraftanteil im Hybrid-Plan",
  "Laufanteil im Hybrid-Plan",
];

function buildEmptyWeekContext(profile: unknown) {
  const stats = computeStats([]);
  const context = createAnalysisContext(
    {
      profile: null,
      trainingStatus: null,
      trainingReadiness: null,
      vo2max: null,
      personalRecords: null,
    },
    profile as never,
    [],
  );
  return { stats, context };
}

describe("weekly-target recommendations do not fire on a fresh, empty week", () => {
  it('produces no "target missed" style tip for a hybrid profile with zero sessions logged (e.g. Monday morning)', async () => {
    state.language = "de";
    const profile = {
      ...DEFAULT_USER_PROFILE,
      athleteType: "hybrid" as const,
      weeklyTargets: {
        ...DEFAULT_USER_PROFILE.weeklyTargets,
        runningSessions: 3,
        strengthSessions: 2,
        weeklyKm: 30,
        weeklyHours: 5,
      },
    };
    const { stats, context } = buildEmptyWeekContext(profile);

    const result = await analyzeActivities([], stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    const text = result.recommendations
      .map((r) => `${r.title} ${r.description}`)
      .join(" | ");
    for (const phrase of NAGGING_PHRASES) {
      expect(text).not.toContain(phrase);
    }
  });

  it('stays quiet for a bodybuilding profile too (previously flagged "Kraftfokus verfehlt" the moment any other session existed)', async () => {
    state.language = "de";
    const profile = {
      ...DEFAULT_USER_PROFILE,
      athleteType: "bodybuilding" as const,
      weeklyTargets: {
        ...DEFAULT_USER_PROFILE.weeklyTargets,
        strengthSessions: 4,
      },
    };
    const { stats, context } = buildEmptyWeekContext(profile);

    const result = await analyzeActivities([], stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    const text = result.recommendations
      .map((r) => `${r.title} ${r.description}`)
      .join(" | ");
    expect(text).not.toContain("Kraftfokus verfehlt");
  });

  it('still warns a beginner about doing too much, since that is not a "training missing" tip', async () => {
    state.language = "de";
    const profile = {
      ...DEFAULT_USER_PROFILE,
      experienceLevel: "beginner" as const,
      weeklyTargets: {
        ...DEFAULT_USER_PROFILE.weeklyTargets,
        runningSessions: 2,
      },
    };
    // computeRecentWeekStats counts the current *calendar* week (Monday-based),
    // not a rolling 7 days, so the fixtures must stay inside it - two sessions
    // on each already-elapsed weekday is enough to clear plannedMax(2) + 2.
    const monday = new Date(NOW);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const activities = Array.from({ length: 10 }, (_, i) => {
      const day = new Date(monday.getTime() + Math.floor(i / 2) * 86400000);
      return {
        activityId: i + 1,
        activityName: "Run",
        activityType: { typeKey: "running" },
        startTimeLocal: `${day.toISOString().slice(0, 10)} 0${(i % 2) + 6}:00:00`,
        distance: 5000,
        duration: 1800,
        calories: 300,
      };
    }) as never;
    const { stats, context } = buildEmptyWeekContext(profile);

    const result = await analyzeActivities(activities, stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    expect(
      result.recommendations.some((r) =>
        r.title.includes("Steigerung dosieren"),
      ),
    ).toBe(true);
  });

  it('still reminds about injury notes, since that is a safety tip, not a "training missing" tip', async () => {
    state.language = "de";
    const profile = { ...DEFAULT_USER_PROFILE, injuryNotes: "Knie schont" };
    const { stats, context } = buildEmptyWeekContext(profile);

    const result = await analyzeActivities([], stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    expect(
      result.recommendations.some((r) =>
        r.title.includes("Einschränkungen beachten"),
      ),
    ).toBe(true);
  });
});
