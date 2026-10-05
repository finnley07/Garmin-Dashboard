<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseExtendedWellness, hasRecoveryData } from '../utils/wellness'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'
import InfoTooltip from './InfoTooltip.vue'
import MetricHistoryDialog from './MetricHistoryDialog.vue'

const props = defineProps<{
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
  sleepData?: unknown
  healthSnapshot?: unknown
  sleepHistory?: unknown[] | null
  hrvHistory?: unknown[] | null
  stressHistory?: unknown[] | null
  bodyBatteryHistory?: unknown | null
  readinessHistory?: unknown[] | null
}>()

const { t } = useI18n()
const activeHistory = ref<'hrv' | 'stress' | 'bodyBattery' | null>(null)

const wellness = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
    sleepData: props.sleepData,
    healthSnapshot: props.healthSnapshot,
    sleepHistory: props.sleepHistory,
    hrvHistory: props.hrvHistory,
    stressHistory: props.stressHistory,
    bodyBatteryHistory: props.bodyBatteryHistory,
    readinessHistory: props.readinessHistory,
  }),
)

const show = computed(() => hasRecoveryData(wellness.value))
</script>

<template>
  <section v-if="show" class="recovery-panel">
    <SectionTitle :title="t('recovery.title')" info-key="recoverySection" />

    <div class="recovery-grid">
      <article v-if="wellness.sleepScore || wellness.sleep.durationHours" class="metric-card sleep">
        <span class="label">
          {{ t('recovery.sleep') }}
          <InfoTooltip info-key="sleep" />
        </span>
        <strong v-if="wellness.sleepScore">{{ wellness.sleepScore }}<small>/100</small></strong>
        <ul class="sleep-breakdown">
          <li v-if="wellness.sleep.durationHours">
            {{ t('recovery.total') }}: {{ wellness.sleep.durationHours }}h
          </li>
          <li v-if="wellness.sleep.deepHours">Deep: {{ wellness.sleep.deepHours }}h</li>
          <li v-if="wellness.sleep.remHours">REM: {{ wellness.sleep.remHours }}h</li>
          <li v-if="wellness.sleep.lightHours">Light: {{ wellness.sleep.lightHours }}h</li>
        </ul>
      </article>

      <button
        v-if="wellness.bodyBattery"
        type="button"
        class="metric-card clickable"
        @click="activeHistory = 'bodyBattery'"
      >
        <span class="label">
          {{ t('recovery.bodyBattery') }}
          <InfoTooltip info-key="bodyBattery" />
        </span>
        <strong>{{ wellness.bodyBattery }}</strong>
        <span class="meta">{{ t('wellness.historyHint') }}</span>
      </button>

      <button
        v-if="wellness.stressLevel"
        type="button"
        class="metric-card clickable"
        @click="activeHistory = 'stress'"
      >
        <span class="label">
          {{ t('recovery.stress') }}
          <InfoTooltip info-key="stress" />
        </span>
        <strong>{{ wellness.stressLevel }}</strong>
        <span class="meta">{{ t('wellness.historyHint') }}</span>
      </button>

      <article v-if="wellness.restingHr" class="metric-card">
        <span class="label">
          {{ t('recovery.restingHr') }}
          <InfoTooltip info-key="restingHr" />
        </span>
        <strong>{{ wellness.restingHr }} bpm</strong>
      </article>

      <button
        v-if="wellness.hrvWeekly"
        type="button"
        class="metric-card clickable"
        @click="activeHistory = 'hrv'"
      >
        <span class="label">
          {{ t('recovery.hrv') }}
          <InfoTooltip info-key="hrv" />
        </span>
        <strong>{{ wellness.hrvWeekly }} ms</strong>
        <span v-if="wellness.hrvStatus" class="meta">{{ wellness.hrvStatus }}</span>
        <span class="meta">{{ t('wellness.historyHint') }}</span>
      </button>

      <article v-if="wellness.recoveryTimeHours" class="metric-card">
        <span class="label">
          {{ t('recovery.recoveryTime') }}
          <InfoTooltip info-key="recoveryTime" />
        </span>
        <strong>{{ wellness.recoveryTimeHours }}h</strong>
      </article>
    </div>

    <div v-if="wellness.readinessFactors.length" class="factors">
      <SectionTitle :title="t('recovery.readinessFactors')" info-key="readinessFactors" tag="h4" />
      <ul>
        <li v-for="factor in wellness.readinessFactors" :key="factor.key">
          <div class="factor-head">
            <span>{{ factor.label }}</span>
            <span>{{ factor.percent }}%</span>
          </div>
          <div class="factor-track">
            <div class="factor-fill" :style="{ width: `${factor.percent}%` }" />
          </div>
        </li>
      </ul>
    </div>

    <MetricHistoryDialog
      :open="activeHistory === 'hrv'"
      :title="t('wellnessHistory.hrv')"
      :current-value="wellness.hrvWeekly"
      unit="ms"
      :points="wellness.hrvHistory"
      color="#34d399"
      fill-color="rgba(52, 211, 153, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="activeHistory = null"
    />
    <MetricHistoryDialog
      :open="activeHistory === 'stress'"
      :title="t('wellnessHistory.stress')"
      :current-value="wellness.stressLevel"
      :points="wellness.stressHistory"
      color="#fbbf24"
      fill-color="rgba(251, 191, 36, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="activeHistory = null"
    />
    <MetricHistoryDialog
      :open="activeHistory === 'bodyBattery'"
      :title="t('wellnessHistory.bodyBattery')"
      :current-value="wellness.bodyBattery"
      :points="wellness.bodyBatteryHistory"
      color="#22d3ee"
      fill-color="rgba(34, 211, 238, 0.12)"
      :empty-hint="t('wellness.historyEmpty')"
      @close="activeHistory = null"
    />
  </section>
</template>

<style scoped>
.recovery-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  height: 100%;
}

.recovery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(140px, 100%), 1fr));
  gap: 0.75rem;
}

.metric-card {
  background: var(--surface-elevated);
  border-radius: 10px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  border: 1px solid transparent;
  color: var(--text);
}

.metric-card.clickable {
  cursor: pointer;
  font: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.metric-card.clickable:hover {
  border-color: rgba(34, 211, 238, 0.25);
  transform: translateY(-1px);
}

.metric-card.sleep {
  grid-column: span 2;
}

.label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
  font-size: 0.68rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metric-card strong {
  font-size: 1.35rem;
  color: var(--text);
}

.metric-card strong small {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.meta {
  font-size: 0.72rem;
  color: var(--accent);
}

.sleep-breakdown {
  list-style: none;
  margin: 0.35rem 0 0;
  padding: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.factors {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.factors ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.factor-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.factor-track {
  height: 6px;
  background: var(--surface-elevated);
  border-radius: 999px;
  overflow: hidden;
}

.factor-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 999px;
}

@media (max-width: 700px) {
  .metric-card.sleep {
    grid-column: span 1;
  }
}
</style>
