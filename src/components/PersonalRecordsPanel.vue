<script setup lang="ts">
import { computed } from 'vue'
import { parsePersonalRecords } from '../utils/wellness'
import { getTypeLabel } from '../utils/formatters'
import { isDashboardActivity } from '../utils/activityFilters'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  personalRecords: unknown
}>()

const emit = defineEmits<{ selectActivity: [activityId: number] }>()

const { t } = useI18n()

const records = computed(() =>
  parsePersonalRecords(props.personalRecords, t)
    .filter((pr) => isDashboardActivity({ activityType: { typeKey: pr.activityType } }))
    .slice(0, 8),
)
</script>

<template>
  <section v-if="records.length" class="pr-card">
    <div class="pr-header">
      <AppIcon name="trophy" size="sm" />
      <SectionTitle :title="t('records.title')" info-key="personalRecords" tag="h3" />
    </div>
    <ul class="pr-list">
      <li v-for="pr in records" :key="pr.id">
        <button type="button" class="pr-row" @click="emit('selectActivity', pr.activityId)">
          <div class="pr-main">
            <span class="pr-type">{{ pr.typeLabel }}</span>
            <strong>{{ pr.valueLabel }}</strong>
            <span class="pr-activity">{{ pr.activityName }}</span>
          </div>
          <div class="pr-meta">
            <span>{{ getTypeLabel(pr.activityType) }}</span>
            <span>{{ pr.date }}</span>
          </div>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.pr-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.pr-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--accent);
}

.pr-header :deep(.section-title) {
  margin-bottom: 0;
}

.pr-card h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--accent);
}

.pr-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pr-row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-elevated);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;
}

.pr-row:hover {
  border-color: var(--accent);
}

.pr-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.pr-type {
  font-size: 0.7rem;
  color: var(--accent);
}

.pr-main strong {
  font-size: 1rem;
}

.pr-activity {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.pr-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
