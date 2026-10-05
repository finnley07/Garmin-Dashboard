<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseExtendedWellness } from '../utils/wellness'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'
import InfoTooltip from './InfoTooltip.vue'
import MetricHistoryDialog from './MetricHistoryDialog.vue'

const props = defineProps<{
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
  vo2maxHistory?: unknown[] | null
  readinessHistory?: unknown[] | null
  sleepHistory?: unknown[] | null
  hrvHistory?: unknown[] | null
  stressHistory?: unknown[] | null
  bodyBatteryHistory?: unknown | null
}>()

const { t } = useI18n()

const activeHistory = ref<'vo2' | 'sleep' | 'readiness' | null>(null)

const wellness = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
    vo2maxHistory: props.vo2maxHistory,
    readinessHistory: props.readinessHistory,
    sleepHistory: props.sleepHistory,
  }),
)

const hasData = computed(
  () =>
    wellness.value.trainingStatus ||
    wellness.value.readinessScore ||
    wellness.value.vo2max ||
    wellness.value.sleepScore,
)

const vo2HistoryPoints = computed(() =>
  wellness.value.vo2History.map((point) => ({ date: point.date, value: point.value })),
)

const sleepHistoryPoints = computed(() =>
  wellness.value.sleepHistory.map((point) => ({ date: point.date, value: point.score })),
)

const readinessHistoryPoints = computed(() =>
  wellness.value.readinessHistory.map((point) => ({ date: point.date, value: point.score })),
)

function openVo2History() {
  activeHistory.value = 'vo2'
}

function openSleepHistory() {
  activeHistory.value = 'sleep'
}

function openReadinessHistory() {
  activeHistory.value = 'readiness'
}

function closeHistory() {
  activeHistory.value = null
}
</script>

<template>
  <section v-if="hasData" class="wellness-row">
    <article v-if="wellness.trainingStatus" class="wellness-card status">
      <span class="label">
        <AppIcon name="gauge" size="sm" />
        {{ t('wellness.trainingStatus') }}
        <InfoTooltip info-key="trainingStatus" />
      </span>
      <strong>{{ wellness.trainingStatus }}</strong>
      <span v-if="wellness.weeklyLoad" class="meta">{{ t('wellness.load') }} {{ Math.round(wellness.weeklyLoad) }}</span>
    </article>

    <button
      v-if="wellness.readinessScore"
      type="button"
      class="wellness-card readiness clickable"
      :title="t('wellness.historyHint')"
      @click="openReadinessHistory"
    >
      <span class="label">
        <AppIcon name="readiness" size="sm" />
        {{ t('wellness.readiness') }}
        <InfoTooltip info-key="readiness" />
      </span>
      <strong>{{ wellness.readinessScore }}<small>/100</small></strong>
      <span class="meta">{{ wellness.readinessLevel ?? '–' }}</span>
      <span class="meta history-hint">{{ t('wellness.historyHint') }}</span>
    </button>

    <button
      v-if="wellness.vo2max"
      type="button"
      class="wellness-card vo2 clickable"
      :title="t('wellness.historyHint')"
      @click="openVo2History"
    >
      <span class="label">
        <AppIcon name="vo2" size="sm" />
        {{ t('wellness.vo2max') }}
        <InfoTooltip info-key="vo2max" />
      </span>
      <strong>{{ wellness.vo2max }}</strong>
      <span v-if="wellness.vo2Date" class="meta">{{ wellness.vo2Date }}</span>
      <span class="meta history-hint">{{ t('wellness.historyHint') }}</span>
    </button>

    <button
      v-if="wellness.sleepScore"
      type="button"
      class="wellness-card sleep clickable"
      :title="t('wellness.historyHint')"
      @click="openSleepHistory"
    >
      <span class="label">
        <AppIcon name="sleep" size="sm" />
        {{ t('wellness.sleepScore') }}
        <InfoTooltip info-key="sleepScore" />
      </span>
      <strong>{{ wellness.sleepScore }}</strong>
      <span v-if="wellness.acwrRatio" class="meta">ACWR {{ wellness.acwrRatio.toFixed(2) }}</span>
      <span class="meta history-hint">{{ t('wellness.historyHint') }}</span>
    </button>

    <MetricHistoryDialog
      :open="activeHistory === 'vo2'"
      :title="t('wellness.vo2HistoryTitle')"
      :current-value="wellness.vo2max?.toFixed(1) ?? null"
      unit="ml/kg/min"
      :points="vo2HistoryPoints"
      color="#a855f7"
      fill-color="rgba(168, 85, 247, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="closeHistory"
    />

    <MetricHistoryDialog
      :open="activeHistory === 'sleep'"
      :title="t('wellness.sleepHistoryTitle')"
      :current-value="wellness.sleepScore"
      unit="/100"
      :points="sleepHistoryPoints"
      color="#818cf8"
      fill-color="rgba(129, 140, 248, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="closeHistory"
    />

    <MetricHistoryDialog
      :open="activeHistory === 'readiness'"
      :title="t('wellness.readinessHistoryTitle')"
      :current-value="wellness.readinessScore"
      unit="/100"
      :points="readinessHistoryPoints"
      color="#34d399"
      fill-color="rgba(52, 211, 153, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="closeHistory"
    />
  </section>
</template>

<style scoped>
.wellness-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(150px, 100%), 1fr));
  gap: 0.85rem;
  margin-bottom: 0;
}

.wellness-card {
  padding: 1.05rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
  overflow: hidden;
  text-align: left;
}

.wellness-card.clickable {
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius, 14px);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.wellness-card.clickable:hover {
  transform: none;
  border-color: var(--border-hover);
}

.wellness-card.clickable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.wellness-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent);
  opacity: 0.7;
}

.wellness-card.status,
.wellness-card.readiness,
.wellness-card.vo2,
.wellness-card.sleep {
  --card-accent: var(--accent);
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.label :deep(svg) {
  color: var(--accent);
  opacity: 0.85;
}

.wellness-card strong {
  font-family: var(--font-mono);
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--text);
}

.wellness-card strong small {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  font-family: var(--font-sans);
}

.meta {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 500;
}

.history-hint {
  opacity: 0.75;
  font-size: 0.68rem;
}
</style>
