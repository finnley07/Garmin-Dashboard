<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchActivityDetail, getCachedActivityDetail } from '../api/garmin'
import MuscleGroupChart from './MuscleGroupChart.vue'
import HrZoneChart from './HrZoneChart.vue'
import SplitsChart from './SplitsChart.vue'
import type { ActivityDetail, GarminActivity } from '../types/garmin'
import { buildLocalActivityDetail, needsRemoteDetail } from '../utils/activityDetail'
import { muscleLabelKey } from '../utils/muscleGroups'
import {
  getTypeLabel,
  formatDate,
  formatDuration,
  formatExerciseLabel,
  formatPace,
  formatTrainingEffect,
  gramsToKg,
} from '../utils/formatters'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'

const { t } = useI18n()

const props = defineProps<{
  activity: GarminActivity | null
  inline?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const detail = ref<ActivityDetail | null>(null)
const loadingRemote = ref(false)
const error = ref<string | null>(null)

const typeKey = computed(() => props.activity?.activityType?.typeKey ?? '')
const isStrength = computed(() => typeKey.value === 'strength_training')
const isCardio = computed(
  () => typeKey.value === 'running' || typeKey.value === 'cycling' || typeKey.value === 'swimming',
)

const exercises = computed(() => {
  const activity = detail.value?.activity ?? props.activity
  if (!activity) return []

  return (
    (detail.value?.exerciseSets as typeof activity.summarizedExerciseSets) ??
    activity.summarizedExerciseSets ??
    []
  )
})

const muscleGroups = computed(() => detail.value?.muscleGroups ?? [])

watch(
  () => props.activity?.activityId,
  async (id) => {
    error.value = null
    loadingRemote.value = false

    if (!id || !props.activity) {
      detail.value = null
      return
    }

    const cached = getCachedActivityDetail(id)
    if (cached) {
      detail.value = cached
      return
    }

    detail.value = buildLocalActivityDetail(props.activity)

    if (!needsRemoteDetail(props.activity)) {
      return
    }

    loadingRemote.value = true
    try {
      detail.value = await fetchActivityDetail(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : t('loading.detailsError')
    } finally {
      loadingRemote.value = false
    }
  },
  { immediate: true },
)

const activity = computed(() => detail.value?.activity ?? props.activity)

function close() {
  emit('close')
}
</script>

<template>
  <div
    v-if="activity"
    :class="inline ? 'inline-root' : 'overlay'"
    @click.self="!inline && close()"
  >
    <div class="panel" :class="{ 'panel-inline': inline }">
      <header class="panel-header">
        <div>
          <span class="type-badge">
            {{ getTypeLabel(typeKey) }}
          </span>
          <h2>{{ activity.activityName }}</h2>
          <p class="meta">
            {{ formatDate(activity.startTimeLocal) }}
            <span v-if="activity.locationName"> · {{ activity.locationName }}</span>
          </p>
        </div>
        <button v-if="!inline" class="close-btn" :aria-label="t('common.close')" @click="close">
          <AppIcon name="close" size="sm" />
        </button>
      </header>

      <div v-if="loadingRemote" class="remote-banner">
        <span class="spinner" aria-hidden="true" />
        {{ t('loading.details') }}
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <div class="panel-body">
        <section class="stats-row">
          <div class="stat">
            <span class="label">{{ t('detail.duration') }}</span>
            <strong>{{ formatDuration(activity.duration) }}</strong>
          </div>
          <div class="stat">
            <span class="label">{{ t('detail.calories') }}</span>
            <strong>{{ activity.calories ?? '–' }}</strong>
          </div>
          <div v-if="activity.distance" class="stat">
            <span class="label">{{ t('detail.distance') }}</span>
            <strong>{{ (activity.distance / 1000).toFixed(2) }} km</strong>
          </div>
          <div v-if="activity.averageHR" class="stat">
            <span class="label">{{ t('detail.avgHr') }}</span>
            <strong>{{ activity.averageHR }} bpm</strong>
          </div>
          <div v-if="activity.maxHR" class="stat">
            <span class="label">{{ t('detail.maxHr') }}</span>
            <strong>{{ activity.maxHR }} bpm</strong>
          </div>
          <div v-if="activity.averageSpeed && isCardio" class="stat">
            <span class="label">{{ t('detail.avgPace') }}</span>
            <strong>{{ formatPace(activity.averageSpeed) }}</strong>
          </div>
          <div v-if="activity.elevationGain" class="stat">
            <span class="label">{{ t('detail.elevation') }}</span>
            <strong>+{{ Math.round(activity.elevationGain) }} m</strong>
          </div>
          <div v-if="isStrength && activity.totalSets" class="stat">
            <span class="label">{{ t('detail.sets') }}</span>
            <strong>{{ activity.totalSets }}</strong>
          </div>
          <div v-if="isStrength && activity.totalReps" class="stat">
            <span class="label">{{ t('detail.reps') }}</span>
            <strong>{{ activity.totalReps }}</strong>
          </div>
          <div v-if="activity.fastestSplit_1000 && isCardio" class="stat">
            <span class="label">{{ t('detail.bestKm') }}</span>
            <strong>{{ formatPace(activity.fastestSplit_1000) }}</strong>
          </div>
          <div v-if="activity.avgGradeAdjustedSpeed && isCardio" class="stat">
            <span class="label">{{ t('detail.gapPace') }}</span>
            <strong>{{ formatPace(activity.avgGradeAdjustedSpeed) }}</strong>
          </div>
          <div v-if="activity.lapCount" class="stat">
            <span class="label">{{ t('detail.laps') }}</span>
            <strong>{{ activity.lapCount }}</strong>
          </div>
        </section>

        <section v-if="activity.trainingEffectLabel || activity.aerobicTrainingEffect" class="effects">
          <div v-if="activity.trainingEffectLabel" class="effect-chip">
            {{ t('detail.trainingEffect') }}: {{ formatTrainingEffect(activity.trainingEffectLabel) }}
          </div>
          <div v-if="activity.aerobicTrainingEffect" class="effect-chip">
            {{ t('detail.aerobic') }}: {{ activity.aerobicTrainingEffect.toFixed(1) }}
          </div>
          <div v-if="activity.anaerobicTrainingEffect" class="effect-chip">
            {{ t('detail.anaerobic') }}: {{ activity.anaerobicTrainingEffect.toFixed(1) }}
          </div>
          <div v-if="activity.activityTrainingLoad" class="effect-chip">
            Load: {{ Math.round(activity.activityTrainingLoad) }}
          </div>
        </section>

        <section v-if="isStrength && muscleGroups.length" class="charts">
          <MuscleGroupChart :exercises="exercises" />
        </section>

        <section v-if="isStrength && exercises.length" class="exercise-table-section">
          <h3>{{ t('detail.exercises') }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ t('detail.exercise') }}</th>
                  <th>{{ t('detail.sets') }}</th>
                  <th>{{ t('detail.reps') }}</th>
                  <th>{{ t('detail.maxWeight') }}</th>
                  <th>{{ t('detail.volume') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(ex, i) in exercises" :key="i">
                  <td>{{ formatExerciseLabel(ex.category, ex.subCategory) }}</td>
                  <td>{{ ex.sets ?? '–' }}</td>
                  <td>{{ ex.reps ?? '–' }}</td>
                  <td>{{ ex.maxWeight ? gramsToKg(ex.maxWeight) : '–' }}</td>
                  <td>{{ ex.volume ? gramsToKg(ex.volume) : '–' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="isCardio" class="charts-grid">
          <HrZoneChart :activity="activity" />
          <SplitsChart :splits="detail?.splits ?? null" :loading="loadingRemote" />
        </section>

        <section v-else-if="!isStrength" class="charts-grid">
          <HrZoneChart :activity="activity" />
        </section>

        <section v-if="muscleGroups.length && isStrength" class="muscle-list">
          <h3>{{ t('detail.muscleGroups') }}</h3>
          <div class="muscle-cards">
            <article v-for="group in muscleGroups" :key="group.name" class="muscle-card">
              <strong>{{ t(muscleLabelKey(group.name)) }}</strong>
              <span>{{ t('detail.setsReps', { sets: group.sets, reps: group.reps }) }}</span>
              <small>{{ group.exercises.join(', ') }}</small>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.inline-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  width: min(920px, 100%);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-inline {
  width: 100%;
  max-height: none;
  height: 100%;
  border-radius: 14px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
}

.type-badge {
  font-size: 0.75rem;
  color: var(--accent);
}

.panel-header h2 {
  margin: 0.25rem 0;
  font-size: 1.25rem;
}

.meta {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.close-btn {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.remote-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.8rem;
  color: var(--accent);
  background: rgba(0, 180, 216, 0.08);
  border-bottom: 1px solid rgba(0, 180, 216, 0.15);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 180, 216, 0.25);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.panel-body {
  overflow-y: auto;
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.error {
  padding: 0.75rem 1.5rem;
  color: #f87171;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(120px, 100%), 1fr));
  gap: 0.75rem;
}

.stat {
  background: var(--surface-elevated);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat .label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.effects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.effect-chip {
  font-size: 0.8rem;
  padding: 0.35rem 0.75rem;
  background: rgba(0, 180, 216, 0.12);
  border: 1px solid rgba(0, 180, 216, 0.25);
  border-radius: 999px;
  color: var(--accent);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 1rem;
}

.exercise-table-section h3,
.muscle-list h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

th,
td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.muscle-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 0.75rem;
}

.muscle-card {
  background: var(--surface-elevated);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.muscle-card span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.muscle-card small {
  font-size: 0.75rem;
  color: var(--accent);
}
</style>
