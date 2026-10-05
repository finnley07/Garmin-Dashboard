<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js'
import type { TooltipItem } from 'chart.js'
import type { GarminActivity } from '../types/garmin'
import { buildPaceTrend } from '../utils/dashboardAnalytics'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()
const points = computed(() => buildPaceTrend(props.activities))
const show = computed(() => points.value.length >= 2)

const chartData = computed(() => ({
  labels: points.value.map((p) => p.label),
  datasets: [
    {
      data: points.value.map((p) => p.paceMinPerKm),
      borderColor: chartColors.coral.replace('0.72', '1'),
      backgroundColor: 'rgba(251, 113, 133, 0.12)',
      fill: true,
      tension: 0.3,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...chartTooltipDefaults(),
      callbacks: {
        label: (ctx: TooltipItem<'line'>) => {
          const y = ctx.parsed.y
          if (y == null) return ''
          return `${y.toFixed(2)} ${t('analytics.minPerKm')}`
        },
      },
    },
  },
  scales: {
    x: chartScaleDefaults(),
    y: {
      ...chartScaleDefaults(),
      reverse: true,
      title: { display: true, text: t('analytics.paceAxis'), color: chartColors.tick },
    },
  },
}))
</script>

<template>
  <section v-if="show" class="pace-panel">
    <SectionTitle :title="t('analytics.paceTrend')" info-key="paceTrend" />
    <p class="hint">{{ t('analytics.paceTrendHint') }}</p>
    <div class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<style scoped>
.pace-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: span 6;
}

.hint {
  margin: -0.35rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.chart-wrap {
  height: 200px;
}

@media (max-width: 900px) {
  .pace-panel { grid-column: 1 / -1; }
}
</style>
