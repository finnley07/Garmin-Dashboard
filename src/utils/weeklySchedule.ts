import type {
  GarminActivity,
  PlannedSessionType,
  WeekdayKey,
  WeeklySchedule,
  WeeklyScheduleEntry,
} from "../types/garmin";

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const WEEKDAY_BY_JS_INDEX: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export function weekdayKeyFor(date: Date): WeekdayKey {
  return WEEKDAY_BY_JS_INDEX[date.getDay()]!;
}

export interface TodaySchedule {
  weekday: WeekdayKey;
  entry: WeeklyScheduleEntry;
  /** 'rest' and 'other' days have no reliable auto-detection, so they never resolve to 'done'. */
  status: "planned" | "done";
  completedActivity: GarminActivity | null;
}

/**
 * Looks up what the profile's weekly schedule says about today, and – for
 * session types that map to a Garmin activity type – whether a matching
 * activity was already synced for today.
 *
 * 'other' and 'rest' stay 'planned' even once activities exist: 'other' has no
 * Garmin type to match against, and 'rest' isn't something to mark "done".
 */
export function getTodaySchedule(
  schedule: WeeklySchedule,
  activities: GarminActivity[],
  now = new Date(),
): TodaySchedule | null {
  const weekday = weekdayKeyFor(now);
  const entry = schedule[weekday];
  if (!entry) return null;

  if (entry.type === "rest" || entry.type === "other") {
    return { weekday, entry, status: "planned", completedActivity: null };
  }

  const todayKey = localDateKey(now);
  const completedActivity =
    activities.find(
      (activity) =>
        activity.startTimeLocal.slice(0, 10) === todayKey &&
        activity.activityType?.typeKey === entry.type,
    ) ?? null;

  return {
    weekday,
    entry,
    status: completedActivity ? "done" : "planned",
    completedActivity,
  };
}

export const SESSION_TYPE_VALUES: PlannedSessionType[] = [
  "running",
  "cycling",
  "strength_training",
  "swimming",
  "other",
  "rest",
];
