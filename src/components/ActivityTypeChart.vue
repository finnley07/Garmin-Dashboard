<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { DashboardStats } from '../types/garmin'
import { chartColors, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ stats: DashboardStats }>()

const { t } = useI18n()

const chartData = computed(() => {
  const entries = Object.entries(props.stats.activityBreakdown)
  const colors = chartColors.palette

  return {
    labels: entries.map(([key]) => {
      const label = t(`activityTypes.${key}`)
      return label === `activityTypes.${key}` ? key : label
    }),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map((_, i) => colors[i % colors.length]),
        borderWidth: 0,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: chartColors.tick, padding: 12, font: { family: "'Outfit', sans-serif" } },
    },
    tooltip: chartTooltipDefaults(),
  },
}
</script>

<template>
  <div class="chart-card">
    <SectionTitle :title="t('charts.activityTypes')" info-key="activityTypes" />
    <div class="chart-container">
      <Doughnut :data="chartData" :options="chartOptions" />
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
