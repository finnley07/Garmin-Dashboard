import type {
  BiologicalSex,
  BodyMetrics,
  UserProfileSettings,
} from "./types.js";

/**
 * Body data actually used by the analysis: the profile wins, then Garmin,
 * then an estimate. `sources` records where each value came from so the UI and
 * the Claude prompt can say "estimated" instead of pretending it is measured.
 */
export interface ResolvedBodyMetrics {
  age: number | null;
  sex: BiologicalSex;
  heightCm: number | null;
  weightKg: number | null;
  restingHr: number | null;
  maxHr: number | null;
  /** Basal metabolic rate (Mifflin-St Jeor), null when height/weight/age are missing. */
  bmrKcal: number | null;
  sources: {
    weight: "profile" | "garmin" | "none";
    maxHr: "profile" | "garmin" | "estimated" | "none";
    height: "profile" | "garmin" | "none";
    age: "profile" | "garmin" | "none";
  };
}

export const DEFAULT_BODY_METRICS: BodyMetrics = {
  birthYear: null,
  sex: "unspecified",
  heightCm: null,
  weightKg: null,
  restingHr: null,
  maxHr: null,
};

function numberOrNull(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function readGarminNumber(
  garminProfile: Record<string, unknown> | null | undefined,
  keys: string[],
  min: number,
  max: number,
): number | null {
  if (!garminProfile) return null;
  for (const key of keys) {
    const direct = numberOrNull(garminProfile[key], min, max);
    if (direct !== null) return direct;
  }

  // Garmin nests the interesting values one level down, depending on endpoint.
  for (const value of Object.values(garminProfile)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const nested = value as Record<string, unknown>;
    for (const key of keys) {
      const found = numberOrNull(nested[key], min, max);
      if (found !== null) return found;
    }
  }

  return null;
}

/** Tanaka et al. (2001) – closer to measured values than the old 220-age rule. */
export function estimateMaxHr(age: number): number {
  return Math.round(208 - 0.7 * age);
}

/** Mifflin-St Jeor; the sex term is skipped when the sex is unspecified. */
export function estimateBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return Math.round(base + 5);
  if (sex === "female") return Math.round(base - 161);
  return Math.round(base - 78);
}

export function resolveBodyMetrics(
  profile: UserProfileSettings,
  garminProfile?: Record<string, unknown> | null,
): ResolvedBodyMetrics {
  const body = profile.body ?? DEFAULT_BODY_METRICS;
  const currentYear = new Date().getUTCFullYear();

  const garminAge = readGarminNumber(
    garminProfile,
    ["age", "userAge"],
    10,
    100,
  );
  const profileAge = body.birthYear ? currentYear - body.birthYear : null;
  const age = profileAge ?? garminAge;
  const ageSource =
    profileAge !== null ? "profile" : garminAge !== null ? "garmin" : "none";

  const garminHeight = readGarminNumber(
    garminProfile,
    ["height", "heightInCm"],
    100,
    250,
  );
  const heightCm = body.heightCm ?? garminHeight;
  const heightSource = body.heightCm
    ? "profile"
    : garminHeight !== null
      ? "garmin"
      : "none";

  // Garmin reports weight in grams on some endpoints, so the raw range has to
  // allow both and the unit is decided afterwards.
  const garminWeightRaw = readGarminNumber(
    garminProfile,
    ["weight", "weightInKg"],
    25,
    350_000,
  );
  const garminWeightKg =
    garminWeightRaw === null
      ? null
      : garminWeightRaw > 350
        ? Math.round((garminWeightRaw / 1000) * 10) / 10
        : garminWeightRaw;
  const weightKg = body.weightKg ?? garminWeightKg;
  const weightSource = body.weightKg
    ? "profile"
    : garminWeightKg !== null
      ? "garmin"
      : "none";

  const garminMaxHr = readGarminNumber(
    garminProfile,
    ["maxHeartRate", "maxHr"],
    120,
    230,
  );
  const estimatedMaxHr = age !== null ? estimateMaxHr(age) : null;
  const maxHr = body.maxHr ?? garminMaxHr ?? estimatedMaxHr;
  const maxHrSource = body.maxHr
    ? "profile"
    : garminMaxHr !== null
      ? "garmin"
      : estimatedMaxHr !== null
        ? "estimated"
        : "none";

  const restingHr =
    body.restingHr ??
    readGarminNumber(garminProfile, ["restingHeartRate", "restingHr"], 30, 110);

  const bmrKcal =
    weightKg !== null && heightCm !== null && age !== null
      ? estimateBmr(weightKg, heightCm, age, body.sex)
      : null;

  return {
    age,
    sex: body.sex,
    heightCm,
    weightKg,
    restingHr,
    maxHr,
    bmrKcal,
    sources: {
      weight: weightSource,
      maxHr: maxHrSource,
      height: heightSource,
      age: ageSource,
    },
  };
}

/**
 * Age/sex reference for VO2max in ml/kg/min, roughly the "good" band from the
 * Cooper Institute norms. Used instead of a flat threshold so the same number
 * is not flagged as weak for a 55-year-old and fine for a 25-year-old.
 */
export function vo2maxReference(
  age: number | null,
  sex: BiologicalSex,
): number | null {
  if (age === null) return null;

  const maleBands: Array<[number, number]> = [
    [29, 48],
    [39, 44],
    [49, 41],
    [59, 37],
    [200, 33],
  ];
  const femaleBands: Array<[number, number]> = [
    [29, 41],
    [39, 38],
    [49, 35],
    [59, 32],
    [200, 28],
  ];

  const bands =
    sex === "female"
      ? femaleBands
      : sex === "male"
        ? maleBands
        : maleBands.map(([limit, value], index) => {
            const female = femaleBands[index]![1];
            return [limit, Math.round((value + female) / 2)] as [
              number,
              number,
            ];
          });

  for (const [limit, value] of bands) {
    if (age <= limit) return value;
  }
  return null;
}

/** Compact body line for the Claude prompt – only the values that exist. */
export function compactBodyLine(body: ResolvedBodyMetrics): string {
  const parts: string[] = [];
  if (body.age !== null) parts.push(`${body.age}y`);
  if (body.sex !== "unspecified") parts.push(body.sex === "male" ? "m" : "f");
  if (body.weightKg !== null) parts.push(`${Math.round(body.weightKg)}kg`);
  if (body.heightCm !== null) parts.push(`${Math.round(body.heightCm)}cm`);
  if (body.maxHr !== null) {
    parts.push(
      `MaxHR ${body.maxHr}${body.sources.maxHr === "estimated" ? "(est.)" : ""}`,
    );
  }
  if (body.restingHr !== null) parts.push(`RestHR ${body.restingHr}`);
  if (body.bmrKcal !== null) parts.push(`BMR ~${body.bmrKcal}kcal`);
  return parts.length > 0 ? parts.join(" ") : "";
}
