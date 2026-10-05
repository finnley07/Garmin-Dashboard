<script setup lang="ts">
import { computed } from 'vue'
import type { GarminActivity, UserProfileSettings } from '../types/garmin'
import { buildWeeklyProgress, computeRecentWeekStats } from '../utils/activityStats'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  activities: GarminActivity[]
  profile: UserProfileSettings
}>()

const { t, locale } = useI18n()

const week = computed(() => computeRecentWeekStats(props.activities))
const items = computed(() => {
  void locale.value
  return buildWeeklyProgress(week.value, props.profile.weeklyTargets)
})

function progressPercent(current: number, target: number) {
  if (!target) return 0
  return Math.min(100, Math.round((current / target) * 100))
}
</script>

<template>
  <section v-if="items.length" class="progress-card">
    <SectionTitle :title="t('progress.title')" info-key="weeklyProgress" />
    <p class="hint">{{ t('progress.hint') }}</p>

    <ul class="progress-list">
      <li v-for="item in items" :key="item.key">
        <div class="progress-head">
          <span>{{ item.label }}</span>
          <span>{{ item.current }} / {{ item.target }} {{ item.unit }}</span>
        </div>
        <div class="bar-track">
          <div
            class="bar-fill"
            :style="{ width: `${progressPercent(item.current, item.target)}%` }"
            :class="{ complete: item.current >= item.target }"
          />
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.progress-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  height: 100%;
}

.progress-card h3 {
  margin: 0;
  font-size: 1rem;
}

.hint {
  margin: 0.25rem 0 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.progress-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
}

.bar-track {
  height: 8px;
  background: var(--surface-elevated);
  border-radius: 999px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0077b6, #00b4d8);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.bar-fill.complete {
  background: linear-gradient(90deg, #16a34a, #4ade80);
}
</style>
