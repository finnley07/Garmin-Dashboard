import fs from "fs/promises";
import path from "path";
import { buildDashboardAnalysis } from "./analysis.js";
import { DEFAULT_USER_PROFILE, loadUserProfile } from "./user-profile.js";
import type {
  DashboardData,
  GarminActivity,
  StoredData,
  SyncMeta,
  UserProfileSettings,
} from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "garmin-store.json");

export async function loadStoredData(): Promise<StoredData | null> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    return JSON.parse(raw) as StoredData;
  } catch {
    return null;
  }
}

export async function saveStoredData(data: StoredData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function getLatestActivity(activities: GarminActivity[]): {
  latestActivityId: number | null;
  latestActivityDate: string | null;
} {
  if (activities.length === 0) {
    return { latestActivityId: null, latestActivityDate: null };
  }

  const sorted = [...activities].sort(
    (a, b) =>
      new Date(b.startTimeLocal).getTime() -
      new Date(a.startTimeLocal).getTime(),
  );
  const latest = sorted[0]!;
  return {
    latestActivityId: latest.activityId,
    latestActivityDate: latest.startTimeLocal.slice(0, 10),
  };
}

export function mergeActivities(
  existing: GarminActivity[],
  incoming: GarminActivity[],
): { merged: GarminActivity[]; newCount: number } {
  const byId = new Map<number, GarminActivity>();
  for (const activity of existing) {
    byId.set(activity.activityId, activity);
  }

  let newCount = 0;
  for (const activity of incoming) {
    if (!byId.has(activity.activityId)) newCount++;
    byId.set(activity.activityId, activity);
  }

  const merged = [...byId.values()].sort(
    (a, b) =>
      new Date(b.startTimeLocal).getTime() -
      new Date(a.startTimeLocal).getTime(),
  );

  return { merged, newCount };
}

export function toDashboardData(
  stored: StoredData,
  userProfile?: UserProfileSettings,
): DashboardData {
  const resolvedProfile = userProfile ?? { ...DEFAULT_USER_PROFILE };

  return {
    profile: stored.profile,
    userProfile: resolvedProfile,
    activities: stored.activities,
    trainingStatus: stored.trainingStatus,
    trainingReadiness: stored.trainingReadiness,
    vo2max: stored.vo2max,
    personalRecords: stored.personalRecords,
    sleepData: stored.sleepData ?? null,
    healthSnapshot: stored.healthSnapshot ?? null,
    vo2maxHistory: stored.vo2maxHistory ?? null,
    readinessHistory: stored.readinessHistory ?? null,
    sleepHistory: stored.sleepHistory ?? null,
    hrvHistory: stored.hrvHistory ?? null,
    stressHistory: stored.stressHistory ?? null,
    bodyBatteryHistory: stored.bodyBatteryHistory ?? null,
    trainingStatusHistory: stored.trainingStatusHistory ?? [],
    racePredictions: stored.racePredictions ?? null,
    stats: stored.stats,
    recommendations: stored.recommendations,
    analysisSource: stored.analysisSource,
    claudeUsage: stored.claudeUsage ?? null,
    fetchedAt: stored.fetchedAt,
    sync: stored.sync,
    analysis: buildDashboardAnalysis(
      stored.activities,
      stored.profile,
      resolvedProfile,
    ),
  };
}

export async function toDashboardDataWithProfile(
  stored: StoredData,
): Promise<DashboardData> {
  const userProfile = await loadUserProfile();
  return toDashboardData(stored, userProfile);
}

export function buildSyncMeta(
  activities: GarminActivity[],
  newCount: number,
  mode: SyncMeta["syncMode"],
  previousSyncedAt: string | null,
): SyncMeta {
  const { latestActivityId, latestActivityDate } =
    getLatestActivity(activities);
  return {
    lastSyncedAt: new Date().toISOString(),
    previousSyncedAt: previousSyncedAt,
    latestActivityId,
    latestActivityDate,
    totalActivities: activities.length,
    newActivitiesCount: newCount,
    syncMode: mode,
  };
}
