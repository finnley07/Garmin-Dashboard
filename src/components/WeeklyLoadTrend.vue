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
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t, locale } = useI18n()

const buckets = computed(() => {
  void locale.value
  return computeWeeklyTrends(props.activities, 8)
})

const hasLoad = computed(() => buckets.value.some((b) => b.load > 0))

const chartData = computed(() => ({
  labels: buckets.value.map((b) => b.label),
  datasets: [
    {
      label: t('performance.trainingLoad'),
      data: buckets.value.map((b) => Math.round(b.load)),
      backgroundColor: 'rgba(139, 92, 246, 0.65)',
      borderRadius: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
  },
}
</script>

<template>
  <div v-if="hasLoad" class="chart-card">
    <SectionTitle :title="t('performance.loadTrend')" info-key="weeklyLoadTrend" />
    <div class="chart-container">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.chart-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.chart-container {
  height: 220px;
}
</style>
