<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import { formatShortDate } from '../utils/formatters'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t, locale } = useI18n()

const chartData = computed(() => {
  void locale.value
  const sorted = [...props.activities]
    .sort((a, b) => new Date(a.startTimeLocal).getTime() - new Date(b.startTimeLocal).getTime())
    .slice(-10)

  return {
    labels: sorted.map((a) => formatShortDate(new Date(a.startTimeLocal))),
    datasets: [
      {
        label: t('charts.distanceKm'),
        data: sorted.map((a) => Math.round((a.distance / 1000) * 10) / 10),
        backgroundColor: chartColors.cyan,
        borderColor: chartColors.cyanSolid,
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }
})

const scale = chartScaleDefaults()

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: chartTooltipDefaults(),
  },
  scales: {
    x: scale,
    y: { ...scale, beginAtZero: true },
  },
}
</script>

<template>
  <div class="chart-card">
    <SectionTitle :title="t('charts.distancePerActivity')" info-key="distanceChart" />
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
  font-weight: 600;
}

.chart-container {
  height: 260px;
}
</style>
