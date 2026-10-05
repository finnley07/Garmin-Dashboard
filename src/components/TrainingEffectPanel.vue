<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import {
  computeTrainingEffectHistory,
  computeWeeklyTrainingEffect,
  hasTrainingEffectData,
} from '../utils/trainingEffect'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()

const show = computed(() => hasTrainingEffectData(props.activities))
const recent = computed(() => computeTrainingEffectHistory(props.activities, 14))
const weekly = computed(() => computeWeeklyTrainingEffect(props.activities, 8))

const recentChart = computed(() => ({
  labels: recent.value.map((point) => point.label),
  datasets: [
    {
      label: t('trainingEffect.aerobic'),
      data: recent.value.map((point) => point.aerobic),
      backgroundColor: chartColors.cyan,
      borderRadius: 4,
    },
    {
      label: t('trainingEffect.anaerobic'),
      data: recent.value.map((point) => point.anaerobic),
      backgroundColor: chartColors.purple,
      borderRadius: 4,
    },
  ],
}))

const weeklyChart = computed(() => ({
  labels: weekly.value.map((point) => point.label),
  datasets: [
    {
      label: t('trainingEffect.aerobic'),
      data: weekly.value.map((point) => point.aerobicAvg),
      backgroundColor: chartColors.cyan,
      borderRadius: 4,
    },
    {
      label: t('trainingEffect.anaerobic'),
      data: weekly.value.map((point) => point.anaerobicAvg),
      backgroundColor: chartColors.purple,
      borderRadius: 4,
    },
  ],
}))

const scale = chartScaleDefaults()

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.tick, font: { family: "'Outfit', sans-serif", size: 11 } },
    },
    tooltip: chartTooltipDefaults(),
  },
  scales: { x: scale, y: { ...scale, beginAtZero: true, suggestedMax: 5 } },
}
</script>

<template>
  <section v-if="show" class="effect-panel">
    <SectionTitle :title="t('trainingEffect.title')" info-key="trainingEffect" />
    <p class="hint">{{ t('trainingEffect.hint') }}</p>

    <div class="charts">
      <article class="chart-card">
        <h4>{{ t('trainingEffect.recent') }}</h4>
        <div class="chart-wrap">
          <Bar :data="recentChart" :options="chartOptions" />
        </div>
      </article>
      <article class="chart-card">
        <h4>{{ t('trainingEffect.weekly') }}</h4>
        <div class="chart-wrap">
          <Bar :data="weeklyChart" :options="chartOptions" />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.effect-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: 1 / -1;
}

.hint {
  margin: -0.5rem 0 1rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.chart-card {
  background: var(--surface-elevated);
  border-radius: 12px;
  padding: 0.85rem;
}

.chart-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.chart-wrap {
  height: 180px;
}

@media (max-width: 900px) {
  .charts {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
