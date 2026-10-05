<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  fetchAppConfig,
  saveAppConfig,
  testClaudeCli,
  testGarminCredentials,
} from "../api/garmin";
import type {
  AppConfigPublic,
  AppLanguage,
  ClaudeAnalysisMode,
  ClaudeEffort,
} from "../types/appConfig";
import { useI18n } from "../i18n";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{
  initial?: AppConfigPublic | null;
  required?: boolean;
}>();

const emit = defineEmits<{
  saved: [config: AppConfigPublic];
  cancel: [];
}>();

const { t, setLocale } = useI18n();

const loading = ref(!props.initial);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const portChanged = ref(false);
const testingGarmin = ref(false);
const garminTestResult = ref<string | null>(null);

const form = reactive({
  garminEmail: "",
  garminPassword: "",
  claudeCliPath: "",
  claudeModel: "",
  claudeFallbackModel: "",
  claudeEffort: "low" as ClaudeEffort,
  claudeMaxCostUsd: 0,
  claudeAnalysisMode: "smart" as ClaudeAnalysisMode,
  claudeMaxActivities: 5,
  claudeTimeoutSeconds: 180,
  port: 3001,
  language: "en" as AppLanguage,
  maxActivitiesLimit: 500,
  metricsHistoryDays: 84,
  incrementalSyncBufferDays: 1,
  garminSessionIdleMinutes: 5,
  detailCacheDays: 7,
  autoSyncEnabled: false,
  autoSyncOnStartup: true,
  autoSyncIntervalMinutes: 360,
  syncOnStartup: false,
});

const hasExistingPassword = ref(false);
const configPath = ref("");

const CUSTOM_MODEL = "__custom";

/** Model ids offered in the dropdown; '' keeps whatever the Claude CLI defaults to. */
const modelOptions = computed(() => [
  { value: "", label: t("setup.claudeModelDefault") },
  {
    value: "claude-haiku-4-5-20251001",
    label: `Haiku 4.5 – ${t("setup.claudeModelRecommended")}`,
  },
  { value: "claude-sonnet-5-5", label: "Sonnet 5.5" },
  { value: "claude-opus-5-5", label: "Opus 5.5" },
  { value: "claude-sonnet-5", label: "Sonnet 5" },
  { value: "claude-opus-5", label: "Opus 5" },
  { value: CUSTOM_MODEL, label: t("setup.claudeModelCustom") },
]);

const modelSelection = ref("");
const customModel = ref("");

const effortOptions = computed(() => [
  { value: "low" as const, label: t("setup.effortLow") },
  { value: "medium" as const, label: t("setup.effortMedium") },
  { value: "high" as const, label: t("setup.effortHigh") },
]);

/** The fallback list excludes the primary model – falling back to itself is pointless. */
const fallbackOptions = computed(() => [
  { value: "", label: t("setup.claudeFallbackNone") },
  ...modelOptions.value
    .filter((option) => option.value !== "" && option.value !== CUSTOM_MODEL)
    .filter((option) => option.value !== resolvedClaudeModel.value),
]);

const testingClaude = ref(false);
const claudeTestResult = ref<string | null>(null);
const claudeTestError = ref<string | null>(null);

async function runClaudeTest() {
  testingClaude.value = true;
  claudeTestResult.value = null;
  claudeTestError.value = null;

  try {
    // Save first, otherwise the test would run against the stored settings
    // instead of what is currently in the form.
    await saveAppConfig({
      claudeCliPath: form.claudeCliPath.trim(),
      claudeModel: resolvedClaudeModel.value,
      claudeFallbackModel: form.claudeFallbackModel,
      claudeEffort: form.claudeEffort,
      claudeMaxCostUsd: form.claudeMaxCostUsd,
      claudeTimeoutSeconds: form.claudeTimeoutSeconds,
    });

    const result = await testClaudeCli();
    const parts = [result.usage.model ?? t("setup.claudeTestDefaultModel")];
    if (
      result.usage.inputTokens !== null &&
      result.usage.outputTokens !== null
    ) {
      parts.push(
        `${result.usage.inputTokens} → ${result.usage.outputTokens} Tokens`,
      );
    }
    if (result.usage.costUsd !== null)
      parts.push(`$${result.usage.costUsd.toFixed(4)}`);
    if (result.usage.durationMs !== null) {
      parts.push(`${(result.usage.durationMs / 1000).toFixed(1)} s`);
    }
    if (result.legacyMode) parts.push(t("setup.claudeTestLegacy"));

    claudeTestResult.value = parts.join(" · ");
  } catch (e) {
    claudeTestError.value =
      e instanceof Error ? e.message : t("setup.claudeTestFailed");
  } finally {
    testingClaude.value = false;
  }
}

