<script setup lang="ts">
import { computed } from 'vue'
import type { GarminActivity, UserProfileSettings } from '../types/garmin'
import { computeRecentWeekStats } from '../utils/activityStats'
import { buildTodayPlan, parseExtendedWellness, type PlanIntensity } from '../utils/wellness'
import { getTodaySchedule } from '../utils/weeklySchedule'
import { getActivityTypeIcon } from '../utils/icons'
import { getTypeLabel } from '../utils/formatters'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  activities: GarminActivity[]
  profile: UserProfileSettings
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
}>()

const { t } = useI18n()

const wellness = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
  }),
)

const plan = computed(() => {
  const week = computeRecentWeekStats(props.activities)
  return buildTodayPlan(wellness.value, week, props.profile, t)
})

const intensityLabel = computed((): Record<PlanIntensity, string> => ({
  rest: t('plan.intensity.rest'),
  easy: t('plan.intensity.easy'),
  moderate: t('plan.intensity.moderate'),
  hard: t('plan.intensity.hard'),
}))

const todaySchedule = computed(() =>
  getTodaySchedule(props.profile.weeklySchedule, props.activities),
)

const scheduleLabel = computed(() => {
  const entry = todaySchedule.value?.entry
  if (!entry) return ''
  if (entry.type === 'other') return entry.note || t('plan.sessionTypes.other')
  if (entry.type === 'rest') return t('plan.sessionTypes.rest')
  return getTypeLabel(entry.type)
})

const scheduleIcon = computed(() => {
  const type = todaySchedule.value?.entry.type
  if (!type || type === 'other' || type === 'rest') return null
  return getActivityTypeIcon(type)
})
</script>

<template>
  <section class="plan-card" :class="plan.intensity">
    <div class="plan-badge">{{ intensityLabel[plan.intensity] }}</div>
    <strong class="plan-title">{{ plan.title }}</strong>
    <p class="plan-desc">{{ plan.description }}</p>
    <div class="plan-focus">
      <span>{{ t('plan.focus') }}</span>
      <strong>{{ plan.focus }}</strong>
    </div>

    <div v-if="todaySchedule" class="schedule-block" :class="todaySchedule.status">
      <AppIcon v-if="scheduleIcon" :icon="scheduleIcon" size="sm" />
      <AppIcon v-else name="calendar" size="sm" />
      <span class="schedule-text">
        <span class="schedule-day">{{ t('plan.scheduledToday') }}</span>
        <strong>{{ scheduleLabel }}</strong>
      </span>
      <span
        v-if="todaySchedule.entry.type !== 'rest'"
        class="schedule-status"
        :class="todaySchedule.status"
      >
        {{ todaySchedule.status === 'done' ? t('plan.scheduleDone') : t('plan.scheduleOpen') }}
      </span>
    </div>

    <div v-if="wellness.readinessScore" class="plan-stats">
      <span>Readiness {{ wellness.readinessScore }}/100</span>
      <span v-if="wellness.acwrRatio">ACWR {{ wellness.acwrRatio.toFixed(2) }}</span>
      <span v-if="wellness.sleepScore">{{ t('recovery.sleep') }} {{ wellness.sleepScore }}</span>
    </div>
  </section>
</template>

<style scoped>
.plan-card {
  padding: 1.25rem;
  position: relative;
  background: var(--surface) !important;
}

.plan-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--accent);
}

.plan-card.rest::before {
  background: var(--text-muted);
}
.plan-card.easy::before {
  background: #64748b;
}
.plan-card.moderate::before {
  background: var(--accent);
}
.plan-card.hard::before {
  background: var(--accent-hover);
}

.plan-badge {
  display: inline-flex;
  align-self: flex-start;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.28rem 0.65rem;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  border: 1px solid var(--border);
  color: var(--accent-hover);
  margin-bottom: 0.65rem;
}

.plan-card h3 {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.plan-title {
  display: block;
  font-size: 1.2rem;
  margin: 0.35rem 0;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.plan-desc {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.plan-focus {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.75rem;
  margin-bottom: 0.75rem;
}

.plan-focus span {
  color: var(--text-muted);
}

.plan-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.72rem;
  color: var(--accent);
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.schedule-block {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
}

.schedule-block.done {
  border-color: var(--success);
}

.schedule-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
  min-width: 0;
}

.schedule-day {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.schedule-text strong {
  font-size: 0.85rem;
  color: var(--text);
}

.schedule-status {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
}

.schedule-status.planned {
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
}

.schedule-status.done {
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid transparent;
}
</style>
