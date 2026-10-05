import type { UserProfileSettings, WeekdayKey, WeeklySchedule } from '../types/garmin'
import { DEFAULT_WEEKLY_TARGETS } from './profileLabels'

export const WEEKDAY_KEYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function createDefaultWeeklySchedule(): WeeklySchedule {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }
}

export function createDefaultBodyMetrics(): UserProfileSettings['body'] {
  return {
    birthYear: null,
    sex: 'unspecified',
    heightCm: null,
    weightKg: null,
    restingHr: null,
    maxHr: null,
  }
}

export function createDefaultUserProfile(): UserProfileSettings {
  return {
    displayName: '',
    athleteType: 'general',
    customAthleteType: '',
    experienceLevel: 'intermediate',
    preferredIntensity: 'balanced',
    body: createDefaultBodyMetrics(),
    weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS.general },
    weeklySchedule: createDefaultWeeklySchedule(),
    customRemarks: '',
    injuryNotes: '',
    personalNotes: '',
    plannedRaces: [],
    updatedAt: new Date(0).toISOString(),
  }
}

export function normalizeUserProfile(
  profile: Partial<UserProfileSettings> | null | undefined,
): UserProfileSettings {
  const defaults = createDefaultUserProfile()
  if (!profile) return defaults

  return {
    ...defaults,
    ...profile,
    plannedRaces: Array.isArray(profile.plannedRaces) ? profile.plannedRaces : [],
    body: {
      ...defaults.body,
      ...(profile.body ?? {}),
    },
    weeklyTargets: {
      ...defaults.weeklyTargets,
      ...(profile.weeklyTargets ?? {}),
    },
    weeklySchedule: {
      ...defaults.weeklySchedule,
      ...(profile.weeklySchedule ?? {}),
    },
  }
}
