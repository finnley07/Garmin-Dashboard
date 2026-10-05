<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ActivityDetailPanel from './ActivityDetailPanel.vue'
import ActivityList from './ActivityList.vue'
import type { GarminActivity } from '../types/garmin'
import { getTypeLabel } from '../utils/formatters'
import { useI18n } from '../i18n'

const props = defineProps<{
  activities: GarminActivity[]
  initialActivityId?: number | null
}>()

const emit = defineEmits<{ activityOpened: [] }>()

const { t } = useI18n()

const typeFilter = ref('all')
const search = ref('')
const selectedActivity = ref<GarminActivity | null>(null)

const activityTypes = computed(() => {
  const counts = new Map<string, number>()
  for (const activity of props.activities) {
    const type = activity.activityType?.typeKey ?? 'unknown'
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const filteredActivities = computed(() => {
  let list = props.activities

  if (typeFilter.value !== 'all') {
    list = list.filter((a) => a.activityType?.typeKey === typeFilter.value)
  }

  const query = search.value.trim().toLowerCase()
  if (query) {
    list = list.filter(
      (a) =>
        a.activityName.toLowerCase().includes(query) ||
        (a.locationName?.toLowerCase().includes(query) ?? false),
    )
  }

  return list
})

watch(
  () => props.initialActivityId,
  (id) => {
    if (!id) return
    const match = props.activities.find((a) => a.activityId === id)
    if (match) selectedActivity.value = match
    emit('activityOpened')
  },
  { immediate: true },
)

watch(
  filteredActivities,
  (list) => {
    if (!list.length) {
      selectedActivity.value = null
      return
    }

    const stillVisible = list.some((a) => a.activityId === selectedActivity.value?.activityId)
    if (!stillVisible) {
      selectedActivity.value = list[0] ?? null
    }
  },
  { immediate: true },
)

function selectActivity(activity: GarminActivity) {
  selectedActivity.value = activity
}
</script>

<template>
  <div class="trainings-page">
    <header class="trainings-header">
      <div>
        <h2>{{ t('trainings.title') }}</h2>
        <p class="subtitle">
          {{ filteredActivities.length }} {{ t('common.of') }} {{ activities.length }} {{ t('common.units') }}
          <span v-if="selectedActivity"> · {{ selectedActivity.activityName }}</span>
        </p>
      </div>
      <input
        v-model="search"
        class="search-input"
        type="search"
        :placeholder="t('trainings.search')"
        :aria-label="t('trainings.searchAria')"
      />
    </header>

    <div class="filter-row">
      <button
        class="filter-chip"
        :class="{ active: typeFilter === 'all' }"
        @click="typeFilter = 'all'"
      >
        {{ t('common.all') }} ({{ activities.length }})
      </button>
      <button
        v-for="[type, count] in activityTypes"
        :key="type"
        class="filter-chip"
        :class="{ active: typeFilter === type }"
        @click="typeFilter = type"
      >
        {{ getTypeLabel(type) }} ({{ count }})
      </button>
    </div>

    <div v-if="filteredActivities.length" class="trainings-split">
      <ActivityList
        :activities="filteredActivities"
        :selected-id="selectedActivity?.activityId"
        embedded
        @select="selectActivity"
      />

      <div class="detail-pane">
        <ActivityDetailPanel
          v-if="selectedActivity"
          :activity="selectedActivity"
          inline
        />
        <div v-else class="detail-placeholder">
          <p>{{ t('empty.selectTraining') }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty-filter">
      <p>{{ t('empty.noFilterResults') }}</p>
      <button type="button" class="reset-btn" @click="typeFilter = 'all'; search = ''">
        {{ t('common.resetFilter') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.trainings-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 60vh;
}

.trainings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.trainings-header h2 {
  margin: 0;
  font-size: 1.35rem;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.search-input {
  min-width: min(280px, 100%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  padding: 0.65rem 0.85rem;
  font: inherit;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chip {
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
}

.filter-chip.active {
  border-color: var(--accent);
  background: rgba(0, 180, 216, 0.12);
  color: var(--accent);
}

.trainings-split {
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  gap: 1rem;
  align-items: start;
  min-height: 520px;
}

.detail-pane {
  min-height: 520px;
  height: calc(100vh - 280px);
  max-height: 900px;
  position: sticky;
  top: 1rem;
}

.detail-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px dashed var(--border);
  border-radius: 14px;
  color: var(--text-muted);
}

.empty-filter {
  text-align: center;
  padding: 3rem;
  color: var(--text-muted);
}

.reset-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-elevated);
  color: var(--text);
  cursor: pointer;
}

@media (max-width: 960px) {
  .trainings-split {
    grid-template-columns: minmax(0, 1fr);
  }

  .detail-pane {
    position: static;
    height: auto;
    max-height: none;
  }
}
</style>
