import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getAppConfig } from "./app-config.js";
import { logger } from "./logger.js";
import type { Recommendation } from "./types.js";

const execFileAsync = promisify(execFile);

/** Marker inside the argument list that is replaced by the prompt (or a shell variable). */
const PROMPT_ARG = "__GARMIN_PROMPT__";

const RECOMMENDATION_CATEGORIES = [
  "training",
  "recovery",
  "performance",
  "general",
] as const;
const RECOMMENDATION_PRIORITIES = ["high", "medium", "low"] as const;

export const MAX_RECOMMENDATIONS = 4;

/**
 * Replaces the default Claude Code system prompt. The coaching call is a pure
 * text-in/JSON-out task, so none of the agent harness (tools, memory, project
 * context) is needed - dropping it is the biggest token saving available here.
 *
 * Must stay on a single line: on Windows the CLI is a .cmd wrapper and a batch
 * file cuts every argument at the first newline.
 */
const COACH_SYSTEM_PROMPT = [
  "You are a sports science analyst for a self-hosted Garmin training dashboard.",
  "You receive pre-aggregated training and wellness figures and turn them into a few concrete, actionable coaching tips.",
  "Rules:",
  "(1) Use only the numbers given in the user message - never invent data and never claim access to files, tools or external services.",
  "(2) Explain what a metric means before you say what to do about it.",
  "(3) Be quantitative: name the value you are reacting to.",
  "(4) No medical diagnosis, no medication or supplement dosing advice.",
  "(5) Answer with a single JSON object and nothing else: no markdown fences, no commentary.",
].join(" ");

/** Structured-output contract enforced by the CLI via --json-schema. */
const RECOMMENDATIONS_JSON_SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      minItems: 3,
      maxItems: MAX_RECOMMENDATIONS,
      items: {
        type: "object",
        properties: {
          category: { type: "string", enum: [...RECOMMENDATION_CATEGORIES] },
          priority: { type: "string", enum: [...RECOMMENDATION_PRIORITIES] },
          title: { type: "string", maxLength: 120 },
          description: { type: "string", maxLength: 600 },
        },
        required: ["category", "priority", "title", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["recommendations"],
  additionalProperties: false,
});

/**
 * What one coaching call actually cost. Read from the --output-format json
 * envelope, which reports usage, price and duration per call.
 */
export interface ClaudeUsage {
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  costUsd: number | null;
  durationMs: number | null;
  effort: string | null;
  /** How many local rules were merged in because Claude left a gap. */
  localAdded?: number;
  ranAt: string;
}

export interface ClaudeAnalysis {
  recommendations: Recommendation[];
  usage: ClaudeUsage;
}

/** Set once when the installed CLI rejects the modern flags - avoids a wasted call on every sync. */
let legacyFlagsOnly = false;

/** Message from the most recent auth failure, or null once a call has gone through again. */
let lastAuthErrorMessage: string | null = null;

/** Surfaced to the frontend so it can show a "please re-authenticate" banner with a fix button. */
export function getClaudeAuthStatus(): {
  needsLogin: boolean;
  message: string | null;
} {
  return { needsLogin: lastAuthErrorMessage !== null, message: lastAuthErrorMessage };
}

/**
 * `claude auth login` needs a real interactive terminal - it opens the
 * system browser and waits for the OAuth redirect, which cannot happen
 * headless behind this API. Opening it in a new, visible console window is
 * the closest thing to a one-click fix the frontend can offer; the user
 * still completes the browser step themselves.
 */
export function launchClaudeLogin(): Promise<{
  started: boolean;
  reason?: string;
}> {
  if (process.platform !== "win32") {
    return Promise.resolve({
      started: false,
      reason:
        "Automatic re-login is only wired up for Windows. Run `claude auth login` in a terminal.",
    });
  }

  const executable = getClaudeExecutable();
  const exeArg = executable.includes(" ") ? `"${executable}"` : executable;
  const psArgs = ["/k", exeArg, "auth", "login"].map(psQuote).join(", ");
  const psCommand = `Start-Process -FilePath 'cmd.exe' -ArgumentList ${psArgs}`;

  return new Promise((resolve) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", psCommand],
      { detached: true, stdio: "ignore" },
    );

    child.once("error", (error) => {
      resolve({ started: false, reason: error.message });
    });
    child.once("spawn", () => {
      child.unref();
      resolve({ started: true });
    });
  });
}

