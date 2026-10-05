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
} from 'chart.js'
import { useI18n } from '../i18n'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const props = defineProps<{
  splits: unknown[] | null
  loading?: boolean
}>()

const { t } = useI18n()

interface SplitEntry {
  distance?: number
  duration?: number
  averageSpeed?: number
}

const parsedSplits = computed(() => {
  if (!props.splits?.length) return []

  return props.splits
    .map((split, index) => {
      const s = split as SplitEntry
      const speed = s.averageSpeed ?? 0
      const paceMin = speed > 0 ? 1000 / speed / 60 : 0
      return {
        label: `${index + 1}`,
        pace: Math.round(paceMin * 100) / 100,
        distance: s.distance ?? 1000,
      }
    })
    .filter((s) => s.pace > 0)
})

const chartData = computed(() => ({
  labels: parsedSplits.value.map((s) => `km ${s.label}`),
  datasets: [
    {
      label: t('charts.paceLabel'),
      data: parsedSplits.value.map((s) => s.pace),
      borderColor: '#00b4d8',
      backgroundColor: 'rgba(0, 180, 216, 0.2)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: {
      reverse: true,
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(255,255,255,0.05)' },
      title: { display: true, text: 'min/km', color: '#94a3b8' },
    },
  },
}

const hasData = computed(() => parsedSplits.value.length > 0)
</script>

<template>
  <div class="chart-card">
    <h3>{{ t('charts.splits') }}</h3>
    <div v-if="loading && !hasData" class="chart-container loading-skeleton" />
    <div v-else-if="hasData" class="chart-container">
      <Line :data="chartData" :options="chartOptions" />
    </div>
    <p v-else class="empty">{{ t('charts.splitsEmpty') }}</p>
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

.loading-skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
