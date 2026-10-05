export type ClaudeAnalysisMode = "smart" | "always" | "off";
export type ClaudeEffort = "low" | "medium" | "high" | "xhigh" | "max";
export type AppLanguage = "en" | "de";

export interface ClaudeUsage {
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  costUsd: number | null;
  durationMs: number | null;
  effort: string | null;
  localAdded?: number;
  ranAt: string;
}

export interface ClaudeTestResult {
  ok: true;
  usage: ClaudeUsage;
  legacyMode: boolean;
  recommendations: number;
}

export interface AppConfigPublic {
  setupCompleted: boolean;
  garminEmail: string;
  hasGarminPassword: boolean;
  claudeCliPath: string;
  claudeModel: string;
  claudeFallbackModel: string;
  claudeEffort: ClaudeEffort;
  claudeMaxCostUsd: number;
  claudeAnalysisMode: ClaudeAnalysisMode;
  claudeMaxActivities: number;
  claudeTimeoutSeconds: number;
  port: number;
  language: AppLanguage;
  maxActivitiesLimit: number;
  metricsHistoryDays: number;
  incrementalSyncBufferDays: number;
  garminSessionIdleMinutes: number;
  detailCacheDays: number;
  autoSyncEnabled: boolean;
  autoSyncOnStartup: boolean;
  autoSyncIntervalMinutes: number;
  syncOnStartup: boolean;
  configPath: string;
  updatedAt: string;
}

export interface AppConfigInput {
  setupCompleted?: boolean;
  garminEmail?: string;
  garminPassword?: string;
  claudeCliPath?: string;
  claudeModel?: string;
  claudeFallbackModel?: string;
  claudeEffort?: ClaudeEffort;
  claudeMaxCostUsd?: number;
  claudeAnalysisMode?: ClaudeAnalysisMode;
  claudeMaxActivities?: number;
  claudeTimeoutSeconds?: number;
  port?: number;
  language?: AppLanguage;
  maxActivitiesLimit?: number;
  metricsHistoryDays?: number;
  incrementalSyncBufferDays?: number;
  garminSessionIdleMinutes?: number;
  detailCacheDays?: number;
  autoSyncEnabled?: boolean;
  autoSyncOnStartup?: boolean;
  autoSyncIntervalMinutes?: number;
  syncOnStartup?: boolean;
}

export interface AppConfigSaveResult {
  config: AppConfigPublic;
  portChanged: boolean;
  message: string;
}

export interface SyncProgress {
  running: boolean;
  phase: string;
  progress: number;
  message: string;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  triggeredBy: "manual" | "auto" | "startup" | null;
}

export interface BackupBundle {
  version: 1;
  exportedAt: string;
  files: Record<string, unknown>;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface ActivityRouteResult {
  activityId: number;
  points: RoutePoint[];
  source: "polyline" | "samples" | "none";
}
