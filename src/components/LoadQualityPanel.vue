<script setup lang="ts">
import { computed } from "vue";
import type { DashboardAnalysis } from "../types/garmin";
import { useI18n } from "../i18n";
import SectionTitle from "./SectionTitle.vue";
import InfoTooltip from "./InfoTooltip.vue";

const props = defineProps<{ analysis?: DashboardAnalysis | null }>();

const { t } = useI18n();

const training = computed(() => props.analysis?.training ?? null);
const body = computed(() => props.analysis?.body ?? null);

const show = computed(() =>
  Boolean(training.value && training.value.sessions28d > 0),
);

type Tone = "good" | "warn" | "bad" | "neutral";

interface Metric {
  key: string;
  label: string;
  value: string;
  hint: string;
  tone: Tone;
  infoKey?: string;
}

function toneFor(value: number, warnAbove: number, badAbove: number): Tone {
  if (value >= badAbove) return "bad";
  if (value >= warnAbove) return "warn";
  return "good";
}

const loadMetrics = computed((): Metric[] => {
  const analysis = training.value;
  if (!analysis) return [];

  const metrics: Metric[] = [];

  if (analysis.monotony !== null) {
    metrics.push({
      key: "monotony",
      label: t("loadQuality.monotony"),
      value: analysis.monotony.toFixed(2),
      hint: t("loadQuality.monotonyHint", {
        sessions: analysis.sessions7d,
        rest: analysis.restDays7d,
      }),
      tone: toneFor(analysis.monotony, 2, 2.5),
      infoKey: "monotony",
    });
  }

  if (analysis.strain !== null) {
    metrics.push({
      key: "strain",
      label: t("loadQuality.strain"),
      value: String(analysis.strain),
      hint: t("loadQuality.strainHint", {
        acute: analysis.acuteLoad7d,
        chronic: analysis.chronicLoadWeekly,
      }),
      tone: "neutral",
      infoKey: "strain",
    });
  }

  if (analysis.loadTrendPct !== null) {
    metrics.push({
      key: "trend",
      label: t("loadQuality.loadTrend"),
      value: `${analysis.loadTrendPct > 0 ? "+" : ""}${analysis.loadTrendPct} %`,
      hint: t("loadQuality.loadTrendHint"),
      tone:
        analysis.loadTrendPct > 60
          ? "bad"
          : analysis.loadTrendPct > 30
            ? "warn"
            : analysis.loadTrendPct < -40
              ? "warn"
              : "good",
    });
  }

  if (analysis.intensity) {
    const verdictTone: Tone =
      analysis.intensity.verdict === "balanced"
        ? "good"
        : analysis.intensity.verdict === "too-hard"
          ? "bad"
          : "warn";
    metrics.push({
      key: "intensity",
      label: t("loadQuality.intensity"),
      value: `${analysis.intensity.easySharePct}/${analysis.intensity.moderateSharePct}/${analysis.intensity.hardSharePct} %`,
      hint: t(`loadQuality.verdict.${analysis.intensity.verdict}`),
      tone: verdictTone,
      infoKey: "intensityDistribution",
    });
  }

  return metrics;
});

/** Which of the personal reference values are missing – shown as a nudge. */
const missingBodyData = computed(() => {
  const resolved = body.value;
  if (!resolved) return [];

  const missing: string[] = [];
  if (resolved.age === null) missing.push(t("profile.birthYear"));
  if (resolved.weightKg === null) missing.push(t("profile.weightKg"));
  if (resolved.heightCm === null) missing.push(t("profile.heightCm"));
  if (resolved.sources.maxHr === "estimated") missing.push(t("profile.maxHr"));
  return missing;
});

const loadSourceNote = computed(() => {
  const source = training.value?.loadSource;
  if (!source || source === "garmin") return null;
  return t(`loadQuality.loadSource.${source}`);
});
</script>

<template>
  <section v-if="show" class="load-quality">
    <SectionTitle
      :title="t('loadQuality.title')"
      info-key="loadQuality"
      tag="h3"
    />
    <p class="panel-hint">{{ t("loadQuality.subtitle") }}</p>

    <div v-if="loadMetrics.length" class="metric-grid">
      <article
        v-for="metric in loadMetrics"
        :key="metric.key"
        class="metric"
        :class="metric.tone"
      >
        <span class="metric-label">
          {{ metric.label }}
          <InfoTooltip v-if="metric.infoKey" :info-key="metric.infoKey" />
        </span>
        <strong class="metric-value">{{ metric.value }}</strong>
        <span class="metric-hint">{{ metric.hint }}</span>
      </article>
    </div>

    <p v-if="loadSourceNote" class="note">{{ loadSourceNote }}</p>

    <p v-if="missingBodyData.length" class="note missing">
      {{ t("loadQuality.missingBody", { fields: missingBodyData.join(", ") }) }}
    </p>
  </section>
</template>

<style scoped>
.load-quality {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.sub-head {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  color: var(--text);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(190px, 100%), 1fr));
  gap: 0.75rem;
}

.metric {
  border: 1px solid var(--border);
  border-left-width: 4px;
  border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: var(--surface-elevated);
}

.metric.good {
  border-left-color: var(--success);
}
.metric.warn {
  border-left-color: var(--warning);
}
.metric.bad {
  border-left-color: var(--error);
}
.metric.neutral {
  border-left-color: var(--accent-3);
}

.metric-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.metric-value {
  font-size: 1.25rem;
  color: var(--text);
}

.metric-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.note.missing {
  padding: 0.5rem 0.7rem;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border);
}
</style>
