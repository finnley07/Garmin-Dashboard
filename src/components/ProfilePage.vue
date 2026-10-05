<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
  PlannedRace,
  PlannedSessionType,
  RaceDistanceKey,
  TargetFieldKey,
  UserProfileSettings,
  WeekdayKey,
  WeeklyTargets,
} from '../types/garmin'
import { saveUserProfile } from '../api/garmin'
import {
  applyDefaultsForAthleteType,
  getAthleteTypeOptions,
  getExperienceOptions,
  getAthleteTypeLabel,
  getTargetFieldsForAthleteType,
  getIntensityOptions,
  sumTargetSessions,
} from '../utils/profileLabels'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'
import { normalizeUserProfile, WEEKDAY_KEYS } from '../utils/defaultProfile'
import { getTypeLabel } from '../utils/formatters'

const { t, locale } = useI18n()

const props = defineProps<{
  profile: UserProfileSettings
  garminName?: string
}>()

const emit = defineEmits<{
  saved: [payload: {
    profile: UserProfileSettings
    recommendationsUpdated: boolean
    recommendations: import('../types/garmin').Recommendation[] | null
    analysisSource: 'claude' | 'local' | null
    claudePending?: boolean
  }]
}>()

const form = reactive<UserProfileSettings>(normalizeUserProfile(props.profile))
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const enabledOptional = reactive<Record<string, boolean>>({})

const targetFields = computed(() => {
  void locale.value
  return getTargetFieldsForAthleteType(form.athleteType)
})
const athleteTypeOptions = computed(() => {
  void locale.value
  return getAthleteTypeOptions()
})
const experienceOptions = computed(() => {
  void locale.value
  return getExperienceOptions()
})
const intensityOptions = computed(() => {
  void locale.value
  return getIntensityOptions()
})
const currentYear = new Date().getFullYear()

const sexOptions = computed(() => {
  void locale.value
  return [
    { value: 'unspecified' as const, label: t('profile.sexUnspecified') },
    { value: 'male' as const, label: t('profile.sexMale') },
    { value: 'female' as const, label: t('profile.sexFemale') },
  ]
})

/** Shows the Tanaka estimate as placeholder so an empty field is not a black box. */
const estimatedMaxHrPlaceholder = computed(() => {
  const birthYear = form.body.birthYear
  if (!birthYear) return t('profile.optionalPlaceholder')
  const age = currentYear - birthYear
  if (age < 10 || age > 100) return t('profile.optionalPlaceholder')
  return t('profile.maxHrEstimate', { value: Math.round(208 - 0.7 * age) })
})

const weekdayOptions = computed(() => {
  void locale.value
  return WEEKDAY_KEYS.map((key) => ({ key, label: t(`profile.weekdays.${key}`) }))
})

const sessionTypeOptions = computed(() => {
  void locale.value
  return [
    { value: '', label: '–' },
    { value: 'running', label: getTypeLabel('running') },
    { value: 'cycling', label: getTypeLabel('cycling') },
    { value: 'strength_training', label: getTypeLabel('strength_training') },
    { value: 'swimming', label: getTypeLabel('swimming') },
    { value: 'other', label: t('plan.sessionTypes.other') },
    { value: 'rest', label: t('plan.sessionTypes.rest') },
  ]
})

function scheduleTypeFor(day: WeekdayKey): string {
  return form.weeklySchedule[day]?.type ?? ''
}

function setScheduleType(day: WeekdayKey, value: string) {
  if (!value) {
    form.weeklySchedule[day] = null
    return
  }
  const previousNote = form.weeklySchedule[day]?.note ?? ''
  form.weeklySchedule[day] = {
    type: value as PlannedSessionType,
    note: value === 'other' ? previousNote : '',
  }
}

function setScheduleNote(day: WeekdayKey, note: string) {
  const entry = form.weeklySchedule[day]
  if (!entry) return
  form.weeklySchedule[day] = { ...entry, note }
}

const plannedSessions = computed(() => sumTargetSessions(form.weeklyTargets))
const typeLabel = computed(() => {
  void locale.value
  return getAthleteTypeLabel(form.athleteType, form.customAthleteType)
})

const raceDistanceOptions = computed((): Array<{ value: RaceDistanceKey; label: string }> => [
  { value: '5k', label: t('raceCalendar.distances.5k') },
  { value: '10k', label: t('raceCalendar.distances.10k') },
  { value: 'halfMarathon', label: t('raceCalendar.distances.halfMarathon') },
  { value: 'marathon', label: t('raceCalendar.distances.marathon') },
  { value: 'other', label: t('raceCalendar.distances.other') },
])

