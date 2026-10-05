import "./env.js";
import express from "express";
import { installBrokenPipeGuard } from "./process-safety.js";
import {
  getAppConfig,
  hasGarminCredentials,
  saveAppConfig,
  toPublicConfig,
  type AppConfigInput,
} from "./app-config.js";
import { getActivityDetail } from "./activity-details.js";
import { getClaudeAnalysisMode } from "./analysis.js";
import {
  getCachedClaudeCliAvailability,
  getClaudeAuthStatus,
  isClaudeCliAvailable,
  launchClaudeLogin,
  resetClaudeCliAvailability,
  testClaudeCli,
} from "./claude-cli.js";
import { closeGarminSession } from "./garmin-session.js";
import {
  refreshRecommendationsAfterProfileChange,
  runManualReanalysis,
  scheduleClaudeRecommendationsAfterProfileChange,
} from "./profile-sync.js";
import { loadDashboardFromDisk, runSyncJob } from "./sync.js";
import { getSyncProgress } from "./sync-state.js";
import { restartAutoSyncScheduler, scheduleStartupSync } from "./auto-sync.js";
import { testGarminCredentials } from "./garmin-test.js";
import { createBackupBundle, restoreBackupBundle } from "./data-backup.js";
import { fetchActivityRoute } from "./activity-route.js";
import {
  loadStoredData,
  mergeActivities,
  saveStoredData,
  toDashboardDataWithProfile,
} from "./storage.js";
import { computeStats } from "./analysis.js";
import {
  loadUserProfile,
  normalizeUserProfile,
  saveUserProfile,
} from "./user-profile.js";
import { configureStaticUi } from "./static-ui.js";
import { tryOpenBrowser } from "./open-browser.js";
import { logger } from "./logger.js";

installBrokenPipeGuard();

const app = express();
const PORT = Number(process.env.PORT ?? getAppConfig().port ?? 3001);
// Loopback-only by default: this API has no authentication, so anything else
// reachable on the host's network would get full read/write access to Garmin
// data and settings. Set HOST=0.0.0.0 (or a specific LAN address) only if you
// understand that tradeoff - see SECURITY.md.
const HOST = process.env.HOST?.trim() || "127.0.0.1";

// The availability check is cached inside claude-cli.ts, which is also where the
// analysis asks for it – no second cache here.
void isClaudeCliAvailable();

// No CORS middleware: the frontend only ever calls this API same-origin (the
// Vite dev proxy makes :5173 -> :3001 look same-origin to the browser, and the
// production build is served from this same Express server). A permissive
// `cors()` here would let any third-party page a user has open read or change
// their Garmin data - see SECURITY.md.
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const hasClaudeCli =
    getCachedClaudeCliAvailability() ??
    (await Promise.race([
      isClaudeCliAvailable(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
    ]));

  res.json({
    ok: true,
    setupCompleted: getAppConfig().setupCompleted,
    hasGarminCredentials: hasGarminCredentials(),
    hasClaudeCli,
    claudeAnalysisMode: getClaudeAnalysisMode(),
    claudeAuth: getClaudeAuthStatus(),
  });
});

app.post("/api/claude-relogin", async (_req, res) => {
  try {
    const result = await launchClaudeLogin();
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start Claude login";
    logger.error("Failed to launch Claude login", error);
    res.status(500).json({ started: false, reason: message });
  }
});

app.get("/api/app-config", (_req, res) => {
  res.json(toPublicConfig(getAppConfig()));
});

