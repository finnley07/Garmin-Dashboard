export interface ActivityType {
  typeKey: string;
}

export interface ExerciseSetSummary {
  category: string;
  subCategory?: string;
  reps?: number;
  volume?: number;
  duration?: number;
  sets?: number;
  maxWeight?: number;
}

export interface MuscleGroupStat {
  name: string;
  volume: number;
  sets: number;
  reps: number;
  exercises: string[];
}

export interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeLocal: string;
  activityType: ActivityType;
  distance: number;
  duration: number;
  calories: number;
  averageHR?: number;
  maxHR?: number;
  averageSpeed?: number;
  elevationGain?: number;
  elevationLoss?: number;
  locationName?: string;
  trainingEffectLabel?: string;
  aerobicTrainingEffect?: number;
  anaerobicTrainingEffect?: number;
  activityTrainingLoad?: number;
  totalSets?: number;
  totalReps?: number;
  activeSets?: number;
  summarizedExerciseSets?: ExerciseSetSummary[];
  hrTimeInZone_1?: number;
  hrTimeInZone_2?: number;
  hrTimeInZone_3?: number;
  hrTimeInZone_4?: number;
  hrTimeInZone_5?: number;
  moderateIntensityMinutes?: number;
  vigorousIntensityMinutes?: number;
  avgGradeAdjustedSpeed?: number;
  fastestSplit_1000?: number;
  lapCount?: number;
}

export interface ActivityDetail {
  activity: GarminActivity;
  hrZones: Record<string, unknown> | null;
  splits: unknown[] | null;
  exerciseSets: unknown[] | null;
  muscleGroups: MuscleGroupStat[];
  details: Record<string, unknown> | null;
  source?: "local" | "cache" | "remote";
}

export interface DashboardStats {
  totalActivities: number;
  totalDistanceKm: number;
  totalDurationHours: number;
  totalCalories: number;
  avgHeartRate: number;
  activityBreakdown: Record<string, number>;
}

