<script setup lang="ts">
import { computed } from 'vue'
import { parseExtendedWellness } from '../utils/wellness'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  trainingStatusHistory?: { date: string; statusKey: string; acwr: number | null }[] | null
}>()

const { t } = useI18n()

const history = computed(() =>
  parseExtendedWellness({
    trainingStatus: null,
    trainingReadiness: null,
    vo2max: null,
    trainingStatusHistory: props.trainingStatusHistory,
  }).trainingStatusHistory.slice(-14),
)

const statusColors: Record<string, string> = {
  PRODUCTIVE: '#22c55e',
  PEAKING: '#22d3ee',
  RECOVERY_1: '#818cf8',
  RECOVERY_2: '#818cf8',
  RECOVERY_3: '#818cf8',
  MAINTAINING: '#94a3b8',
  OVERREACHING: '#ef4444',
  UNPRODUCTIVE: '#f59e0b',
  DETRAINING: '#64748b',
}
</script>

<template>
  <section v-if="history.length >= 2" class="status-panel">
    <SectionTitle :title="t('trainingStatusHistory.title')" info-key="trainingStatusHistory" />
    <p class="hint">{{ t('trainingStatusHistory.hint') }}</p>
    <ul class="timeline">
      <li v-for="point in history" :key="point.date">
        <span class="date">{{ point.date.slice(5) }}</span>
        <span
          class="badge"
          :style="{ borderColor: statusColors[point.statusKey] ?? '#94a3b8' }"
        >
          {{ point.statusLabel }}
        </span>
        <span v-if="point.acwr !== null" class="acwr">ACWR {{ point.acwr.toFixed(2) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.status-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: 1 / -1;
}

.hint {
  margin: -0.5rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  max-height: 240px;
  overflow: auto;
}

.timeline li {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  gap: 0.65rem;
  align-items: center;
  font-size: 0.8rem;
}

.date {
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.badge {
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid;
  background: rgba(255, 255, 255, 0.03);
  font-weight: 600;
}

.acwr {
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 0.72rem;
}
</style>
