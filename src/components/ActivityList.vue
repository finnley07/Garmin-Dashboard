<script setup lang="ts">
import type { GarminActivity } from '../types/garmin'
import { formatDate, formatDuration, getTypeLabel } from '../utils/formatters'
import { getActivityTypeIcon } from '../utils/icons'
import AppIcon from './AppIcon.vue'
import { useI18n } from '../i18n'

defineProps<{
  activities: GarminActivity[]
  selectedId?: number
  embedded?: boolean
}>()

const emit = defineEmits<{ select: [activity: GarminActivity] }>()

const { t, locale } = useI18n()

function activityDate(dateStr: string) {
  void locale.value
  return formatDate(dateStr)
}
</script>

<template>
  <div class="activity-list-card" :class="{ embedded }">
    <h3 v-if="!embedded">
      {{ t('trainings.title') }}
      <span class="hint">{{ t('trainings.clickHint') }}</span>
    </h3>
    <div class="activity-list">
      <button
        v-for="activity in activities"
        :key="activity.activityId"
        class="activity-row"
        :class="{ selected: selectedId === activity.activityId }"
        @click="emit('select', activity)"
      >
        <div class="activity-main">
          <span class="activity-type">
            <AppIcon
              :icon="getActivityTypeIcon(activity.activityType?.typeKey ?? 'unknown')"
              size="sm"
            />
            {{ getTypeLabel(activity.activityType?.typeKey ?? 'unknown') }}
          </span>
          <strong class="activity-name" :title="activity.activityName">{{ activity.activityName }}</strong>
          <span class="activity-date">{{ activityDate(activity.startTimeLocal) }}</span>
        </div>
        <div class="activity-stats">
          <span v-if="activity.distance">{{ (activity.distance / 1000).toFixed(1) }} km</span>
          <span>{{ formatDuration(activity.duration) }}</span>
          <span v-if="activity.averageHR" class="stat-chip">
            <AppIcon name="heart" size="sm" /> {{ activity.averageHR }}
          </span>
          <span v-if="activity.totalSets" class="stat-chip">
            <AppIcon name="dumbbell" size="sm" />
            {{ t('trainings.setsCount', { count: activity.totalSets }) }}
          </span>
          <span v-if="activity.calories" class="stat-chip">
            <AppIcon name="fire" size="sm" /> {{ activity.calories }}
          </span>
        </div>
        <AppIcon v-if="!embedded" name="chevron-right" class="chevron" size="sm" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.activity-list-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.activity-list-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.hint {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--text-muted);
  margin-left: 0.5rem;
}

.activity-list-card.embedded {
  padding: 0.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  height: 100%;
}

.activity-list-card.embedded .activity-list {
  max-height: calc(100vh - 280px);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 520px;
  overflow-y: auto;
}

.activity-row.selected {
  border-color: var(--accent);
  background: rgba(0, 180, 216, 0.1);
}

.activity-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--surface-elevated);
  border-radius: 10px;
  border: 1px solid transparent;
  transition: border-color 0.15s, background 0.15s;
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: inherit;
  font: inherit;
}

.activity-list-card:not(.embedded) .activity-row {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.activity-row:hover {
  border-color: var(--accent);
  background: rgba(0, 180, 216, 0.06);
}

.activity-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}

.activity-type {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--accent);
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.activity-name {
  font-size: 0.95rem;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.activity-list-card:not(.embedded) .activity-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.activity-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.activity-list-card:not(.embedded) .activity-stats {
  flex-wrap: nowrap;
}

.chevron {
  color: var(--accent);
  flex-shrink: 0;
}
</style>