app.put("/api/app-config", async (req, res) => {
  try {
    const body = (req.body ?? {}) as AppConfigInput;
    const previousPort = getAppConfig().port;
    const saved = saveAppConfig(body);

    await closeGarminSession({ force: true });
    resetClaudeCliAvailability();
    void isClaudeCliAvailable();
    restartAutoSyncScheduler();

    const portChanged = saved.port !== previousPort;

    res.json({
      config: toPublicConfig(saved),
      portChanged,
      message: portChanged
        ? "Port changed – restart the server to apply."
        : "Configuration saved.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to save app config", error);
    res.status(500).json({ error: message });
  }
});

app.get("/api/sync-progress", (_req, res) => {
  res.json(getSyncProgress());
});

app.post("/api/test-garmin", async (req, res) => {
  try {
    const body = (req.body ?? {}) as {
      garminEmail?: string;
      garminPassword?: string;
    };
    const config = getAppConfig();
    const email = body.garminEmail?.trim() || config.garminEmail;
    const password =
      body.garminPassword?.trim() ||
      (body.garminPassword === undefined && config.garminPassword
        ? config.garminPassword
        : "");

    if (!email || !password) {
      res.status(400).json({ error: "Garmin email and password required" });
      return;
    }

    const result = await testGarminCredentials(email, password);
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Garmin login failed";
    res.status(401).json({ error: message });
  }
});

app.post("/api/test-claude", async (_req, res) => {
  try {
    res.json(await testClaudeCli());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Claude CLI test failed";
    logger.warn("Claude CLI test failed", message);
    res.status(400).json({ error: message });
  }
});

app.post("/api/reanalyze", async (_req, res) => {
  try {
    const profile = await loadUserProfile();
    const result = await runManualReanalysis(profile);

    if (result.status === "no-data") {
      res.status(404).json({ error: "No local data yet. Sync first." });
      return;
    }
    if (result.status === "claude-off") {
      res
        .status(409)
        .json({
          error: "Claude analysis mode is off. Enable it in Settings first.",
        });
      return;
    }

    res.json({
      dashboard: result.dashboard,
      claudeFailed: result.claudeFailed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Re-analysis failed";
    logger.error("Manual re-analysis failed", error);
    res.status(500).json({ error: message });
  }
});

app.get("/api/backup", async (_req, res) => {
  try {
    const bundle = await createBackupBundle();
    res.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed";
    res.status(500).json({ error: message });
  }
});

app.post("/api/restore", async (req, res) => {
  try {
    const restored = await restoreBackupBundle(req.body);
    res.json({
      restored,
      message: `Restored ${restored.length} file(s). Restart sync recommended.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed";
    res.status(500).json({ error: message });
  }
});

app.get("/api/activities/:activityId/route", async (req, res) => {
  try {
    const activityId = Number(req.params.activityId);
    if (!Number.isFinite(activityId)) {
      res.status(400).json({ error: "Invalid activity ID" });
      return;
    }
    res.json(await fetchActivityRoute(activityId));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Route fetch failed";
    res.status(500).json({ error: message });
  }
});

app.get("/api/data", async (_req, res) => {
  const data = await loadDashboardFromDisk();
  if (!data) {
    res
      .status(404)
      .json({
        error: "No local data yet. Click Load data to sync from Garmin.",
      });
    return;
  }
  res.json(data);
});

app.get("/api/sync-status", async (_req, res) => {
  const data = await loadDashboardFromDisk();
  if (!data) {
    res.json({ hasData: false, userProfile: await loadUserProfile() });
    return;
  }
  res.json({
    hasData: true,
    sync: data.sync,
    fetchedAt: data.fetchedAt,
    userProfile: data.userProfile,
  });
});

app.get("/api/user-profile", async (_req, res) => {
  res.json(await loadUserProfile());
});

app.put("/api/user-profile", async (req, res) => {
  try {
    const profile = await saveUserProfile(normalizeUserProfile(req.body ?? {}));
    const dashboard = await refreshRecommendationsAfterProfileChange(profile);
    const claudePending =
      scheduleClaudeRecommendationsAfterProfileChange(profile);

    res.json({
      profile,
      recommendationsUpdated: Boolean(dashboard),
      recommendations: dashboard?.recommendations ?? null,
      analysisSource: dashboard?.analysisSource ?? null,
      claudePending,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to save user profile", error);
    res.status(500).json({ error: message });
  }
});

app.get("/api/activities/:activityId", async (req, res) => {
  try {
    const activityId = Number(req.params.activityId);
    if (!Number.isFinite(activityId)) {
      res.status(400).json({ error: "Invalid activity ID" });
      return;
    }

    const stored = await loadStoredData();
    const cached =
      stored?.activities.find((a) => a.activityId === activityId) ?? null;
    const detail = await getActivityDetail(cached, activityId);
    res.json(detail);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to load activity detail", error);
    res.status(500).json({ error: message });
  }
});

app.post("/api/import/activities", async (req, res) => {
  try {
    const incoming = (req.body?.activities ??
      []) as import("./types.js").GarminActivity[];
    if (!Array.isArray(incoming) || incoming.length === 0) {
      res.status(400).json({ error: "No activities to import" });
      return;
    }

    const stored = await loadStoredData();
    if (!stored) {
      res.status(404).json({ error: "No local store – run sync first" });
      return;
    }

    const merged = mergeActivities(
      stored.activities,
      incoming as import("./types.js").GarminActivity[],
    );
    stored.activities = merged.merged;
    stored.stats = computeStats(stored.activities);
    stored.fetchedAt = new Date().toISOString();
    await saveStoredData(stored);
    res.json(await toDashboardDataWithProfile(stored));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    res.status(500).json({ error: message });
  }
});

app.post("/api/read-data", async (req, res) => {
  try {
    const forceFull = req.query.full === "true" || req.body?.full === true;
    const data = await runSyncJob(forceFull, "manual");
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to sync Garmin data", error);
    res.status(500).json({ error: message });
  }
});

const uiEnabled = configureStaticUi(app);

loadDashboardFromDisk().then((data) => {
  if (data) {
    logger.info(
      `Loaded local data: ${data.sync.totalActivities} activities, last synced ${new Date(data.sync.lastSyncedAt).toISOString()}`,
    );
  }
});

app
  .listen(PORT, HOST, () => {
    const url = `http://localhost:${PORT}`;
    logger.info(
      `API listening on ${url}${HOST !== "127.0.0.1" ? ` (bound to ${HOST})` : ""}`,
    );
    if (HOST !== "127.0.0.1" && HOST !== "localhost") {
      logger.warn(
        `Bound to ${HOST} instead of 127.0.0.1 - this API has no authentication. Anyone who can reach this address on the network has full access to your Garmin data and settings. See SECURITY.md.`,
      );
    }
    if (uiEnabled) {
      logger.info(`Dashboard ready at ${url}`);
      tryOpenBrowser(url);
    }
    restartAutoSyncScheduler();
    scheduleStartupSync();
  })
  .on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(
        `Port ${PORT} is already in use. Stop the other process or set a different PORT in Settings or .env.`,
      );
    } else {
      logger.error("API failed to start", err.message);
    }
    process.exit(1);
  });
