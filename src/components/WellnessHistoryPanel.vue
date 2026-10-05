<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { parseExtendedWellness } from '../utils/wellness'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

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

const hasData = computed(
  () =>
    wellness.value.hrvHistory.length >= 2 ||
    wellness.value.stressHistory.length >= 2 ||
    wellness.value.bodyBatteryHistory.length >= 2 ||
    wellness.value.sleepDurationHistory.length >= 2,
)

function buildChart(points: { date: string; value: number }[], color: string, fill: string) {
  if (points.length < 2) return null
  return {
    labels: points.map((point) => point.date.slice(5)),
    datasets: [
      {
        data: points.map((point) => point.value),
        borderColor: color,
        backgroundColor: fill,
        fill: true,
        tension: 0.35,
        pointRadius: 1.5,
      },
    ],
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: chartTooltipDefaults() },
  scales: { x: chartScaleDefaults(), y: chartScaleDefaults() },
}

const charts = computed(() => [
  {
    key: 'hrv',
    title: t('wellnessHistory.hrv'),
    infoKey: 'hrv',
    data: buildChart(wellness.value.hrvHistory, '#34d399', 'rgba(52, 211, 153, 0.12)'),
  },
  {
    key: 'stress',
    title: t('wellnessHistory.stress'),
    infoKey: 'stress',
    data: buildChart(wellness.value.stressHistory, '#fbbf24', 'rgba(251, 191, 36, 0.12)'),
  },
  {
    key: 'bodyBattery',
    title: t('wellnessHistory.bodyBattery'),
    infoKey: 'bodyBattery',
    data: buildChart(wellness.value.bodyBatteryHistory, chartColors.cyanSolid, chartColors.cyan),
  },
  {
    key: 'sleepDuration',
    title: t('wellnessHistory.sleepDuration'),
    infoKey: 'sleep',
    data: buildChart(wellness.value.sleepDurationHistory, '#818cf8', 'rgba(129, 140, 248, 0.12)'),
  },
].filter((chart) => chart.data))
</script>

<template>
  <section v-if="hasData" class="history-panel">
    <SectionTitle :title="t('wellnessHistory.title')" info-key="wellnessHistory" />
    <div class="chart-grid">
      <article v-for="chart in charts" :key="chart.key" class="chart-card">
        <SectionTitle :title="chart.title" :info-key="chart.infoKey" tag="h4" />
        <div class="chart-wrap">
          <Line :data="chart.data!" :options="chartOptions" />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.history-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: 1 / -1;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.chart-card {
  background: var(--surface-elevated);
  border-radius: 12px;
  padding: 0.85rem;
}

.chart-card :deep(.section-title.h4) {
  margin-bottom: 0.5rem;
}

.chart-wrap {
  height: 150px;
}

@media (max-width: 900px) {
  .chart-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
