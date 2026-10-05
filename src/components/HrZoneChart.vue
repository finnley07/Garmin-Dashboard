<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import { useI18n } from '../i18n'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ activity: GarminActivity }>()

const { t } = useI18n()

const zones = computed(() => {
  const values = [
    { label: t('hrZones.zone1'), seconds: props.activity.hrTimeInZone_1 ?? 0, color: '#94a3b8' },
    { label: t('hrZones.zone2'), seconds: props.activity.hrTimeInZone_2 ?? 0, color: '#22c55e' },
    { label: t('hrZones.zone3'), seconds: props.activity.hrTimeInZone_3 ?? 0, color: '#f59e0b' },
    { label: t('hrZones.zone4'), seconds: props.activity.hrTimeInZone_4 ?? 0, color: '#ef4444' },
    { label: t('hrZones.zone5'), seconds: props.activity.hrTimeInZone_5 ?? 0, color: '#dc2626' },
  ]
  return values.filter((z) => z.seconds > 0)
})

const chartData = computed(() => ({
  labels: zones.value.map((z) => z.label),
  datasets: [
    {
      data: zones.value.map((z) => Math.round(z.seconds / 60)),
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
      labels: { color: '#94a3b8', boxWidth: 12, padding: 8, font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (ctx: { parsed: number }) => `${ctx.parsed} min`,
      },
    },
  },
}

const hasData = computed(() => zones.value.length > 0)
</script>

<template>
  <div class="chart-card">
    <h3>{{ t('charts.hrZonesActivity') }}</h3>
    <div v-if="hasData" class="chart-container">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="empty">{{ t('charts.hrZonesEmpty') }}</p>
  </div>
</template>

<style scoped>
.chart-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
}

.chart-card h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}

.chart-container {
  height: 200px;
}

.empty {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0;
}
</style>