const resolvedClaudeModel = computed(() =>
  modelSelection.value === CUSTOM_MODEL
    ? customModel.value.trim()
    : modelSelection.value,
);

function applyModel(model: string) {
  const known = modelOptions.value.some(
    (option) => option.value !== CUSTOM_MODEL && option.value === model,
  );
  modelSelection.value = known ? model : CUSTOM_MODEL;
  customModel.value = known ? "" : model;
}

const analysisOptions = computed(() => [
  {
    value: "smart" as const,
    label: t("setup.analysisSmart"),
    hint: t("setup.analysisSmartHint"),
  },
  {
    value: "always" as const,
    label: t("setup.analysisAlways"),
    hint: t("setup.analysisAlwaysHint"),
  },
  {
    value: "off" as const,
    label: t("setup.analysisOff"),
    hint: t("setup.analysisOffHint"),
  },
]);

const languageOptions = computed(() => [
  { value: "en" as const, label: t("language.en") },
  { value: "de" as const, label: t("language.de") },
]);

function applyConfig(config: AppConfigPublic) {
  form.garminEmail = config.garminEmail;
  form.garminPassword = "";
  form.claudeCliPath = config.claudeCliPath;
  form.claudeModel = config.claudeModel;
  applyModel(config.claudeModel);
  form.claudeFallbackModel = config.claudeFallbackModel;
  form.claudeEffort = config.claudeEffort;
  form.claudeMaxCostUsd = config.claudeMaxCostUsd;
  form.claudeAnalysisMode = config.claudeAnalysisMode;
  form.claudeMaxActivities = config.claudeMaxActivities;
  form.claudeTimeoutSeconds = config.claudeTimeoutSeconds;
  form.port = config.port;
  form.language = config.language;
  form.maxActivitiesLimit = config.maxActivitiesLimit;
  form.metricsHistoryDays = config.metricsHistoryDays;
  form.incrementalSyncBufferDays = config.incrementalSyncBufferDays;
  form.garminSessionIdleMinutes = config.garminSessionIdleMinutes;
  form.detailCacheDays = config.detailCacheDays;
  form.autoSyncEnabled = config.autoSyncEnabled;
  form.autoSyncOnStartup = config.autoSyncOnStartup;
  form.autoSyncIntervalMinutes = config.autoSyncIntervalMinutes;
  form.syncOnStartup = config.syncOnStartup;
  hasExistingPassword.value = config.hasGarminPassword;
  configPath.value = config.configPath;
  setLocale(config.language);
}

watch(
  () => props.initial,
  (config) => {
    if (config) applyConfig(config);
  },
  { immediate: true },
);

async function loadConfig() {
  loading.value = true;
  error.value = null;
  try {
    applyConfig(await fetchAppConfig());
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("setup.loadError");
  } finally {
    loading.value = false;
  }
}

if (!props.initial) {
  void loadConfig();
}