/** CLI could not be started, refused the arguments, or produced no output. */
class ClaudeCliError extends Error {}
/** CLI answered, but the payload was not usable. */
class ClaudeOutputError extends Error {}
/** CLI answered with an auth failure (expired/missing login) - retrying with different flags cannot help. */
class ClaudeAuthError extends Error {}

/** Recognises the CLI's "not logged in" / "session expired" error result. */
function isAuthErrorMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("oauth") ||
    lower.includes("not logged in") ||
    lower.includes("please run") ||
    (lower.includes("authenticat") &&
      (lower.includes("expired") ||
        lower.includes("failed") ||
        lower.includes("could not")))
  );
}

function getClaudeTimeoutMs(): number {
  return getAppConfig().claudeTimeoutSeconds * 1000;
}

function getClaudeExecutable(): string {
  return process.env.CLAUDE_CLI_PATH?.trim() || "claude";
}

/** Configured model id/alias, or '' to keep whatever the CLI defaults to. */
function getClaudeModel(): string {
  return getAppConfig().claudeModel.trim();
}

let availability: Promise<boolean> | null = null;
let availabilityResult: boolean | null = null;

function looksLikePath(value: string): boolean {
  return value.includes("/") || value.includes("\\");
}

/**
 * Cached because it spawns a process and is asked on every analysis and on every
 * /api/health request. Reset it whenever the configured path can have changed.
 *
 * A configured full path is checked on the filesystem: `where`/`which` only
 * resolve bare command names and fail for an absolute path even when the file is
 * right there - which used to report "Claude CLI not found" for exactly the
 * Windows setup the README recommends.
 */
export function isClaudeCliAvailable(): Promise<boolean> {
  if (availabilityResult !== null) return Promise.resolve(availabilityResult);

  if (!availability) {
    const executable = getClaudeExecutable();

    availability = (
      looksLikePath(executable)
        ? Promise.resolve(existsSync(executable))
        : execFileAsync(
            process.platform === "win32" ? "where.exe" : "which",
            [executable],
            {
              timeout: 5000,
            },
          ).then(
            () => true,
            () => false,
          )
    ).then((found) => {
      availabilityResult = found;
      return found;
    });
  }

  return availability;
}

/** Last known result without spawning anything; null when it was never checked. */
export function getCachedClaudeCliAvailability(): boolean | null {
  return availabilityResult;
}

export function resetClaudeCliAvailability(): void {
  availability = null;
  availabilityResult = null;
  legacyFlagsOnly = false;
}

/**
 * Argument list for one non-interactive coaching call.
 *
 * Modern mode strips the agent harness: own system prompt, no tools, no project
 * config (CLAUDE.md, skills, MCP servers), no session files on disk. Without
 * tools there is nothing to permit, so --dangerously-skip-permissions is gone.
 * Legacy mode is the previous flag set, used when the installed CLI is older.
 */
