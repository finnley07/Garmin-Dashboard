import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { logger } from "./logger.js";

export type ClaudeAnalysisMode = "smart" | "always" | "off";
export type ClaudeEffort = "low" | "medium" | "high" | "xhigh" | "max";
export type AppLanguage = "en" | "de";

export interface AppConfig {
  setupCompleted: boolean;
  garminEmail: string;
  garminPassword: string;
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
  /** One sync + AI re-analysis every time the app is launched, independent of the periodic auto-sync scheduler. */
  syncOnStartup: boolean;
  updatedAt: string;
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

const CONFIG_DIR = join(process.cwd(), "data");
export const CONFIG_FILE = join(CONFIG_DIR, "app-config.json");

const DEFAULT_CONFIG: AppConfig = {
  setupCompleted: false,
  garminEmail: "",
  garminPassword: "",
  claudeCliPath: "",
  claudeModel: "",
  claudeFallbackModel: "",
  // The coaching call is a small text-in/JSON-out task – low effort is enough.
  claudeEffort: "low",
  claudeMaxCostUsd: 0,
  claudeAnalysisMode: "smart",
  claudeMaxActivities: 5,
  claudeTimeoutSeconds: 180,
  port: 3001,
  language: "en",
  maxActivitiesLimit: 500,
  metricsHistoryDays: 84,
  incrementalSyncBufferDays: 1,
  garminSessionIdleMinutes: 5,
  detailCacheDays: 7,
  autoSyncEnabled: false,
  autoSyncOnStartup: true,
  autoSyncIntervalMinutes: 360,
  syncOnStartup: false,
  updatedAt: new Date(0).toISOString(),
};

let cachedConfig: AppConfig | null = null;

function normalizeAnalysisMode(value: unknown): ClaudeAnalysisMode {
  const mode = String(value ?? "smart").toLowerCase();
  if (mode === "always" || mode === "off") return mode;
  return "smart";
}

function normalizeLanguage(value: unknown): AppLanguage {
  return String(value ?? "en").toLowerCase() === "de" ? "de" : "en";
}

/**
 * Model id or alias passed to `claude --model`. Empty string = keep the CLI default.
 * Charset is restricted because the value ends up on a command line.
 */
function normalizeModelId(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(raw) ? raw : "";
}

const CLAUDE_EFFORT_LEVELS = new Set<string>([
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
]);

function normalizeEffort(value: unknown): ClaudeEffort {
  const level = String(value ?? "low").toLowerCase();
  return (CLAUDE_EFFORT_LEVELS.has(level) ? level : "low") as ClaudeEffort;
}

/** 0 = no cap. Fractional, because a single coaching call costs cents at most. */
function clampCost(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(10, Math.round(parsed * 100) / 100);
}

function normalizeConfig(input: Partial<AppConfig>): AppConfig {
  return {
    setupCompleted: Boolean(input.setupCompleted),
    garminEmail: String(input.garminEmail ?? "")
      .trim()
      .slice(0, 200),
    garminPassword: String(input.garminPassword ?? ""),
    claudeCliPath: String(input.claudeCliPath ?? "")
      .trim()
      .slice(0, 500),
    claudeModel: normalizeModelId(input.claudeModel),
    claudeFallbackModel: normalizeModelId(input.claudeFallbackModel),
    claudeEffort: normalizeEffort(input.claudeEffort),
    claudeMaxCostUsd: clampCost(input.claudeMaxCostUsd),
    claudeAnalysisMode: normalizeAnalysisMode(input.claudeAnalysisMode),
    claudeMaxActivities: clampNumber(input.claudeMaxActivities, 1, 20, 5),
    claudeTimeoutSeconds: clampNumber(input.claudeTimeoutSeconds, 30, 600, 180),
    port: clampNumber(input.port, 1024, 65535, 3001),
    language: normalizeLanguage(input.language),
    maxActivitiesLimit: clampNumber(input.maxActivitiesLimit, 50, 2000, 500),
    metricsHistoryDays: clampNumber(input.metricsHistoryDays, 7, 365, 84),
    incrementalSyncBufferDays: clampNumber(
      input.incrementalSyncBufferDays,
      0,
      14,
      1,
    ),
    garminSessionIdleMinutes: clampNumber(
      input.garminSessionIdleMinutes,
      1,
      120,
      5,
    ),
    detailCacheDays: clampNumber(input.detailCacheDays, 1, 90, 7),
    autoSyncEnabled: Boolean(input.autoSyncEnabled),
    autoSyncOnStartup: input.autoSyncOnStartup !== false,
    autoSyncIntervalMinutes: clampNumber(
      input.autoSyncIntervalMinutes,
      15,
      1440,
      360,
    ),
    syncOnStartup: Boolean(input.syncOnStartup),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function configFromEnv(): Partial<AppConfig> {
  const email = process.env.GARMIN_EMAIL?.trim();
  const password = process.env.GARMIN_PASSWORD;
  const hasGarmin = Boolean(email && password);

  return {
    setupCompleted: hasGarmin,
    garminEmail: email ?? "",
    garminPassword: password ?? "",
    claudeCliPath: process.env.CLAUDE_CLI_PATH?.trim() ?? "",
    claudeModel: normalizeModelId(process.env.CLAUDE_MODEL),
    claudeFallbackModel: normalizeModelId(process.env.CLAUDE_FALLBACK_MODEL),
    claudeEffort: normalizeEffort(process.env.CLAUDE_EFFORT),
    claudeMaxCostUsd: clampCost(process.env.CLAUDE_MAX_COST_USD),
    claudeAnalysisMode: normalizeAnalysisMode(process.env.CLAUDE_ANALYSIS_MODE),
    claudeMaxActivities: clampNumber(
      process.env.CLAUDE_MAX_ACTIVITIES,
      1,
      20,
      5,
    ),
    claudeTimeoutSeconds: clampNumber(
      process.env.CLAUDE_TIMEOUT_SECONDS,
      30,
      600,
      180,
    ),
    port: clampNumber(process.env.PORT, 1024, 65535, 3001),
    maxActivitiesLimit: clampNumber(
      process.env.MAX_ACTIVITIES_LIMIT,
      50,
      2000,
      500,
    ),
    metricsHistoryDays: clampNumber(
      process.env.METRICS_HISTORY_DAYS,
      7,
      365,
      84,
    ),
    incrementalSyncBufferDays: clampNumber(
      process.env.INCREMENTAL_SYNC_BUFFER_DAYS,
      0,
      14,
      1,
    ),
    garminSessionIdleMinutes: clampNumber(
      process.env.GARMIN_SESSION_IDLE_MINUTES,
      1,
      120,
      5,
    ),
    detailCacheDays: clampNumber(process.env.DETAIL_CACHE_DAYS, 1, 90, 7),
  };
}

export function applyConfigToEnv(config: AppConfig): void {
  if (config.garminEmail) process.env.GARMIN_EMAIL = config.garminEmail;
  else delete process.env.GARMIN_EMAIL;

  if (config.garminPassword)
    process.env.GARMIN_PASSWORD = config.garminPassword;
  else delete process.env.GARMIN_PASSWORD;

  if (config.claudeCliPath) process.env.CLAUDE_CLI_PATH = config.claudeCliPath;
  else delete process.env.CLAUDE_CLI_PATH;

  if (config.claudeModel) process.env.CLAUDE_MODEL = config.claudeModel;
  else delete process.env.CLAUDE_MODEL;

  process.env.CLAUDE_ANALYSIS_MODE = config.claudeAnalysisMode;
  process.env.CLAUDE_MAX_ACTIVITIES = String(config.claudeMaxActivities);
  process.env.CLAUDE_TIMEOUT_SECONDS = String(config.claudeTimeoutSeconds);
  process.env.PORT = String(config.port);
  process.env.MAX_ACTIVITIES_LIMIT = String(config.maxActivitiesLimit);
  process.env.METRICS_HISTORY_DAYS = String(config.metricsHistoryDays);
  process.env.INCREMENTAL_SYNC_BUFFER_DAYS = String(
    config.incrementalSyncBufferDays,
  );
  process.env.GARMIN_SESSION_IDLE_MINUTES = String(
    config.garminSessionIdleMinutes,
  );
  process.env.DETAIL_CACHE_DAYS = String(config.detailCacheDays);
}

function readConfigFile(): AppConfig | null {
  if (!existsSync(CONFIG_FILE)) return null;

  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return normalizeConfig(JSON.parse(raw) as Partial<AppConfig>);
  } catch (error) {
    logger.warn(
      "Could not read app-config.json",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function writeConfigFile(config: AppConfig): void {
  mkdirSync(dirname(CONFIG_FILE), { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

function migrateEnvToFileIfNeeded(): AppConfig {
  const fromEnv = configFromEnv();
  const hasGarmin = Boolean(fromEnv.garminEmail && fromEnv.garminPassword);

  const config = normalizeConfig({
    ...DEFAULT_CONFIG,
    ...fromEnv,
    setupCompleted: hasGarmin,
    updatedAt: new Date().toISOString(),
  });

  if (hasGarmin) {
    writeConfigFile(config);
    logger.info(`Migrated Garmin configuration to ${CONFIG_FILE} (from .env)`);
  }

  return config;
}

export function loadAndApplyAppConfigSync(): AppConfig {
  if (cachedConfig) {
    applyConfigToEnv(cachedConfig);
    return cachedConfig;
  }

  const fromFile = readConfigFile();
  cachedConfig = fromFile ?? migrateEnvToFileIfNeeded();
  applyConfigToEnv(cachedConfig);
  return cachedConfig;
}

export function getAppConfig(): AppConfig {
  return cachedConfig ?? loadAndApplyAppConfigSync();
}

export function toPublicConfig(config: AppConfig): AppConfigPublic {
  return {
    setupCompleted: config.setupCompleted,
    garminEmail: config.garminEmail,
    hasGarminPassword: Boolean(config.garminPassword),
    claudeCliPath: config.claudeCliPath,
    claudeModel: config.claudeModel,
    claudeFallbackModel: config.claudeFallbackModel,
    claudeEffort: config.claudeEffort,
    claudeMaxCostUsd: config.claudeMaxCostUsd,
    claudeAnalysisMode: config.claudeAnalysisMode,
    claudeMaxActivities: config.claudeMaxActivities,
    claudeTimeoutSeconds: config.claudeTimeoutSeconds,
    port: config.port,
    language: config.language,
    maxActivitiesLimit: config.maxActivitiesLimit,
    metricsHistoryDays: config.metricsHistoryDays,
    incrementalSyncBufferDays: config.incrementalSyncBufferDays,
    garminSessionIdleMinutes: config.garminSessionIdleMinutes,
    detailCacheDays: config.detailCacheDays,
    autoSyncEnabled: config.autoSyncEnabled,
    autoSyncOnStartup: config.autoSyncOnStartup,
    autoSyncIntervalMinutes: config.autoSyncIntervalMinutes,
    syncOnStartup: config.syncOnStartup,
    configPath: CONFIG_FILE,
    updatedAt: config.updatedAt,
  };
}

export function hasGarminCredentials(
  config: AppConfig = getAppConfig(),
): boolean {
  return Boolean(config.garminEmail && config.garminPassword);
}

export function saveAppConfig(input: AppConfigInput): AppConfig {
  const current = getAppConfig();
  const password =
    input.garminPassword !== undefined && input.garminPassword.trim() !== ""
      ? input.garminPassword
      : current.garminPassword;

  const email =
    input.garminEmail !== undefined
      ? input.garminEmail.trim()
      : current.garminEmail;
  const garminReady = Boolean(email && password);

  const next = normalizeConfig({
    ...current,
    ...input,
    garminEmail: email,
    garminPassword: password,
    setupCompleted:
      input.setupCompleted ?? (garminReady ? true : current.setupCompleted),
    updatedAt: new Date().toISOString(),
  });

  if (!garminReady) {
    next.setupCompleted = false;
  }

  writeConfigFile(next);
  cachedConfig = next;
  applyConfigToEnv(next);
  return next;
}