function addPlannedRace() {
  form.plannedRaces.push({
    id: crypto.randomUUID(),
    name: '',
    date: '',
    distance: '10k',
    targetTimeSeconds: null,
  })
}

function removePlannedRace(id: string) {
  form.plannedRaces = form.plannedRaces.filter((race) => race.id !== id)
}

function parseTargetTime(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return null
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return null
}

function targetTimeInput(race: PlannedRace): string {
  if (!race.targetTimeSeconds) return ''
  const total = race.targetTimeSeconds
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function updateTargetTime(race: PlannedRace, value: string) {
  race.targetTimeSeconds = parseTargetTime(value)
}

function syncOptionalToggles(targets?: WeeklyTargets) {
  if (!targets) return
  enabledOptional.weeklyKm = targets.weeklyKm !== null
  enabledOptional.weeklyHours = targets.weeklyHours !== null
}

watch(
  () => props.profile,
  (profile) => {
    Object.assign(form, normalizeUserProfile(profile))
    syncOptionalToggles(form.weeklyTargets)
  },
  { deep: true },
)

watch(
  () => form.athleteType,
  (type, previous) => {
    if (previous && type !== previous) {
      form.weeklyTargets = applyDefaultsForAthleteType(type)
      syncOptionalToggles(form.weeklyTargets)
    }
  },
)

function initForm() {
  syncOptionalToggles(form.weeklyTargets)
}

initForm()

function getFieldValue(key: TargetFieldKey): number | null {
  return form.weeklyTargets[key]
}

function setFieldValue(key: TargetFieldKey, raw: string) {
  if (key === 'weeklyKm' || key === 'weeklyHours') {
    if (!enabledOptional[key]) {
      form.weeklyTargets[key] = null
      return
    }
    const parsed = Number(raw)
    form.weeklyTargets[key] = Number.isFinite(parsed) && parsed > 0 ? parsed : null
    return
  }

  const parsed = Number(raw)
  form.weeklyTargets[key] = Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

function setOtherSessions(raw: string) {
  const parsed = Number(raw)
  form.weeklyTargets.otherSessions =
    Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null
}

async function submit() {
  saving.value = true
  error.value = null
  success.value = null

  try {
    if (!enabledOptional.weeklyKm) form.weeklyTargets.weeklyKm = null
    if (!enabledOptional.weeklyHours) form.weeklyTargets.weeklyHours = null

    const result = await saveUserProfile(form)
    Object.assign(form, result.profile)
    syncOptionalToggles(form.weeklyTargets)

    success.value = result.claudePending
      ? t('profile.savedClaudePending')
      : result.recommendationsUpdated
        ? t('profile.savedWithRecs')
        : t('profile.saved')

    emit('saved', result)
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('profile.saveError')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <header class="profile-header">
      <div>
        <h2>{{ t('profile.title') }}</h2>
        <p class="subtitle">
          {{ t('profile.subtitle') }}
          <span v-if="garminName"> · {{ t('profile.garmin') }}: {{ garminName }}</span>
        </p>
      </div>
      <div v-if="plannedSessions > 0" class="plan-badge">
        {{ t('profile.plannedSessions', { count: plannedSessions }) }}
      </div>
    </header>

    <form class="profile-form" @submit.prevent="submit">
      <section class="form-section">
        <h3>{{ t('profile.personal') }}</h3>
        <label class="field">
          <span>{{ t('profile.displayName') }}</span>
          <input v-model="form.displayName" type="text" :placeholder="t('profile.displayNamePlaceholder')" maxlength="80" />
        </label>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.bodySection') }}</h3>
        <p class="section-hint">{{ t('profile.bodyHint') }}</p>

        <div class="target-grid">
          <label class="field">
            <span>{{ t('profile.birthYear') }}</span>
            <input
              v-model.number="form.body.birthYear"
              type="number"
              min="1920"
              :max="currentYear - 10"
              :placeholder="t('profile.optionalPlaceholder')"
            />
          </label>

          <label class="field">
            <span>{{ t('profile.sex') }}</span>
            <select v-model="form.body.sex">
              <option v-for="option in sexOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>{{ t('profile.heightCm') }}</span>
            <input
              v-model.number="form.body.heightCm"
              type="number"
              min="100"
              max="250"
              :placeholder="t('profile.optionalPlaceholder')"
            />
          </label>

          <label class="field">
            <span>{{ t('profile.weightKg') }}</span>
            <input
              v-model.number="form.body.weightKg"
              type="number"
              min="25"
              max="350"
              step="0.5"
              :placeholder="t('profile.weightPlaceholder')"
            />
          </label>

          <label class="field">
            <span>{{ t('profile.maxHr') }}</span>
            <input
              v-model.number="form.body.maxHr"
              type="number"
              min="120"
              max="230"
              :placeholder="estimatedMaxHrPlaceholder"
            />
            <small class="field-hint">{{ t('profile.maxHrHint') }}</small>
          </label>

          <label class="field">
            <span>{{ t('profile.restingHr') }}</span>
            <input
              v-model.number="form.body.restingHr"
              type="number"
              min="30"
              max="110"
              :placeholder="t('profile.optionalPlaceholder')"
            />
          </label>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.athleteType') }}</h3>
        <p class="section-hint">{{ t('profile.athleteTypeHint') }}</p>
        <div class="type-grid">
          <label
            v-for="option in athleteTypeOptions"
            :key="option.value"
            class="type-card"
            :class="{ active: form.athleteType === option.value }"
          >
            <input v-model="form.athleteType" type="radio" :value="option.value" />
            <span class="type-icon"><AppIcon :icon="option.icon" size="lg" /></span>
            <span class="type-label">{{ option.label }}</span>
            <span class="type-desc">{{ option.description }}</span>
          </label>
        </div>

        <label v-if="form.athleteType === 'other'" class="field custom-type">
          <span>{{ t('profile.customType') }}</span>
          <input
            v-model="form.customAthleteType"
            type="text"
            :placeholder="t('profile.customTypePlaceholder')"
            maxlength="80"
          />
        </label>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.weeklyGoals', { type: typeLabel }) }}</h3>
        <p class="section-hint">{{ t('profile.weeklyGoalsHint') }}</p>

        <div class="target-grid">
          <template v-for="field in targetFields" :key="field.key">
            <label v-if="!field.optional" class="field">
              <span>{{ field.label }}</span>
              <input
                type="number"
                :min="field.min"
                :max="field.max"
                :step="field.step ?? 1"
                :value="getFieldValue(field.key) ?? ''"
                placeholder="–"
                @input="setFieldValue(field.key, ($event.target as HTMLInputElement).value)"
              />
            </label>

            <div v-else class="field optional-field">
              <label class="optional-toggle">
                <input v-model="enabledOptional[field.key]" type="checkbox" />
                <span>{{ field.label }}</span>
              </label>
              <input
                type="number"
                :min="field.min"
                :max="field.max"
                :step="field.step ?? 1"
                :disabled="!enabledOptional[field.key]"
                :value="getFieldValue(field.key) ?? ''"
                placeholder="–"
                @input="setFieldValue(field.key, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </template>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.weeklySchedule') }}</h3>
        <p class="section-hint">{{ t('profile.weeklyScheduleHint') }}</p>

        <div class="schedule-grid">
          <div v-for="day in weekdayOptions" :key="day.key" class="schedule-row">
            <span class="schedule-row-day">{{ day.label }}</span>
            <select
              class="schedule-row-type"
              :value="scheduleTypeFor(day.key)"
              @change="setScheduleType(day.key, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="option in sessionTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-if="scheduleTypeFor(day.key) === 'other'"
              class="schedule-row-note"
              type="text"
              :value="form.weeklySchedule[day.key]?.note ?? ''"
              :placeholder="t('profile.otherDescriptionPlaceholder')"
              maxlength="60"
              @input="setScheduleNote(day.key, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </section>

      <section class="form-section highlight-section">
        <h3>{{ t('profile.otherSection') }}</h3>
        <p class="section-hint">{{ t('profile.otherHint') }}</p>
        <div class="field-row">
          <label class="field">
            <span>{{ t('profile.otherSessions') }}</span>
            <input
              type="number"
              min="0"
              max="14"
              :value="form.weeklyTargets.otherSessions ?? ''"
              placeholder="–"
              @input="setOtherSessions(($event.target as HTMLInputElement).value)"
            />
          </label>
          <label class="field">
            <span>{{ t('profile.otherDescription') }}</span>
            <input
              v-model="form.weeklyTargets.otherDescription"
              type="text"
              :placeholder="t('profile.otherDescriptionPlaceholder')"
              maxlength="120"
            />
          </label>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.experience') }}</h3>
        <div class="field-row">
          <label class="field">
            <span>{{ t('profile.experienceLevel') }}</span>
            <select v-model="form.experienceLevel">
              <option v-for="option in experienceOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="field">
            <span>{{ t('profile.preferredIntensity') }}</span>
            <select v-model="form.preferredIntensity">
              <option v-for="option in intensityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.plannedRaces') }}</h3>
        <p class="section-hint">{{ t('profile.plannedRacesHint') }}</p>

        <div v-if="form.plannedRaces.length" class="race-list">
          <article v-for="race in form.plannedRaces" :key="race.id" class="race-row">
            <label class="field">
              <span>{{ t('raceCalendar.name') }}</span>
              <input v-model="race.name" type="text" maxlength="80" />
            </label>
            <label class="field">
              <span>{{ t('raceCalendar.date') }}</span>
              <input v-model="race.date" type="date" />
            </label>
            <label class="field">
              <span>{{ t('raceCalendar.distance') }}</span>
              <select v-model="race.distance">
                <option v-for="option in raceDistanceOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>{{ t('raceCalendar.targetTime') }}</span>
              <input
                :value="targetTimeInput(race)"
                type="text"
                placeholder="45:00"
                @input="updateTargetTime(race, ($event.target as HTMLInputElement).value)"
              />
            </label>
            <button type="button" class="remove-btn" @click="removePlannedRace(race.id)">
              {{ t('raceCalendar.remove') }}
            </button>
          </article>
        </div>

        <button type="button" class="add-btn" @click="addPlannedRace">
          {{ t('raceCalendar.add') }}
        </button>
      </section>

      <section class="form-section">
        <h3>{{ t('profile.remarks') }}</h3>
        <label class="field">
          <span>{{ t('profile.customRemarks') }}</span>
          <textarea
            v-model="form.customRemarks"
            rows="3"
            :placeholder="t('profile.customRemarksPlaceholder')"
            maxlength="800"
          />
        </label>
        <label class="field">
          <span>{{ t('profile.injuryNotes') }}</span>
          <textarea
            v-model="form.injuryNotes"
            rows="2"
            :placeholder="t('profile.injuryNotesPlaceholder')"
            maxlength="500"
          />
        </label>
        <label class="field">
          <span>{{ t('profile.personalNotes') }}</span>
          <textarea
            v-model="form.personalNotes"
            rows="2"
            :placeholder="t('profile.personalNotesPlaceholder')"
            maxlength="500"
          />
        </label>
      </section>

      <div v-if="error" class="banner error">{{ error }}</div>
      <div v-if="success" class="banner success">{{ success }}</div>

      <div class="actions">
        <button type="submit" class="save-btn" :disabled="saving">
          {{ saving ? t('profile.saving') : t('profile.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-header h2 {
  margin: 0;
  font-size: 1.35rem;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.plan-badge {
  font-size: 0.8rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(0, 180, 216, 0.12);
  border: 1px solid rgba(0, 180, 216, 0.25);
  color: var(--accent);
  white-space: nowrap;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
}

.section-hint {
  margin: 0 0 1rem;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.race-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-bottom: 0.85rem;
}

.race-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr auto;
  gap: 0.65rem;
  align-items: end;
  padding: 0.85rem;
  border-radius: 10px;
  background: var(--surface-elevated);
}

.add-btn,
.remove-btn {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
}

.add-btn:hover,
.remove-btn:hover {
  color: var(--accent);
  border-color: rgba(34, 211, 238, 0.35);
}

@media (max-width: 900px) {
  .race-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .schedule-row {
    grid-template-columns: 2.4rem 1fr;
    grid-template-areas: 'day type' 'note note';
  }

  .schedule-row-day {
    grid-area: day;
  }

  .schedule-row-type {
    grid-area: type;
  }

  .schedule-row-note {
    grid-area: note;
  }
}

.highlight-section {
  border-color: rgba(0, 180, 216, 0.25);
}

.form-section h3 {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
}

.section-hint {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.field span {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.field input,
.field select,
.field textarea {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 0.65rem 0.75rem;
  font: inherit;
}

.field textarea {
  resize: vertical;
  min-height: 72px;
}

.field-row,
.target-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 1rem;
}

.schedule-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.schedule-row {
  display: grid;
  grid-template-columns: 3rem minmax(140px, 200px) 1fr;
  align-items: center;
  gap: 0.75rem;
}

.schedule-row-day {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.schedule-row-type,
.schedule-row-note {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 0.55rem 0.7rem;
  font-size: 0.85rem;
  width: 100%;
}

.custom-type {
  margin-top: 1rem;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 0.75rem;
}

.type-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.type-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.type-card.active {
  border-color: var(--accent);
  background: rgba(0, 180, 216, 0.08);
}

.type-icon {
  display: flex;
  align-items: center;
  color: var(--accent);
}

.type-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.type-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.optional-field {
  gap: 0.5rem;
}

.optional-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  cursor: pointer;
}

.optional-toggle input {
  width: auto;
}

.banner {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
}

.banner.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.banner.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: var(--accent-gradient);
  color: #05070d;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(34, 211, 238, 0.25);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(34, 211, 238, 0.35);
}

.save-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>