function buildClaudeArgs(legacy: boolean): string[] {
  const config = getAppConfig();
  const model = getClaudeModel();
  const modelArgs = model ? ["--model", model] : [];

  if (legacy) {
    return [
      "-p",
      PROMPT_ARG,
      "--output-format",
      "json",
      "--dangerously-skip-permissions",
      ...modelArgs,
    ];
  }

  const fallback = config.claudeFallbackModel.trim();
  // Without a fallback an overloaded model means no coaching at all until the
  // next sync; with one the call simply continues on the second choice.
  const fallbackArgs =
    fallback && fallback !== model ? ["--fallback-model", fallback] : [];
  const budgetArgs =
    config.claudeMaxCostUsd > 0
      ? ["--max-budget-usd", String(config.claudeMaxCostUsd)]
      : [];

  return [
    "-p",
    PROMPT_ARG,
    "--output-format",
    "json",
    "--system-prompt",
    COACH_SYSTEM_PROMPT,
    "--json-schema",
    RECOMMENDATIONS_JSON_SCHEMA,
    "--tools",
    "",
    "--safe-mode",
    "--no-session-persistence",
    "--effort",
    config.claudeEffort,
    ...modelArgs,
    ...fallbackArgs,
    ...budgetArgs,
  ];
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Windows PowerShell 5.1 strips double quotes when it hands arguments to a
 * native command, and drops empty-string arguments entirely. Pre-escaping the
 * quotes and spelling the empty argument as "" makes argv arrive intact -
 * without this the JSON schema would reach the CLI as unparseable text and
 * --tools would lose its value.
 */
function toPowerShellArg(value: string): string {
  if (value === "") return `'""'`;
  return psQuote(value.replace(/"/g, '\\"'));
}

/**
 * Windows: the prompt is piped in over stdin, never passed as an argument.
 * The CLI is reached through a .cmd wrapper, and a batch file truncates every
 * argument at the first newline - as an argument the multi-line prompt would
 * arrive as its first line only.
 *
 * Encodings are pinned to UTF-8 in both directions; the PowerShell 5.1 defaults
 * (ANSI in, OEM out) turn German umlauts into mojibake.
 */
async function runClaudeOnWindows(
  promptFile: string,
  legacy: boolean,
): Promise<string> {
  const psArgs = buildClaudeArgs(legacy)
    .filter((arg) => arg !== PROMPT_ARG)
    .map(toPowerShellArg)
    .join(", ");

  const psCommand = [
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    `$p = Get-Content -Raw -Encoding UTF8 ${psQuote(promptFile)}`,
    `$a = @(${psArgs})`,
    `$p | & ${psQuote(getClaudeExecutable())} @a 2>$null`,
  ].join("; ");

  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", psCommand],
    {
      maxBuffer: 10 * 1024 * 1024,
      timeout: getClaudeTimeoutMs(),
      encoding: "utf-8",
    },
  );

  return stdout;
}

async function runClaudeOnUnix(
  prompt: string,
  legacy: boolean,
): Promise<string> {
  const args = buildClaudeArgs(legacy).map((arg) =>
    arg === PROMPT_ARG ? prompt : arg,
  );

  const { stdout } = await execFileAsync(getClaudeExecutable(), args, {
    maxBuffer: 10 * 1024 * 1024,
    timeout: getClaudeTimeoutMs(),
    encoding: "utf-8",
  });

  return stdout;
}

function isTimeout(error: unknown): boolean {
  const err = error as { killed?: boolean; signal?: string | null };
  return Boolean(err?.killed) || err?.signal === "SIGTERM";
}

/** An older CLI rejects unknown flags instead of running - recognisable from its usage error. */
function isUnsupportedFlagError(error: unknown): boolean {
  if (isTimeout(error)) return false;
  const err = error as { stderr?: string; message?: string };
  const text = `${err?.stderr ?? ""} ${err?.message ?? ""}`.toLowerCase();
  return (
    text.includes("unknown option") ||
    text.includes("unknown argument") ||
    text.includes("unknown command") ||
    text.includes("too many arguments")
  );
}

function tryParseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/^\uFEFF/, "").trim();
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The envelope carries token counts, price and duration per call. Reading them
 * turns "the analysis is probably cheap" into a number the user can see.
 *
 * Exported for tests: the snake_case field names come from the CLI and are the
 * part most likely to break silently.
 */
export function extractUsage(
  envelope: Record<string, unknown> | null,
): ClaudeUsage {
  const usage = (envelope?.usage ?? null) as Record<string, unknown> | null;
  const modelUsage = (envelope?.modelUsage ?? null) as Record<
    string,
    Record<string, unknown>
  > | null;
  const inputTokens = numberOrNull(usage?.input_tokens);
  const outputTokens = numberOrNull(usage?.output_tokens);

  /**
   * The CLI can run a cheap internal/auxiliary call (e.g. Haiku) alongside
   * the real coaching call, and both show up as separate keys in
   * `modelUsage` - object key order is not meaningful, so picking the first
   * key can report the wrong model (seen in practice: Haiku listed before
   * the configured Opus model even though Opus wrote the actual response).
   * The top-level `usage` block always reflects the primary call, so match
   * a modelUsage entry against it by token counts instead of trusting order.
   */
  const modelUsageEntries = modelUsage ? Object.entries(modelUsage) : [];
  const primaryEntry = modelUsageEntries.find(
    ([, stats]) =>
      numberOrNull(stats?.inputTokens) === inputTokens &&
      numberOrNull(stats?.outputTokens) === outputTokens,
  );
  const modelFromUsage =
    (primaryEntry ?? modelUsageEntries[0])?.[0] ?? null;

  return {
    model: modelFromUsage ?? getClaudeModel() ?? null,
    inputTokens,
    outputTokens,
    cacheReadTokens: numberOrNull(usage?.cache_read_input_tokens),
    costUsd: numberOrNull(envelope?.total_cost_usd),
    durationMs: numberOrNull(envelope?.duration_ms),
    effort: legacyFlagsOnly ? null : getAppConfig().claudeEffort,
    ranAt: new Date().toISOString(),
  };
}

/** Unwraps the --output-format json envelope; falls back to the raw text. */
function extractRecommendationSource(stdout: string): {
  text: string;
  usage: ClaudeUsage;
} {
  const parsed = tryParseJsonObject(stdout);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const envelope = parsed as Record<string, unknown> & {
      result?: unknown;
      is_error?: unknown;
    };
    if (envelope.is_error === true) {
      const resultText =
        typeof envelope.result === "string" ? envelope.result : "";
      if (isAuthErrorMessage(resultText)) {
        throw new ClaudeAuthError(
          resultText || "Claude CLI is not authenticated",
        );
      }
      throw new ClaudeOutputError("Claude CLI reported an error result");
    }

    const usage = extractUsage(envelope);

    if (
      typeof envelope.result === "string" &&
      envelope.result.trim().length > 0
    ) {
      return { text: envelope.result, usage };
    }
    // With --json-schema the result may already be a parsed object.
    if (envelope.result && typeof envelope.result === "object") {
      return { text: JSON.stringify(envelope.result), usage };
    }
  }

  return { text: stdout, usage: extractUsage(null) };
}

