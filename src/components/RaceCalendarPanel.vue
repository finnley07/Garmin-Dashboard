<script setup lang="ts">
import { computed } from 'vue'
import type { PlannedRace, UserProfileSettings } from '../types/garmin'
import { parseExtendedWellness } from '../utils/wellness'
import {
  buildRaceCalendar,
  formatRaceTarget,
  formatTimeDelta,
  raceDistanceLabel,
} from '../utils/raceCalendar'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  profile: UserProfileSettings
  racePredictions?: unknown
}>()

const { t, localeTag } = useI18n()

const predictions = computed(() =>
  parseExtendedWellness({
    trainingStatus: null,
    trainingReadiness: null,
    vo2max: null,
    racePredictions: props.racePredictions,
  }).racePredictions,
)

const entries = computed(() =>
  buildRaceCalendar(props.profile.plannedRaces ?? [], predictions.value),
)

const upcoming = computed(() => entries.value.filter((entry) => entry.daysUntil >= -1))

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(localeTag(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <section v-if="upcoming.length" class="race-panel">
    <SectionTitle :title="t('raceCalendar.title')" info-key="raceCalendar" />
    <p class="hint">{{ t('raceCalendar.hint') }}</p>
    <ul>
      <li v-for="entry in upcoming" :key="entry.race.id">
        <div class="race-main">
          <strong>{{ entry.race.name }}</strong>
          <span class="distance">{{ raceDistanceLabel(entry.race.distance, t) }}</span>
        </div>
        <div class="race-meta">
          <span>{{ formatDate(entry.race.date) }}</span>
          <span v-if="entry.daysUntil >= 0">
            {{ t('raceCalendar.inDays', { count: entry.daysUntil }) }}
          </span>
          <span v-else>{{ t('raceCalendar.past') }}</span>
        </div>
        <div class="race-compare">
          <span v-if="entry.race.targetTimeSeconds">
            {{ t('raceCalendar.target') }}: {{ formatRaceTarget(entry.race.targetTimeSeconds) }}
          </span>
          <span v-if="entry.predictionLabel">
            {{ t('raceCalendar.prediction') }}: {{ entry.predictionLabel }}
          </span>
          <span
            v-if="entry.deltaSeconds !== null"
            class="delta"
            :class="{ good: entry.onTrack, bad: entry.onTrack === false }"
          >
            {{ formatTimeDelta(entry.deltaSeconds) }}
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.race-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.hint {
  margin: -0.5rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

li {
  padding: 0.85rem;
  border-radius: 10px;
  background: var(--surface-elevated);
}

.race-main {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
}

.race-main strong {
  font-size: 0.95rem;
}

.distance {
  font-size: 0.72rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.race-meta,
.race-compare {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.delta.good {
  color: #34d399;
}

.delta.bad {
  color: #f87171;
}
</style>