async function submit() {
  saving.value = true;
  error.value = null;
  success.value = null;
  portChanged.value = false;

  if (!form.garminEmail.trim()) {
    error.value = t("setup.emailRequired");
    saving.value = false;
    return;
  }

  if (!hasExistingPassword.value && !form.garminPassword.trim()) {
    error.value = t("setup.passwordRequired");
    saving.value = false;
    return;
  }

  try {
    const payload: Record<string, unknown> = {
      garminEmail: form.garminEmail.trim(),
      claudeCliPath: form.claudeCliPath.trim(),
      claudeModel: resolvedClaudeModel.value,
      claudeFallbackModel: form.claudeFallbackModel,
      claudeEffort: form.claudeEffort,
      claudeMaxCostUsd: form.claudeMaxCostUsd,
      claudeAnalysisMode: form.claudeAnalysisMode,
      claudeMaxActivities: form.claudeMaxActivities,
      claudeTimeoutSeconds: form.claudeTimeoutSeconds,
      port: form.port,
      language: form.language,
      maxActivitiesLimit: form.maxActivitiesLimit,
      metricsHistoryDays: form.metricsHistoryDays,
      incrementalSyncBufferDays: form.incrementalSyncBufferDays,
      garminSessionIdleMinutes: form.garminSessionIdleMinutes,
      detailCacheDays: form.detailCacheDays,
      autoSyncEnabled: form.autoSyncEnabled,
      autoSyncOnStartup: form.autoSyncOnStartup,
      autoSyncIntervalMinutes: form.autoSyncIntervalMinutes,
      syncOnStartup: form.syncOnStartup,
      setupCompleted: true,
    };

    if (form.garminPassword.trim()) {
      payload.garminPassword = form.garminPassword;
    }

    const result = await saveAppConfig(payload);
    applyConfig(result.config);
    portChanged.value = result.portChanged;
    success.value = result.portChanged
      ? t("setup.savedPortChanged")
      : t("setup.saved");
    emit("saved", result.config);
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("setup.saveError");
  } finally {
    saving.value = false;
  }
}

async function testGarmin() {
  testingGarmin.value = true;
  garminTestResult.value = null;
  error.value = null;
  try {
    const payload: Record<string, string> = {
      garminEmail: form.garminEmail.trim(),
    };
    if (form.garminPassword.trim())
      payload.garminPassword = form.garminPassword;
    const result = await testGarminCredentials(payload);
    garminTestResult.value = result.displayName
      ? t("setup.garminTestOkName", { name: result.displayName })
      : t("setup.garminTestOk");
  } catch (e) {
    error.value = e instanceof Error ? e.message : t("setup.garminTestFail");
  } finally {
    testingGarmin.value = false;
  }
}
</script>

