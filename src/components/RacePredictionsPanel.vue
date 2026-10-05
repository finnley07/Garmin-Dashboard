<script setup lang="ts">
import { computed } from 'vue'
import { parseExtendedWellness } from '../utils/wellness'
import { raceDistanceLabel } from '../utils/raceCalendar'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
  racePredictions?: unknown
}>()

const { t } = useI18n()

const predictions = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
    racePredictions: props.racePredictions,
  }).racePredictions,
)
</script>

<template>
  <section v-if="predictions.length" class="race-card">
    <SectionTitle :title="t('performance.racePredictions')" info-key="racePredictions" />
    <ul>
      <li v-for="item in predictions" :key="item.distance">
        <span class="dist">{{ raceDistanceLabel(item.distance, t) }}</span>
        <strong>{{ item.timeLabel }}</strong>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.race-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.race-card h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.race-card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
  gap: 0.5rem;
}

.race-card li {
  background: var(--surface-elevated);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dist {
  font-size: 0.7rem;
  color: var(--accent);
}

.race-card strong {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}
</style>
