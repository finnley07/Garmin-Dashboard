<script setup lang="ts">
import { computed } from 'vue'
import type { GarminActivity } from '../types/garmin'
import { formatDate, formatDuration, getTypeLabel } from '../utils/formatters'
import { getActivityTypeIcon } from '../utils/icons'
import AppIcon from './AppIcon.vue'
import SectionTitle from './SectionTitle.vue'
import { useI18n } from '../i18n'

const props = defineProps<{
  activities: GarminActivity[]
}>()

const emit = defineEmits<{ openTrainings: [] }>()

const { t, locale } = useI18n()

const recent = computed(() => props.activities.slice(0, 5))

function activityDate(dateStr: string) {
  void locale.value
  return formatDate(dateStr)
}
</script>

<template>
  <section class="recent-card">
    <div class="recent-header">
      <SectionTitle :title="t('recent.title')" info-key="recentActivities" />
      <button type="button" class="link-btn" @click="emit('openTrainings')">
        {{ t('recent.showAll') }}
      </button>
    </div>

    <ul v-if="recent.length" class="recent-list">
      <li v-for="activity in recent" :key="activity.activityId" class="recent-item">
        <div class="recent-main">
          <span class="type">
            <AppIcon
              :icon="getActivityTypeIcon(activity.activityType?.typeKey ?? 'unknown')"
              size="sm"
            />
            {{ getTypeLabel(activity.activityType?.typeKey ?? 'unknown') }}
          </span>
          <strong>{{ activity.activityName }}</strong>
          <span class="date">{{ activityDate(activity.startTimeLocal) }}</span>
        </div>
        <div class="recent-meta">
          <span v-if="activity.distance">{{ (activity.distance / 1000).toFixed(1) }} km</span>
          <span>{{ formatDuration(activity.duration) }}</span>
        </div>
      </li>
    </ul>

    <p v-else class="empty">{{ t('empty.noRecent') }}</p>
  </section>
</template>

<style scoped>
.recent-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.recent-header :deep(.section-title) {
  margin-bottom: 0;
}

.link-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
}

.recent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-elevated);
  border-radius: 10px;
}

.recent-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.type {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: var(--accent);
}

.recent-main strong {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.recent-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-shrink: 0;
}

.empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.85rem;
}
</style>