function clampText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * The model decides these strings, so they are validated before they reach the
 * store and the UI: an unknown priority breaks both the sort order and the
 * colour lookup in Recommendations.vue.
 */
export function sanitizeRecommendations(input: unknown): Recommendation[] {
  const rows = (input as { recommendations?: unknown } | null)?.recommendations;
  if (!Array.isArray(rows)) return [];

  const categories = new Set<string>(RECOMMENDATION_CATEGORIES);
  const priorities = new Set<string>(RECOMMENDATION_PRIORITIES);

  return rows
    .filter(
      (row): row is Record<string, unknown> =>
        Boolean(row) && typeof row === "object",
    )
    .map((row) => {
      const category = String(row.category ?? "")
        .trim()
        .toLowerCase();
      const priority = String(row.priority ?? "")
        .trim()
        .toLowerCase();

      return {
        category: (categories.has(category)
          ? category
          : "general") as Recommendation["category"],
        priority: (priorities.has(priority)
          ? priority
          : "medium") as Recommendation["priority"],
        title: clampText(row.title, 120),
        description: clampText(row.description, 600),
      };
    })
    .filter((rec) => rec.title.length > 0 && rec.description.length > 0)
    .slice(0, MAX_RECOMMENDATIONS);
}

function parseRecommendations(text: string): Recommendation[] {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsed = tryParseJsonObject(cleaned);
  if (!parsed) {
    throw new ClaudeOutputError("No JSON object in Claude response");
  }

  const recommendations = sanitizeRecommendations(parsed);
  if (recommendations.length === 0) {
    throw new ClaudeOutputError(
      "Claude response contained no usable recommendations",
    );
  }

  return recommendations;
}

/**
 * The CLI exits non-zero on an auth failure even though it already wrote a
 * usable `is_error` envelope to stdout - execFile rejects on that exit code
 * before the normal stdout-parsing path ever runs, so the auth check has to
 * happen here too, against the stdout Node attaches to the rejection error.
 */
