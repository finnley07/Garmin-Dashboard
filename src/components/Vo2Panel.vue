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
  Legend,
  Filler,
} from 'chart.js'
import { parseExtendedWellness } from '../utils/wellness'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'
import InfoTooltip from './InfoTooltip.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps<{
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
  vo2maxHistory?: unknown[] | null
}>()

const { t } = useI18n()

const wellness = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
    vo2maxHistory: props.vo2maxHistory,
  }),
)

const hasVo2 = computed(() => wellness.value.vo2max !== null)

const chartData = computed(() => {
  const history = wellness.value.vo2History
  if (history.length >= 2) {
    return {
      labels: history.map((p) => p.date.slice(5)),
      datasets: [
        {
          label: 'VO₂max',
          data: history.map((p) => p.value),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
        },
      ],
    }
  }
  return null
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#94a3b8', maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
}
</script>

<template>
  <section v-if="hasVo2" class="vo2-panel">
    <div class="vo2-header">
      <div>
        <SectionTitle :title="t('performance.vo2title')" info-key="vo2Panel" />
        <p v-if="wellness.vo2Date" class="date">{{ wellness.vo2Date }}</p>
      </div>
      <div class="vo2-value">
        <strong>{{ wellness.vo2max?.toFixed(1) }}</strong>
        <span>ml/kg/min</span>
      </div>
    </div>

    <div class="vo2-meta">
      <span v-if="wellness.fitnessAge" class="meta-item">
        {{ t('performance.fitnessAge') }}: {{ wellness.fitnessAge }}
        <InfoTooltip info-key="fitnessAge" />
      </span>
      <span v-if="wellness.heatAcclimation" class="meta-item">
        {{ t('performance.heat') }}: {{ wellness.heatAcclimation }}%
        <InfoTooltip info-key="heatAcclimation" />
      </span>
    </div>

    <div v-if="chartData" class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="hint">{{ t('performance.vo2hint') }}</p>
  </section>
</template>

<style scoped>
.vo2-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  height: 100%;
}

.vo2-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.vo2-panel h3 {
  margin: 0;
  font-size: 1rem;
}

.date {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.vo2-value {
  text-align: right;
}

.vo2-value strong {
  display: block;
  font-size: 2rem;
  color: #4ade80;
  line-height: 1;
}

.vo2-value span {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.vo2-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0.75rem 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.chart-wrap {
  height: 180px;
  margin-top: 0.5rem;
}

.hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
