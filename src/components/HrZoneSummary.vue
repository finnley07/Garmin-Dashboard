<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import { aggregateHrZones } from '../utils/activityStats'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()

const aggregated = computed(() => aggregateHrZones(props.activities))

const zones = computed(() => {
  const labels = [
    t('hrZones.z1'),
    t('hrZones.z2'),
    t('hrZones.z3'),
    t('hrZones.z4'),
    t('hrZones.z5'),
  ]
  const colors = ['#94a3b8', '#22c55e', '#f59e0b', '#ef4444', '#dc2626']
  return aggregated.value.totals
    .map((seconds, i) => ({
      label: labels[i]!,
      minutes: Math.round(seconds / 60),
      color: colors[i]!,
    }))
    .filter((z) => z.minutes > 0)
})

const chartData = computed(() => ({
  labels: zones.value.map((z) => z.label),
  datasets: [
    {
      data: zones.value.map((z) => z.minutes),
      backgroundColor: zones.value.map((z) => z.color),
      borderWidth: 0,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: '#94a3b8', boxWidth: 10, font: { size: 11 } },
    },
  },
}
</script>

<template>
  <div v-if="zones.length" class="chart-card">
    <SectionTitle :title="t('charts.hrZones')" info-key="hrZones" />
    <p class="hint">{{ t('charts.hrZonesHint', { count: aggregated.activities }) }}</p>
    <div class="chart-container">
      <Doughnut :data="chartData" :options="chartOptions" />
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
  margin: 0;
  font-size: 1rem;
}

.hint {
  margin: 0.25rem 0 0.75rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.chart-container {
  height: 220px;
}
</style>
