import { describe, expect, it, vi } from "vitest";

const state = {
  claudeMode: "smart" as "smart" | "always" | "off",
  stored: null as Record<string, unknown> | null,
};

const analyzeActivitiesMock = vi.fn(
  async (
    _activities?: unknown,
    _stats?: unknown,
    _context?: unknown,
    _trigger?: unknown,
  ) => ({
    recommendations: [
      { category: "training", priority: "high", title: "T", description: "D" },
    ],
    source: "claude" as const,
    claudeFailed: false,
    usage: {
      model: "x",
      inputTokens: 1,
      outputTokens: 1,
      cacheReadTokens: null,
      costUsd: null,
      durationMs: null,
      effort: null,
      ranAt: "now",
    },
  }),
);

const saveStoredDataMock = vi.fn(async () => undefined);

vi.mock("./analysis.js", () => ({
  getClaudeAnalysisMode: () => state.claudeMode,
  computeStats: () => ({
    totalActivities: 1,
    totalDistanceKm: 1,
    totalDurationHours: 1,
    totalCalories: 1,
    avgHeartRate: 1,
    activityBreakdown: {},
  }),
  createAnalysisContext: (
    metrics: Record<string, unknown>,
    profile: unknown,
  ) => ({
    ...metrics,
    userProfile: profile,
  }),
  computeAnalysisFingerprint: () => "fp-1",
  analyzeActivities: analyzeActivitiesMock,
}));

vi.mock("./storage.js", () => ({
  loadStoredData: async () => state.stored,
  saveStoredData: saveStoredDataMock,
  toDashboardData: (stored: Record<string, unknown>, profile: unknown) => ({
    ...stored,
    userProfile: profile,
  }),
}));

const { runManualReanalysis } = await import("./profile-sync.js");
const { DEFAULT_USER_PROFILE } = await import("./user-profile.js");

function storedWithActivities() {
  return {
    activities: [{ activityId: 1 }],
    recommendations: [],
    analysisFingerprint: "old-fingerprint",
    lastAnalyzedAt: undefined,
  };
}

describe("runManualReanalysis", () => {
  it("refuses to call Claude when the analysis mode is off, without touching storage", async () => {
    state.claudeMode = "off";
    state.stored = storedWithActivities();
    analyzeActivitiesMock.mockClear();
    saveStoredDataMock.mockClear();

    const result = await runManualReanalysis(DEFAULT_USER_PROFILE);

    expect(result).toEqual({ status: "claude-off" });
    expect(analyzeActivitiesMock).not.toHaveBeenCalled();
    expect(saveStoredDataMock).not.toHaveBeenCalled();
  });

  it("reports no-data when nothing has been synced yet", async () => {
    state.claudeMode = "smart";
    state.stored = null;

    const result = await runManualReanalysis(DEFAULT_USER_PROFILE);

    expect(result).toEqual({ status: "no-data" });
  });

  it("bypasses the smart-mode fingerprint gate by forcing profileChanged and not forceLocal", async () => {
    state.claudeMode = "smart";
    state.stored = storedWithActivities();
    analyzeActivitiesMock.mockClear();

    const result = await runManualReanalysis(DEFAULT_USER_PROFILE);

    expect(result.status).toBe("ok");
    expect(analyzeActivitiesMock).toHaveBeenCalledTimes(1);
    const trigger = analyzeActivitiesMock.mock.calls[0]![3];
    expect(trigger).toMatchObject({ forceLocal: false, profileChanged: true });
  });

  it("surfaces claudeFailed so the caller can tell the user Claude fell back to local rules", async () => {
    state.claudeMode = "smart";
    state.stored = storedWithActivities();
    analyzeActivitiesMock.mockResolvedValueOnce({
      recommendations: [],
      source: "local",
      claudeFailed: true,
      usage: null,
    } as never);

    const result = await runManualReanalysis(DEFAULT_USER_PROFILE);

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.claudeFailed).toBe(true);
    }
  });
});