export interface Recommendation {
  category: "training" | "recovery" | "performance" | "general";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface SyncMeta {
  lastSyncedAt: string;
  previousSyncedAt: string | null;
  latestActivityId: number | null;
  latestActivityDate: string | null;
  totalActivities: number;
  newActivitiesCount: number;
  syncMode: "full" | "incremental";
}

export type AthleteType =
  | "bodybuilding"
  | "runner"
  | "cyclist"
  | "swimmer"
  | "hybrid"
  | "triathlon"
  | "general"
  | "other";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type PreferredIntensity = "easy" | "balanced" | "hard";

export interface WeeklyTargets {
  runningSessions: number | null;
  cyclingSessions: number | null;
  strengthSessions: number | null;
  swimmingSessions: number | null;
  otherSessions: number | null;
  otherDescription: string;
  weeklyKm: number | null;
  weeklyHours: number | null;
}

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/**
 * A single planned session type per day. Matches Garmin's own activityType.typeKey
 * for running/cycling/strength_training/swimming, so a day's plan can be checked
 * against synced activities without a translation table; 'other' and 'rest' have
 * no Garmin equivalent and are display-only.
 */
export type PlannedSessionType =
  | "running"
  | "cycling"
  | "strength_training"
  | "swimming"
  | "other"
  | "rest";

export interface WeeklyScheduleEntry {
  type: PlannedSessionType;
  /** Free-text detail, mainly for 'other' (e.g. "Yoga") but usable for any day. */
  note: string;
}

/**
 * Optional day-by-day plan on top of the plain weekly session counts – lets a
 * user say "Monday is strength, Tuesday is a run" instead of just "2x strength,
 * 3x running per week". Any day left null falls back to the count-based targets.
 */
export type WeeklySchedule = Record<WeekdayKey, WeeklyScheduleEntry | null>;

export type BiologicalSex = "male" | "female" | "unspecified";

/**
 * Body data needed to turn absolute thresholds into personal ones: heart rate
 * zones, VO2max reference values, protein/carb targets per kg and energy
 * availability all depend on these. Every field is optional – blanks fall back
 * to Garmin values or to estimates (see body-metrics.ts).
 */
export interface BodyMetrics {
  birthYear: number | null;
  sex: BiologicalSex;
  heightCm: number | null;
  weightKg: number | null;
  restingHr: number | null;
  maxHr: number | null;
}

export interface UserProfileSettings {
  displayName: string;
  athleteType: AthleteType;
  customAthleteType: string;
  experienceLevel: ExperienceLevel;
  preferredIntensity: PreferredIntensity;
  body: BodyMetrics;
  weeklyTargets: WeeklyTargets;
  weeklySchedule: WeeklySchedule;
  customRemarks: string;
  injuryNotes: string;
  personalNotes: string;
  plannedRaces: PlannedRace[];
  updatedAt: string;
}

export type RaceDistanceKey =
  | "5k"
  | "10k"
  | "halfMarathon"
  | "marathon"
  | "other";

export interface PlannedRace {
  id: string;
  name: string;
  date: string;
  distance: RaceDistanceKey;
  targetTimeSeconds: number | null;
}

export interface TrainingStatusHistoryPoint {
  date: string;
  statusKey: string;
  acwr: number | null;
}

import type { ClaudeUsage } from "./claude-cli.js";
import type { ResolvedBodyMetrics } from "./body-metrics.js";
import type { TrainingAnalysis } from "./training-analysis.js";

/**
 * Derived analysis shipped with the dashboard payload. Recomputed on every read
 * instead of stored, so it always matches the current profile and body data.
 */
export interface DashboardAnalysis {
  body: ResolvedBodyMetrics;
  training: TrainingAnalysis;
}

export interface DashboardData {
  profile: Record<string, unknown> | null;
  userProfile: UserProfileSettings;
  activities: GarminActivity[];
  trainingStatus: Record<string, unknown> | null;
  trainingReadiness: Record<string, unknown> | unknown[] | null;
  vo2max: Record<string, unknown> | unknown[] | null;
  personalRecords: unknown;
  sleepData: Record<string, unknown> | unknown[] | null;
  healthSnapshot: Record<string, unknown> | null;
  vo2maxHistory: unknown[] | null;
  readinessHistory: unknown[] | null;
  sleepHistory?: unknown[] | null;
  hrvHistory?: unknown[] | null;
  stressHistory?: unknown[] | null;
  bodyBatteryHistory?: unknown[] | null;
  trainingStatusHistory?: TrainingStatusHistoryPoint[];
  racePredictions: Record<string, unknown> | null;
  stats: DashboardStats;
  recommendations: Recommendation[];
  analysisSource: "claude" | "local";
  claudeUsage?: ClaudeUsage | null;
  fetchedAt: string;
  sync: SyncMeta;
  analysis?: DashboardAnalysis | null;
}

export interface StoredData {
  version: 1;
  profile: Record<string, unknown> | null;
  activities: GarminActivity[];
  trainingStatus: Record<string, unknown> | null;
  trainingReadiness: Record<string, unknown> | unknown[] | null;
  vo2max: Record<string, unknown> | unknown[] | null;
  personalRecords: unknown;
  sleepData?: Record<string, unknown> | unknown[] | null;
  healthSnapshot?: Record<string, unknown> | null;
  vo2maxHistory?: unknown[] | null;
  readinessHistory?: unknown[] | null;
  sleepHistory?: unknown[] | null;
  hrvHistory?: unknown[] | null;
  stressHistory?: unknown[] | null;
  bodyBatteryHistory?: unknown[] | null;
  trainingStatusHistory?: TrainingStatusHistoryPoint[];
  racePredictions?: Record<string, unknown> | null;
  stats: DashboardStats;
  recommendations: Recommendation[];
  analysisSource: "claude" | "local";
  analysisFingerprint?: string;
  lastAnalyzedAt?: string;
  /** Tokens, price and duration of the last Claude call. */
  claudeUsage?: ClaudeUsage | null;
  /** Day the wellness metrics belong to – Garmin reports them with one day lag. */
  metricsDate?: string;
  fetchedAt: string;
  sync: SyncMeta;
}
