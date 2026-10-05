import { describe, expect, it } from "vitest";
import {
  estimateBmr,
  estimateMaxHr,
  resolveBodyMetrics,
  vo2maxReference,
} from "./body-metrics.js";
import { DEFAULT_USER_PROFILE } from "./user-profile.js";
import type { UserProfileSettings } from "./types.js";

function profileWith(
  body: Partial<UserProfileSettings["body"]>,
): UserProfileSettings {
  return {
    ...DEFAULT_USER_PROFILE,
    body: { ...DEFAULT_USER_PROFILE.body, ...body },
  };
}

describe("resolveBodyMetrics", () => {
  it("prefers profile values and records the source", () => {
    const resolved = resolveBodyMetrics(
      profileWith({
        weightKg: 80,
        heightCm: 182,
        maxHr: 192,
        birthYear: 1990,
        sex: "male",
      }),
      { weight: 90000, height: 175, maxHeartRate: 180 },
    );

    expect(resolved.weightKg).toBe(80);
    expect(resolved.maxHr).toBe(192);
    expect(resolved.sources.weight).toBe("profile");
    expect(resolved.sources.maxHr).toBe("profile");
  });

  it("converts the Garmin weight from grams", () => {
    const resolved = resolveBodyMetrics(profileWith({}), { weight: 90000 });

    expect(resolved.weightKg).toBe(90);
    expect(resolved.sources.weight).toBe("garmin");
  });

  it("estimates max HR from age when nothing else is known", () => {
    const year = new Date().getUTCFullYear();
    const resolved = resolveBodyMetrics(
      profileWith({ birthYear: year - 40 }),
      null,
    );

    expect(resolved.age).toBe(40);
    expect(resolved.maxHr).toBe(estimateMaxHr(40));
    expect(resolved.sources.maxHr).toBe("estimated");
  });

  it("computes BMR only with weight, height and age", () => {
    const year = new Date().getUTCFullYear();
    const complete = resolveBodyMetrics(
      profileWith({
        weightKg: 80,
        heightCm: 180,
        birthYear: year - 30,
        sex: "male",
      }),
      null,
    );
    const incomplete = resolveBodyMetrics(profileWith({ weightKg: 80 }), null);

    expect(complete.bmrKcal).toBe(estimateBmr(80, 180, 30, "male"));
    expect(incomplete.bmrKcal).toBeNull();
  });

  it("reads nested Garmin profile values", () => {
    const resolved = resolveBodyMetrics(profileWith({}), {
      userData: { weight: 72000, height: 176, maxHeartRate: 188 },
    });

    expect(resolved.weightKg).toBe(72);
    expect(resolved.heightCm).toBe(176);
    expect(resolved.maxHr).toBe(188);
  });

  it("rejects implausible values instead of using them", () => {
    const resolved = resolveBodyMetrics(profileWith({}), {
      weight: 5,
      height: 12,
    });

    expect(resolved.weightKg).toBeNull();
    expect(resolved.heightCm).toBeNull();
  });
});

describe("vo2maxReference", () => {
  it("drops with age", () => {
    const young = vo2maxReference(25, "male");
    const old = vo2maxReference(58, "male");

    expect(young).not.toBeNull();
    expect(old).not.toBeNull();
    expect(young!).toBeGreaterThan(old!);
  });

  it("differs by sex and averages when unspecified", () => {
    const male = vo2maxReference(35, "male")!;
    const female = vo2maxReference(35, "female")!;
    const unspecified = vo2maxReference(35, "unspecified")!;

    expect(male).toBeGreaterThan(female);
    expect(unspecified).toBeGreaterThan(female);
    expect(unspecified).toBeLessThan(male);
  });

  it("returns null without an age", () => {
    expect(vo2maxReference(null, "male")).toBeNull();
  });
});
