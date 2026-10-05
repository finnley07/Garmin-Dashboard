<script setup lang="ts">
import { computed } from 'vue'
import type { GarminActivity } from '../types/garmin'
import { buildTrainingHeatmap } from '../utils/dashboardAnalytics'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()
const days = computed(() => buildTrainingHeatmap(props.activities, 84))
const maxCount = computed(() => Math.max(1, ...days.value.map((d) => d.count)))

function level(count: number) {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}
</script>

<template>
  <section class="heatmap-panel">
    <SectionTitle :title="t('analytics.heatmap')" info-key="heatmap" />
    <p class="hint">{{ t('analytics.heatmapHint') }}</p>
    <div class="grid">
      <span
        v-for="day in days"
        :key="day.date"
        class="cell"
        :class="`l${level(day.count)}`"
        :title="`${day.date}: ${day.count} ${t('common.sessions')}`"
      />
    </div>
    <div class="legend">
      <span>{{ t('analytics.less') }}</span>
      <span class="cell l0" />
      <span class="cell l1" />
      <span class="cell l2" />
      <span class="cell l3" />
      <span>{{ t('analytics.more') }}</span>
    </div>
  </section>
</template>

<style scoped>
.heatmap-panel {
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

.grid {
  display: grid;
  grid-template-columns: repeat(28, minmax(0, 1fr));
  gap: 3px;
}

.cell {
  aspect-ratio: 1;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.12);
}

.cell.l1 { background: rgba(34, 211, 238, 0.35); }
.cell.l2 { background: rgba(34, 211, 238, 0.6); }
.cell.l3 { background: rgba(129, 140, 248, 0.85); }

.legend {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.65rem;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.legend .cell {
  width: 12px;
  height: 12px;
}

@media (max-width: 900px) {
  .heatmap-panel { grid-column: 1 / -1; }
  .grid { grid-template-columns: repeat(14, minmax(0, 1fr)); }
}
</style>
