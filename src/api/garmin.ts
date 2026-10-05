import type {
  ActivityDetail,
  DashboardData,
  Recommendation,
  SyncMeta,
  UserProfileSettings,
} from "../types/garmin";
import type {
  AppConfigInput,
  AppConfigPublic,
  AppConfigSaveResult,
  ActivityRouteResult,
  BackupBundle,
  ClaudeTestResult,
  SyncProgress,
} from "../types/appConfig";

const API_BASE = "/api";
const detailCache = new Map<number, ActivityDetail>();

export function getCachedActivityDetail(
  activityId: number,
): ActivityDetail | undefined {
  return detailCache.get(activityId);
}

export function clearActivityDetailCache(): void {
  detailCache.clear();
}

export async function fetchHealth(): Promise<{
  ok: boolean;
  setupCompleted: boolean;
  hasGarminCredentials: boolean;
  hasClaudeCli: boolean;
  claudeAnalysisMode: "smart" | "always" | "off";
  claudeAuth: { needsLogin: boolean; message: string | null };
}> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

/**
 * `claude auth login` needs a real browser + terminal, so this only opens a
 * new console window for the user to complete it in - it cannot finish the
 * login itself.
 */
export async function relaunchClaudeLogin(): Promise<{
  started: boolean;
  reason?: string;
}> {
  const res = await fetch(`${API_BASE}/claude-relogin`, { method: "POST" });
  return res.json();
}

export async function fetchAppConfig(): Promise<AppConfigPublic> {
  const res = await fetch(`${API_BASE}/app-config`);
  if (!res.ok) throw new Error("Konfiguration konnte nicht geladen werden");
  return res.json();
}

export async function saveAppConfig(
  input: AppConfigInput,
): Promise<AppConfigSaveResult> {
  const res = await fetch(`${API_BASE}/app-config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }

  return res.json();
}

export async function readGarminData(
  forceFull = false,
): Promise<DashboardData> {
  const url = forceFull
    ? `${API_BASE}/read-data?full=true`
    : `${API_BASE}/read-data`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }
  detailCache.clear();
  return res.json();
}

export async function getCachedData(): Promise<DashboardData | null> {
  const res = await fetch(`${API_BASE}/data`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Daten konnten nicht geladen werden");
  return res.json();
}

export async function getSyncStatus(): Promise<{
  hasData: boolean;
  sync?: SyncMeta;
  fetchedAt?: string;
  userProfile?: UserProfileSettings;
}> {
  const res = await fetch(`${API_BASE}/sync-status`);
  return res.json();
}

export async function fetchUserProfile(): Promise<UserProfileSettings> {
  const res = await fetch(`${API_BASE}/user-profile`);
  if (!res.ok) throw new Error("Profil konnte nicht geladen werden");
  return res.json();
}

export async function saveUserProfile(profile: UserProfileSettings): Promise<{
  profile: UserProfileSettings;
  recommendationsUpdated: boolean;
  recommendations: Recommendation[] | null;
  analysisSource: "claude" | "local" | null;
  claudePending?: boolean;
}> {
  const res = await fetch(`${API_BASE}/user-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }

  return res.json();
}

export async function fetchActivityDetail(
  activityId: number,
): Promise<ActivityDetail> {
  const cached = detailCache.get(activityId);
  if (cached && cached.source !== "local") return cached;

  const res = await fetch(`${API_BASE}/activities/${activityId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }

  const data = (await res.json()) as ActivityDetail;
  detailCache.set(activityId, data);
  return data;
}

export async function fetchSyncProgress(): Promise<SyncProgress> {
  const res = await fetch(`${API_BASE}/sync-progress`);
  return res.json();
}

export async function testGarminCredentials(input: {
  garminEmail?: string;
  garminPassword?: string;
}): Promise<{ ok: true; displayName?: string }> {
  const res = await fetch(`${API_BASE}/test-garmin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Garmin login failed");
  }
  return res.json();
}

export async function testClaudeCli(): Promise<ClaudeTestResult> {
  const res = await fetch(`${API_BASE}/test-claude`, { method: "POST" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Claude CLI test failed");
  }
  return res.json();
}

export type ReanalyzeResult =
  | { status: "ok"; dashboard: DashboardData; claudeFailed: boolean }
  | { status: "no-data" }
  | { status: "claude-off" };

/**
 * Manually re-runs the coaching analysis on the data already on disk (no
 * Garmin re-sync) and forces a Claude call regardless of the smart-mode
 * caching. Can take a while – it waits for the Claude CLI call to finish.
 *
 * The expected failure modes (no data yet, Claude mode off) come back as a
 * status instead of a thrown error, so the caller can show a localized message
 * instead of the raw backend string.
 */
export async function reanalyzeData(): Promise<ReanalyzeResult> {
  const res = await fetch(`${API_BASE}/reanalyze`, { method: "POST" });
  if (res.status === 404) return { status: "no-data" };
  if (res.status === 409) return { status: "claude-off" };
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Fehler ${res.status}`);
  }
  const body = await res.json();
  return {
    status: "ok",
    dashboard: body.dashboard,
    claudeFailed: body.claudeFailed,
  };
}

export async function downloadBackup(): Promise<BackupBundle> {
  const res = await fetch(`${API_BASE}/backup`);
  if (!res.ok) throw new Error("Backup failed");
  return res.json();
}

export async function restoreBackup(
  bundle: BackupBundle,
): Promise<{ restored: string[]; message: string }> {
  const res = await fetch(`${API_BASE}/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bundle),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Restore failed");
  }
  return res.json();
}

export async function fetchActivityRoute(
  activityId: number,
): Promise<ActivityRouteResult> {
  const res = await fetch(`${API_BASE}/activities/${activityId}/route`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Route fetch failed");
  }
  return res.json();
}

export async function importActivities(
  activities: Partial<import("../types/garmin").GarminActivity>[],
): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/import/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activities }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Import failed");
  }
  return res.json();
}
