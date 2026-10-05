<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'
import { chartColors, chartScaleDefaults, chartTooltipDefaults } from '../utils/chartTheme'
import AppIcon from './AppIcon.vue'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export interface MetricHistoryPoint {
  date: string
  value: number
}

const props = defineProps<{
  open: boolean
  title: string
  currentValue?: string | number | null
  unit?: string
  points: MetricHistoryPoint[]
  color?: string
  fillColor?: string
  emptyHint: string
}>()

const emit = defineEmits<{ close: [] }>()

const chartData = computed(() => {
  if (props.points.length < +2) return null

  const lineColor = props.color ?? chartColors.purpleSolid
  const fill = props.fillColor ?? 'rgba(168, 85, 247, 0.12)'

  return {
    labels: props.points.map((point) => point.date.slice(5)),
    datasets: [
      {
        label: props.title,
        data: props.points.map((point) => point.value),
        borderColor: lineColor,
        backgroundColor: fill,
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: chartTooltipDefaults(),
  },
  scales: {
    x: {
      ...chartScaleDefaults(),
      ticks: { ...chartScaleDefaults().ticks, maxTicksLimit: 10 },
    },
    y: chartScaleDefaults(),
  },
}))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="metric-dialog-backdrop" @click.self="emit('close')">
      <div class="metric-dialog" role="dialog" :aria-label="title">
        <header class="metric-dialog-header">
          <div>
            <h3>{{ title }}</h3>
            <p v-if="currentValue != null" class="current">
              <strong>{{ currentValue }}</strong>
              <span v-if="unit">{{ unit }}</span>
            </p>
          </div>
          <button type="button" class="close-btn" :aria-label="'Close'" @click="emit('close')">
            <AppIcon name="close" size="sm" />
          </button>
        </header>

        <div v-if="chartData" class="chart-wrap">
          <Line :data="chartData" :options="chartOptions" />
        </div>
        <p v-else class="empty">{{ emptyHint }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.metric-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(4, 8, 16, 0.72);
  backdrop-filter: blur(6px);
}

.metric-dialog {
  width: min(560px, 100%);
  background: var(--surface-elevated, var(--surface));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem 1.35rem 1.35rem;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.metric-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-dialog-header h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text);
}

.current {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.current strong {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  color: var(--text);
  margin-right: 0.35rem;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text);
  border-color: var(--accent);
}

.chart-wrap {
  height: 260px;
}

.empty {
  margin: 0;
  padding: 2rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
