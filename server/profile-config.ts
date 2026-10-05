import { getAppConfig } from './app-config.js'
import { ATHLETE_TYPE_LABELS_EN } from './lang.js'
import type { AthleteType, UserProfileSettings, WeeklyTargets } from './types.js'

export const ATHLETE_TYPE_LABELS: Record<AthleteType, string> = {
  bodybuilding: 'Bodybuilding / Kraft',
  runner: 'Läufer',
  cyclist: 'Radfahren',
  swimmer: 'Schwimmen',
  hybrid: 'Hybrid (Laufen + Kraft)',
  triathlon: 'Triathlon',
  general: 'Allgemeine Fitness',
  other: 'Sonstiges / Individuell',
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

export type TargetFieldKey =
  | 'runningSessions'
  | 'cyclingSessions'
  | 'strengthSessions'
  | 'swimmingSessions'
  | 'weeklyKm'
  | 'weeklyHours'

export interface TargetFieldConfig {
  key: TargetFieldKey
  label: string
  min: number
  max: number
  step?: number
  optional?: boolean
}

const SESSION_FIELDS: Record<TargetFieldKey, Omit<TargetFieldConfig, 'key'>> = {
  runningSessions: { label: 'Laufeinheiten / Woche', min: 0, max: 14 },
  cyclingSessions: { label: 'Rad-Einheiten / Woche', min: 0, max: 14 },
  strengthSessions: { label: 'Krafteinheiten / Woche', min: 0, max: 14 },
  swimmingSessions: { label: 'Schwimm-Einheiten / Woche', min: 0, max: 14 },
  weeklyKm: { label: 'Kilometer / Woche', min: 0, max: 400, step: 1, optional: true },
  weeklyHours: { label: 'Stunden / Woche', min: 0, max: 40, step: 0.5, optional: true },
}

export function getTargetFieldsForAthleteType(type: AthleteType): TargetFieldConfig[] {
  const field = (key: TargetFieldKey): TargetFieldConfig => ({
    key,
    ...SESSION_FIELDS[key],
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

export function getAthleteTypeLabel(profile: UserProfileSettings): string {
  if (profile.athleteType === 'other' && profile.customAthleteType.trim()) {
    return profile.customAthleteType.trim()
  }
  const labels = getAppConfig().language === 'de' ? ATHLETE_TYPE_LABELS : ATHLETE_TYPE_LABELS_EN
  return labels[profile.athleteType]
}

export function applyDefaultsForAthleteType(
  profile: UserProfileSettings,
  type: AthleteType,
): UserProfileSettings {
  return {
    ...profile,
    athleteType: type,
    weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS[type] },
  }
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
