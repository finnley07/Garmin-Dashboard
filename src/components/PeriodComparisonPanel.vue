<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import { buildPeriodComparison } from '../utils/dashboardAnalytics'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()
const rows = computed(() => buildPeriodComparison(props.activities))

const chartData = computed(() => ({
  labels: rows.value.map((row) => t(`analytics.period.${row.key}`)),
  datasets: [
    {
      label: t('analytics.period.thisWeek'),
      data: rows.value.map((row) => row.current),
      backgroundColor: chartColors.cyan,
      borderRadius: 4,
    },
    {
      label: t('analytics.period.lastWeek'),
      data: rows.value.map((row) => row.previous),
      backgroundColor: chartColors.purple,
      borderRadius: 4,
    },
    {
      label: t('analytics.period.avg4w'),
      data: rows.value.map((row) => row.avg4w),
      backgroundColor: chartColors.amber,
      borderRadius: 4,
    },
  ],
}))

const scale = chartScaleDefaults()
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: chartColors.tick, font: { family: "'Outfit', sans-serif", size: 11 } } },
    tooltip: chartTooltipDefaults(),
  },
  scales: { x: scale, y: { ...scale, beginAtZero: true } },
}
</script>

<template>
  <section class="compare-panel">
    <SectionTitle :title="t('analytics.periodCompare')" info-key="periodCompare" />
    <div class="chart-wrap">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<style scoped>
.compare-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: span 6;
}

.chart-wrap {
  height: 220px;
}

@media (max-width: 900px) {
  .compare-panel { grid-column: 1 / -1; }
}
</style>
