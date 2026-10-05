import { describe, expect, it, vi } from "vitest";

const configState = {
  language: "de" as "de" | "en",
  claudeAnalysisMode: "off" as const,
  claudeMaxActivities: 5,
  claudeModel: "",
};

vi.mock("./app-config.js", () => ({
  getAppConfig: () => configState,
}));

const { analyzeActivities, computeStats, createAnalysisContext } =
  await import("./analysis.js");
const { DEFAULT_USER_PROFILE } = await import("./user-profile.js");

const NOW = Date.now();
function daysAgo(days: number): string {
  return (
    new Date(NOW - days * 86400000).toISOString().slice(0, 10) + " 07:00:00"
  );
}

// A profile + activity mix that reliably fires several local rules at once
// (weekly target miss, injury note, low readiness) across both languages.
const activities = [
  {
    activityId: 1,
    activityName: "Run",
    activityType: { typeKey: "running" },
    startTimeLocal: daysAgo(1),
    distance: 5000,
    duration: 1800,
    calories: 300,
    averageHR: 140,
  },
] as never;

function buildContext(profile: unknown) {
  const stats = computeStats(activities);
  const context = createAnalysisContext(
    {
      profile: null,
      trainingStatus: null,
      trainingReadiness: { score: 40 },
      vo2max: null,
      personalRecords: null,
    },
    profile as never,
    activities,
  );
  return { stats, context };
}

const GERMAN_MARKERS = ["ä", "ö", "ü", "ß", "Bereitschaft", "Einheiten"];
const ENGLISH_ONLY_WORDS = ["readiness", "training", "week"];

describe("recommendation language follows the app language setting", () => {
  it("returns German titles and descriptions when language is de", async () => {
    configState.language = "de";
    const profile = { ...DEFAULT_USER_PROFILE, injuryNotes: "Knie" };
    const { stats, context } = buildContext(profile);

    const result = await analyzeActivities(activities, stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    expect(result.source).toBe("local");
    expect(result.recommendations.length).toBeGreaterThan(0);
    const text = result.recommendations
      .map((r) => `${r.title} ${r.description}`)
      .join(" ");
    expect(text).toMatch(/Bereitschaft|Einschränkungen|Regeneration/);
  });

  it("returns English titles and descriptions when language is en", async () => {
    configState.language = "en";
    const profile = { ...DEFAULT_USER_PROFILE, injuryNotes: "Knee" };
    const { stats, context } = buildContext(profile);

    const result = await analyzeActivities(activities, stats, context, {
      newCount: 0,
      fingerprint: "x",
      hasRecommendations: false,
      forceLocal: true,
    });

    expect(result.source).toBe("local");
    const text = result.recommendations
      .map((r) => `${r.title} ${r.description}`)
      .join(" ");

    // No German-only characters or words should leak into the English output.
    for (const marker of GERMAN_MARKERS) {
      expect(text).not.toContain(marker);
    }
    expect(text.toLowerCase()).toMatch(/readiness|recovery|limitation/);
  });
});
