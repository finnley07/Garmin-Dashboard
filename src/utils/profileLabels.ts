import type { AthleteType, TargetFieldKey, WeeklyTargets } from '../types/garmin'
import { t } from '../i18n'
import { ATHLETE_TYPE_ICONS } from './icons'

export const ATHLETE_TYPE_VALUES = [
  'bodybuilding',
  'runner',
  'cyclist',
  'swimmer',
  'hybrid',
  'triathlon',
  'general',
  'other',
] as const satisfies readonly AthleteType[]

export { ATHLETE_TYPE_ICONS }

export function getAthleteTypeOptions() {
  return ATHLETE_TYPE_VALUES.map((value) => ({
    value,
    icon: ATHLETE_TYPE_ICONS[value],
    label: t(`profile.athleteTypes.${value}.label`),
    description: t(`profile.athleteTypes.${value}.description`),
  }))
}

export const EXPERIENCE_VALUES = ['beginner', 'intermediate', 'advanced'] as const

export function getExperienceOptions() {
  return EXPERIENCE_VALUES.map((value) => ({
    value,
    label: t(`profile.experienceLevels.${value}`),
  }))
}

export const INTENSITY_VALUES = ['easy', 'balanced', 'hard'] as const

export function getIntensityOptions() {
  return INTENSITY_VALUES.map((value) => ({
    value,
    label: t(`profile.intensity.${value}`),
  }))
}

export const DEFAULT_WEEKLY_TARGETS: Record<AthleteType, WeeklyTargets> = {
  bodybuilding: {
    runningSessions: null,
    cyclingSessions: null,
    strengthSessions: 4,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: null,
    weeklyHours: 4,
  },
  runner: {
    runningSessions: 3,
    cyclingSessions: null,
    strengthSessions: 1,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: 25,
    weeklyHours: 3,
  },
  cyclist: {
    runningSessions: null,
    cyclingSessions: 3,
    strengthSessions: null,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: 80,
    weeklyHours: 4,
  },
  swimmer: {
    runningSessions: null,
    cyclingSessions: null,
    strengthSessions: null,
    swimmingSessions: 3,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: null,
    weeklyHours: 3,
  },
  hybrid: {
    runningSessions: 2,
    cyclingSessions: null,
    strengthSessions: 2,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: 15,
    weeklyHours: 4,
  },
  triathlon: {
    runningSessions: 2,
    cyclingSessions: 2,
    strengthSessions: null,
    swimmingSessions: 2,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: 50,
    weeklyHours: 6,
  },
  general: {
    runningSessions: 2,
    cyclingSessions: 1,
    strengthSessions: 1,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: 15,
    weeklyHours: 3,
  },
  other: {
    runningSessions: null,
    cyclingSessions: null,
    strengthSessions: null,
    swimmingSessions: null,
    otherSessions: null,
    otherDescription: '',
    weeklyKm: null,
    weeklyHours: null,
  },
}

export interface TargetFieldConfig {
  key: TargetFieldKey
  label: string
  min: number
  max: number
  step?: number
  optional?: boolean
}

const SESSION_FIELD_META: Record<TargetFieldKey, Omit<TargetFieldConfig, 'key' | 'label'>> = {
  runningSessions: { min: 0, max: 14 },
  cyclingSessions: { min: 0, max: 14 },
  strengthSessions: { min: 0, max: 14 },
  swimmingSessions: { min: 0, max: 14 },
  weeklyKm: { min: 0, max: 400, step: 1, optional: true },
  weeklyHours: { min: 0, max: 40, step: 0.5, optional: true },
}

export function getTargetFieldsForAthleteType(type: AthleteType): TargetFieldConfig[] {
  const field = (key: TargetFieldKey): TargetFieldConfig => ({
    key,
    label: t(`profile.targets.${key}`),
    ...SESSION_FIELD_META[key],
  })

  switch (type) {
    case 'bodybuilding':
      return [field('strengthSessions'), field('weeklyHours'), field('weeklyKm')]
    case 'runner':
      return [field('runningSessions'), field('strengthSessions'), field('weeklyKm'), field('weeklyHours')]
    case 'cyclist':
      return [field('cyclingSessions'), field('weeklyKm'), field('weeklyHours')]
    case 'swimmer':
      return [field('swimmingSessions'), field('weeklyHours')]
    case 'hybrid':
      return [
        field('runningSessions'),
        field('strengthSessions'),
        field('cyclingSessions'),
        field('weeklyKm'),
        field('weeklyHours'),
      ]
    case 'triathlon':
      return [
        field('runningSessions'),
        field('cyclingSessions'),
        field('swimmingSessions'),
        field('weeklyKm'),
        field('weeklyHours'),
      ]
    case 'general':
      return [
        field('runningSessions'),
        field('cyclingSessions'),
        field('strengthSessions'),
        field('weeklyKm'),
        field('weeklyHours'),
      ]
    case 'other':
      return [
        field('runningSessions'),
        field('cyclingSessions'),
        field('strengthSessions'),
        field('swimmingSessions'),
        field('weeklyKm'),
        field('weeklyHours'),
      ]
  }
}

export function applyDefaultsForAthleteType(type: AthleteType): WeeklyTargets {
  return { ...DEFAULT_WEEKLY_TARGETS[type] }
}

export function sumTargetSessions(targets: WeeklyTargets): number {
  return (
    (targets.runningSessions ?? 0) +
    (targets.cyclingSessions ?? 0) +
    (targets.strengthSessions ?? 0) +
    (targets.swimmingSessions ?? 0) +
    (targets.otherSessions ?? 0)
  )
}

export function getAthleteTypeLabel(
  athleteType: AthleteType,
  customAthleteType: string,
): string {
  if (athleteType === 'other' && customAthleteType.trim()) return customAthleteType.trim()
  return t(`profile.athleteTypes.${athleteType}.label`)
}
