<script setup lang="ts">
import { computed } from 'vue'
import type { GarminActivity } from '../types/garmin'
import { collectRecentStrengthExercises, hasStrengthData } from '../utils/dashboardAnalytics'
import MuscleGroupChart from './MuscleGroupChart.vue'
import SectionTitle from './SectionTitle.vue'
import { useI18n } from '../i18n'

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()
const show = computed(() => hasStrengthData(props.activities))
const exercises = computed(() => collectRecentStrengthExercises(props.activities, 7))
</script>

<template>
  <section v-if="show" class="muscle-panel">
    <SectionTitle :title="t('analytics.muscleBalance')" info-key="muscleBalance" />
    <p class="hint">{{ t('analytics.muscleBalanceHint') }}</p>
    <MuscleGroupChart :exercises="exercises" />
  </section>
</template>

<style scoped>
.muscle-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: 1 / -1;
}

.hint {
  margin: -0.35rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