function extractAuthErrorFromFailedExec(error: unknown): ClaudeAuthError | null {
  const stdout = (error as { stdout?: unknown } | null)?.stdout;
  if (typeof stdout !== "string" || !stdout.trim()) return null;

  const parsed = tryParseJsonObject(stdout.trim());
  if (!parsed || typeof parsed !== "object") return null;

  const envelope = parsed as Record<string, unknown>;
  if (envelope.is_error !== true) return null;

  const resultText =
    typeof envelope.result === "string" ? envelope.result : "";
  if (!isAuthErrorMessage(resultText)) return null;

  return new ClaudeAuthError(resultText || "Claude CLI is not authenticated");
}

async function attempt(
  prompt: string,
  promptFile: string,
  legacy: boolean,
): Promise<ClaudeAnalysis> {
  let stdout: string;
  try {
    stdout =
      process.platform === "win32"
        ? await runClaudeOnWindows(promptFile, legacy)
        : await runClaudeOnUnix(prompt, legacy);
  } catch (error) {
    const authError = extractAuthErrorFromFailedExec(error);
    if (authError) throw authError;

    if (isUnsupportedFlagError(error)) {
      throw new ClaudeCliError(
        `Claude CLI rejected the arguments: ${(error as Error).message || "unknown"}`,
      );
    }
    throw error;
  }

  if (!stdout.trim()) {
    throw new ClaudeCliError("Claude CLI returned no output");
  }

  const { text, usage } = extractRecommendationSource(stdout.trim());
  return { recommendations: parseRecommendations(text), usage };
}

/**
 * End-to-end check for the Settings dialog: is the executable there, does the
 * installed CLI accept the flags, is the configured model valid, and does the
 * structured output come back parseable? Uses the real invocation path with a
 * minimal prompt, so a green result means the coaching call will work.
 */
export async function testClaudeCli(): Promise<{
  ok: true;
  usage: ClaudeUsage;
  legacyMode: boolean;
  recommendations: number;
}> {
  if (!(await isClaudeCliAvailable())) {
    throw new Error(
      `Claude CLI not found (${getClaudeExecutable()}). Set the executable path in Settings.`,
    );
  }

  const prompt = [
    "Test run of the dashboard connection. JSON only, no explanation.",
    "Profile: Type=Runner Level=intermediate",
    "Last 7 days: 3 sessions (24 km, 2.5 h)",
    "Metrics: Readiness=70",
    "Task: Return exactly 3 short, general training tips.",
  ].join("\n");

  const analysis = await analyzeWithClaudeCli(prompt);

  return {
    ok: true,
    usage: analysis.usage,
    legacyMode: legacyFlagsOnly,
    recommendations: analysis.recommendations.length,
  };
}

export async function analyzeWithClaudeCli(
  prompt: string,
): Promise<ClaudeAnalysis> {
  const promptFile = join(tmpdir(), `garmin-claude-${randomUUID()}.txt`);
  await writeFile(promptFile, prompt, "utf-8");

  try {
    try {
      const result = await attempt(prompt, promptFile, legacyFlagsOnly);
      lastAuthErrorMessage = null;
      return result;
    } catch (error) {
      // An expired/missing login fails identically regardless of flags - a
      // second call would just waste a CLI invocation and log the same error.
      if (error instanceof ClaudeAuthError) {
        lastAuthErrorMessage = error.message;
        logger.warn(
          "Claude CLI is not authenticated - run 'claude auth login' to restore AI recommendations",
          error.message,
        );
        throw error;
      }

      // A timeout says nothing about the flags - do not spend a second call on it.
      if (legacyFlagsOnly || isTimeout(error)) throw error;

      const cliProblem = error instanceof ClaudeCliError;
      logger.warn(
        `Claude CLI call failed (${cliProblem ? "arguments/startup" : "output"}), retrying with legacy flags`,
        error instanceof Error ? error.message : error,
      );

      const analysis = await attempt(prompt, promptFile, true);
      lastAuthErrorMessage = null;

      // Only remember the downgrade when the CLI itself refused the modern flags.
      if (cliProblem) {
        legacyFlagsOnly = true;
        logger.warn(
          "Claude CLI does not support the current flags - staying in legacy mode",
        );
      }

      return analysis;
    }
  } finally {
    await unlink(promptFile).catch(() => {});
  }
}
