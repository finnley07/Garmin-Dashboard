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

export type TargetFieldKey =
  | "runningSessions"
  | "cyclingSessions"
  | "strengthSessions"
  | "swimmingSessions"
  | "weeklyKm"
  | "weeklyHours";

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
export type PlannedSessionType =
  | "running"
  | "cycling"
  | "strength_training"
  | "swimming"
  | "other"
  | "rest";

export interface WeeklyScheduleEntry {
  type: PlannedSessionType;
  note: string;
}

export type WeeklySchedule = Record<WeekdayKey, WeeklyScheduleEntry | null>;

export type BiologicalSex = "male" | "female" | "unspecified";

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

export interface ResolvedBodyMetrics {
  age: number | null;
  sex: BiologicalSex;
  heightCm: number | null;
  weightKg: number | null;
  restingHr: number | null;
  maxHr: number | null;
  bmrKcal: number | null;
  sources: {
    weight: "profile" | "garmin" | "none";
    maxHr: "profile" | "garmin" | "estimated" | "none";
    height: "profile" | "garmin" | "none";
    age: "profile" | "garmin" | "none";
  };
}

export interface IntensityDistribution {
  easyMinutes: number;
  moderateMinutes: number;
  hardMinutes: number;
  easySharePct: number;
  moderateSharePct: number;
  hardSharePct: number;
  verdict: "too-hard" | "balanced" | "too-easy";
}

export interface TrainingAnalysis {
  loadSource: "garmin" | "estimated" | "duration" | "none";
  dailyLoad: Array<{
    date: string;
    load: number;
    sessions: number;
    minutes: number;
  }>;
  acuteLoad7d: number;
  chronicLoadWeekly: number;
  acwr: number | null;
  monotony: number | null;
  strain: number | null;
  weeklyLoads: number[];
  loadTrendPct: number | null;
  intensity: IntensityDistribution | null;
  aerobicTeAvg: number | null;
  anaerobicTeAvg: number | null;
  sessions7d: number;
  sessions28d: number;
  restDays7d: number;
  longestGapDays: number;
  daysSinceLastSession: number | null;
  byType7d: Record<
    string,
    { sessions: number; km: number; hours: number; load: number }
  >;
  longestSessionMinutes7d: number;
  strengthShare28dPct: number | null;
}

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
  sleepData?: unknown;
  healthSnapshot?: unknown;
  vo2maxHistory?: unknown[] | null;
  readinessHistory?: unknown[] | null;
  sleepHistory?: unknown[] | null;
  hrvHistory?: unknown[] | null;
  stressHistory?: unknown[] | null;
  bodyBatteryHistory?: unknown | null;
  trainingStatusHistory?: TrainingStatusHistoryPoint[];
  racePredictions?: unknown;
  stats: DashboardStats;
  recommendations: Recommendation[];
  analysisSource: "claude" | "local";
  claudeUsage?: import("./appConfig").ClaudeUsage | null;
  fetchedAt: string;
  sync: SyncMeta;
  analysis?: DashboardAnalysis | null;
}