<template>
  <div class="setup-page">
    <header class="setup-header">
      <div class="setup-icon"><AppIcon name="settings" size="2x" /></div>
      <div>
        <h2>{{ required ? t("setup.welcomeTitle") : t("setup.title") }}</h2>
        <p>{{ required ? t("setup.welcomeSubtitle") : t("setup.subtitle") }}</p>
      </div>
    </header>

    <div v-if="loading" class="setup-loading">{{ t("common.loading") }}</div>

    <form v-else class="setup-form" @submit.prevent="submit">
      <section class="form-section">
        <h3>{{ t("setup.languageSection") }}</h3>
        <p class="section-hint">{{ t("setup.languageHint") }}</p>

        <label class="field">
          <span>{{ t("setup.language") }}</span>
          <select v-model="form.language" @change="setLocale(form.language)">
            <option
              v-for="option in languageOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </section>

      <section class="form-section">
        <h3>{{ t("setup.garminSection") }}</h3>
        <p class="section-hint">{{ t("setup.garminHint") }}</p>

        <label class="field">
          <span>{{ t("setup.garminEmail") }}</span>
          <input
            v-model="form.garminEmail"
            type="email"
            autocomplete="username"
            required
          />
        </label>

        <label class="field">
          <span>{{ t("setup.garminPassword") }}</span>
          <input
            v-model="form.garminPassword"
            type="password"
            autocomplete="current-password"
            :placeholder="
              hasExistingPassword
                ? t('setup.passwordKeep')
                : t('setup.passwordPlaceholder')
            "
          />
        </label>

        <div class="inline-actions">
          <button
            type="button"
            class="btn secondary"
            :disabled="testingGarmin"
            @click="testGarmin"
          >
            {{
              testingGarmin ? t("setup.testingGarmin") : t("setup.testGarmin")
            }}
          </button>
          <span v-if="garminTestResult" class="test-ok">{{
            garminTestResult
          }}</span>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t("setup.autoSyncSection") }}</h3>
        <p class="section-hint">{{ t("setup.autoSyncHint") }}</p>

        <label class="field checkbox">
          <input v-model="form.autoSyncEnabled" type="checkbox" />
          <span>{{ t("setup.autoSyncEnabled") }}</span>
        </label>

        <label class="field checkbox">
          <input
            v-model="form.autoSyncOnStartup"
            type="checkbox"
            :disabled="!form.autoSyncEnabled"
          />
          <span>{{ t("setup.autoSyncOnStartup") }}</span>
        </label>

        <label class="field">
          <span>{{ t("setup.autoSyncInterval") }}</span>
          <input
            v-model.number="form.autoSyncIntervalMinutes"
            type="number"
            min="15"
            max="1440"
            :disabled="!form.autoSyncEnabled"
          />
          <small class="field-hint">{{
            t("setup.autoSyncIntervalHint")
          }}</small>
        </label>

        <label class="field checkbox">
          <input v-model="form.syncOnStartup" type="checkbox" />
          <span>{{ t("setup.syncOnStartup") }}</span>
        </label>
        <small class="field-hint">{{ t("setup.syncOnStartupHint") }}</small>
      </section>

      <section class="form-section">
        <h3>{{ t("setup.claudeSection") }}</h3>
        <p class="section-hint">{{ t("setup.claudeHint") }}</p>

        <label class="field">
          <span>{{ t("setup.claudePath") }}</span>
          <input
            v-model="form.claudeCliPath"
            type="text"
            :placeholder="t('setup.claudePathPlaceholder')"
          />
        </label>

        <label class="field">
          <span>{{ t("setup.claudeModel") }}</span>
          <select v-model="modelSelection">
            <option
              v-for="option in modelOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <small class="field-hint">{{ t("setup.claudeModelHint") }}</small>
        </label>

        <label v-if="modelSelection === '__custom'" class="field">
          <span>{{ t("setup.claudeModelCustomLabel") }}</span>
          <input
            v-model="customModel"
            type="text"
            :placeholder="t('setup.claudeModelCustomPlaceholder')"
          />
          <small class="field-hint">{{
            t("setup.claudeModelCustomHint")
          }}</small>
        </label>

        <label class="field">
          <span>{{ t("setup.analysisMode") }}</span>
          <select v-model="form.claudeAnalysisMode">
            <option
              v-for="option in analysisOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <small class="field-hint">
            {{
              analysisOptions.find(
                (option) => option.value === form.claudeAnalysisMode,
              )?.hint
            }}
          </small>
        </label>

        <label class="field">
          <span>{{ t("setup.maxActivities") }}</span>
          <input
            v-model.number="form.claudeMaxActivities"
            type="number"
            min="1"
            max="20"
          />
        </label>

        <label class="field">
          <span>{{ t("setup.claudeFallbackModel") }}</span>
          <select v-model="form.claudeFallbackModel">
            <option
              v-for="option in fallbackOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <small class="field-hint">{{ t("setup.claudeFallbackHint") }}</small>
        </label>

        <label class="field">
          <span>{{ t("setup.claudeEffort") }}</span>
          <select v-model="form.claudeEffort">
            <option
              v-for="option in effortOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <small class="field-hint">{{ t("setup.claudeEffortHint") }}</small>
        </label>

        <label class="field">
          <span>{{ t("setup.claudeTimeout") }}</span>
          <input
            v-model.number="form.claudeTimeoutSeconds"
            type="number"
            min="30"
            max="600"
          />
          <small class="field-hint">{{ t("setup.claudeTimeoutHint") }}</small>
        </label>

        <label class="field">
          <span>{{ t("setup.claudeMaxCost") }}</span>
          <input
            v-model.number="form.claudeMaxCostUsd"
            type="number"
            min="0"
            max="10"
            step="0.01"
          />
          <small class="field-hint">{{ t("setup.claudeMaxCostHint") }}</small>
        </label>

        <div class="inline-actions">
          <button
            type="button"
            class="btn secondary"
            :disabled="testingClaude"
            @click="runClaudeTest"
          >
            {{
              testingClaude ? t("setup.claudeTesting") : t("setup.claudeTest")
            }}
          </button>
          <span v-if="claudeTestResult" class="test-ok">{{
            claudeTestResult
          }}</span>
          <span v-if="claudeTestError" class="test-fail">{{
            claudeTestError
          }}</span>
        </div>
        <small class="field-hint">{{ t("setup.claudeTestHint") }}</small>
      </section>

      <section class="form-section">
        <h3>{{ t("setup.syncSection") }}</h3>
        <p class="section-hint">{{ t("setup.syncHint") }}</p>

        <div class="field-grid">
          <label class="field">
            <span>{{ t("setup.maxActivitiesLimit") }}</span>
            <input
              v-model.number="form.maxActivitiesLimit"
              type="number"
              min="50"
              max="2000"
            />
            <small class="field-hint">{{
              t("setup.maxActivitiesLimitHint")
            }}</small>
          </label>

          <label class="field">
            <span>{{ t("setup.metricsHistoryDays") }}</span>
            <input
              v-model.number="form.metricsHistoryDays"
              type="number"
              min="7"
              max="365"
            />
            <small class="field-hint">{{
              t("setup.metricsHistoryDaysHint")
            }}</small>
          </label>

          <label class="field">
            <span>{{ t("setup.incrementalSyncBufferDays") }}</span>
            <input
              v-model.number="form.incrementalSyncBufferDays"
              type="number"
              min="0"
              max="14"
            />
            <small class="field-hint">{{
              t("setup.incrementalSyncBufferDaysHint")
            }}</small>
          </label>

          <label class="field">
            <span>{{ t("setup.detailCacheDays") }}</span>
            <input
              v-model.number="form.detailCacheDays"
              type="number"
              min="1"
              max="90"
            />
            <small class="field-hint">{{
              t("setup.detailCacheDaysHint")
            }}</small>
          </label>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t("setup.serverSection") }}</h3>
        <p class="section-hint">{{ t("setup.serverHint") }}</p>

        <div class="field-grid">
          <label class="field">
            <span>{{ t("setup.port") }}</span>
            <input
              v-model.number="form.port"
              type="number"
              min="1024"
              max="65535"
            />
          </label>

          <label class="field">
            <span>{{ t("setup.garminSessionIdle") }}</span>
            <input
              v-model.number="form.garminSessionIdleMinutes"
              type="number"
              min="1"
              max="120"
            />
            <small class="field-hint">{{
              t("setup.garminSessionIdleHint")
            }}</small>
          </label>
        </div>
      </section>

      <p v-if="configPath" class="config-path">
        <AppIcon name="info" size="sm" />
        {{ t("setup.configPath") }}: <code>{{ configPath }}</code>
      </p>

      <div v-if="error" class="banner error">{{ error }}</div>
      <div v-if="success" class="banner success">{{ success }}</div>

      <div class="actions">
        <button
          v-if="!required"
          type="button"
          class="btn secondary"
          @click="emit('cancel')"
        >
          {{ t("setup.backToDashboard") }}
        </button>
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? t("setup.saving") : t("setup.save") }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.setup-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 0 0 2rem;
}

.setup-header {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.setup-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}

.setup-header h2 {
  margin: 0 0 0.35rem;
  font-size: 1.45rem;
}

.setup-header p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.setup-loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.35rem;
}

.form-section h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.section-hint {
  margin: 0 0 1rem;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.field:last-child {
  margin-bottom: 0;
}

.field span {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input,
.field select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: rgba(8, 12, 22, 0.65);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--border-hover);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 0.55rem;
}

.field.checkbox input {
  width: auto;
}

.inline-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.test-ok {
  font-size: 0.8rem;
  color: #a7f3d0;
}

.test-fail {
  font-size: 0.8rem;
  color: var(--error);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

@media (max-width: 640px) {
  .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.config-path {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin: 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.config-path code {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  word-break: break-all;
}

.banner {
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.banner.error {
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #fecaca;
}

.banner.success {
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.35);
  color: #a7f3d0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.65rem 1.15rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.btn.primary {
  background: var(--accent);
  border-color: transparent;
  color: #041018;
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.secondary {
  background: transparent;
  color: var(--text-muted);
}

.btn.secondary:hover {
  color: var(--text);
  border-color: var(--border-hover);
}
</style>
