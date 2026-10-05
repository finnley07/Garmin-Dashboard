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
import { computeWeeklyTrends } from '../utils/activityStats'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t, locale } = useI18n()

const buckets = computed(() => {
  void locale.value
  return computeWeeklyTrends(props.activities, 8)
})

const chartData = computed(() => ({
  labels: buckets.value.map((b) => b.label),
  datasets: [
    {
      label: t('charts.kilometers'),
      data: buckets.value.map((b) => Math.round(b.km * 10) / 10),
      backgroundColor: chartColors.cyan,
      borderRadius: 6,
      yAxisID: 'y',
    },
    {
      label: t('common.sessions'),
      data: buckets.value.map((b) => b.sessions),
      backgroundColor: chartColors.purple,
      borderRadius: 6,
      yAxisID: 'y1',
    },
  ],
}))

const scale = chartScaleDefaults()

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: chartColors.tick, font: { family: "'Outfit', sans-serif" } },
    },
    tooltip: chartTooltipDefaults(),
  },
  scales: {
    x: scale,
    y: { ...scale, position: 'left' as const },
    y1: {
      ...scale,
      position: 'right' as const,
      grid: { drawOnChartArea: false },
    },
  },
}))
</script>

<template>
  <div class="chart-card">
    <SectionTitle :title="t('charts.weeklyTrend')" info-key="weeklyTrend" />
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  padding: 1.25rem;
}

.chart-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.chart-container {
  height: 260px;
}
</style>
