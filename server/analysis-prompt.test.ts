import { describe, expect, it } from "vitest";
import {
  buildAnalysisPrompt,
  computeStats,
  createAnalysisContext,
} from "./analysis.js";
import { DEFAULT_USER_PROFILE } from "./user-profile.js";
import type { GarminActivity, Recommendation } from "./types.js";

const activities: GarminActivity[] = [
  {
    activityId: 2,
    activityName: "Run",
    activityType: { typeId: 1, typeKey: "running" },
    startTimeLocal: "2026-08-16 07:00:00",
    distance: 12400,
    duration: 3660,
    averageHR: 148,
    calories: 800,
  } as GarminActivity,
  {
    activityId: 1,
    activityName: "Strength",
    activityType: { typeId: 13, typeKey: "strength_training" },
    startTimeLocal: "2024-02-11 18:00:00",
    distance: 0,
    duration: 3300,
    averageHR: 112,
    calories: 300,
  } as GarminActivity,
];

const localRecs: Recommendation[] = [
  {
    category: "training",
    priority: "medium",
    title: "Kilometerziel unter Plan",
    description: '32/40 km diese Woche für „Hybrid".',
  },
];

function buildContext() {
  return createAnalysisContext(
    {
      profile: null,
      trainingStatus: null,
      trainingReadiness: { score: 62 },
      vo2max: null,
      personalRecords: null,
      metricsDate: "2026-08-16",
    },
    DEFAULT_USER_PROFILE,
    activities,
  );
}

describe("buildAnalysisPrompt", () => {
  const stats = computeStats(activities);
  const context = buildContext();

  it('states the current date so the model can anchor "today"', () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );
    const today = new Date().toISOString().slice(0, 10);

    expect(prompt).toContain(`Heute: ${today}`);
  });

  it("labels the metrics date, which lags one day behind", () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );

    expect(prompt).toContain("Wellness-Metriken vom 2026-08-16");
  });

  it("gives the all-time stats a start date instead of a bare number", () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );

    expect(prompt).toContain("Gesamt (seit 2024-02-11)");
  });

  it("passes the baseline reasoning, not just the titles", () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );

    expect(prompt).toContain("Kilometerziel unter Plan");
    expect(prompt).toContain("32/40 km diese Woche");
  });

  it("follows the configured language", () => {
    const german = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );
    const english = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "en",
    );

    expect(german).toContain("Antworte auf Deutsch");
    expect(english).toContain("Answer in English");
    expect(english).toContain("Today:");
  });

  it("stays compact – the prompt is sent on every analysis", () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );

    expect(prompt.length).toBeLessThan(4000);
  });

  it("includes the upcoming race and a taper/build-up instruction when one is planned", () => {
    const contextWithRace = createAnalysisContext(
      {
        profile: null,
        trainingStatus: null,
        trainingReadiness: { score: 62 },
        vo2max: null,
        personalRecords: null,
        racePredictions: { timeMarathon: 12388 },
        metricsDate: "2026-08-16",
      },
      {
        ...DEFAULT_USER_PROFILE,
        plannedRaces: [
          {
            id: "1",
            name: "Berlin Marathon",
            date: "2099-10-15",
            distance: "marathon",
            targetTimeSeconds: 12600,
          },
        ],
      },
      activities,
    );

    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      contextWithRace,
      localRecs,
      "de",
    );

    expect(prompt).toContain("Berlin Marathon in");
    expect(prompt).toContain("anstehende Rennen");
  });

  it("omits any race mention when no race is planned", () => {
    const prompt = buildAnalysisPrompt(
      stats,
      activities,
      context,
      localRecs,
      "de",
    );

    expect(prompt).not.toContain("Race:");
    expect(prompt).not.toContain("anstehende Rennen");
  });
});
