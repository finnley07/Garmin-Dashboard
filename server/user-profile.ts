import { randomUUID } from 'node:crypto'
import fs from 'fs/promises'
import path from 'path'
import {
  ATHLETE_TYPE_LABELS,
  DEFAULT_WEEKLY_TARGETS,
  getAthleteTypeLabel,
  sumTargetSessions,
} from './profile-config.js'
import { DEFAULT_BODY_METRICS } from './body-metrics.js'
import type {
  AthleteType,
  BiologicalSex,
  BodyMetrics,
  PlannedSessionType,
  UserProfileSettings,
  WeekdayKey,
  WeeklyTargets,
  WeeklySchedule,
  WeeklyScheduleEntry,
} from './types.js'

const PROFILE_FILE = path.join(process.cwd(), 'data', 'user-profile.json')

export { ATHLETE_TYPE_LABELS, getAthleteTypeLabel }

export const WEEKDAY_KEYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
}

export const DEFAULT_USER_PROFILE: UserProfileSettings = {
  displayName: '',
  athleteType: 'general',
  customAthleteType: '',
  experienceLevel: 'intermediate',
  preferredIntensity: 'balanced',
  body: { ...DEFAULT_BODY_METRICS },
  weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS.general },
  weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
  customRemarks: '',
  injuryNotes: '',
  personalNotes: '',
  plannedRaces: [],
  updatedAt: new Date(0).toISOString(),
}

interface LegacyProfile {
  trainingGoal?: string
  targetWeeklySessions?: number
  targetWeeklyKm?: number | null
  targetWeeklyHours?: number | null
  focusAreas?: string[]
}

export async function loadUserProfile(): Promise<UserProfileSettings> {
  try {
    const raw = await fs.readFile(PROFILE_FILE, 'utf-8')
    return normalizeUserProfile(JSON.parse(raw) as Partial<UserProfileSettings> & LegacyProfile)
  } catch {
    return {
      ...DEFAULT_USER_PROFILE,
      body: { ...DEFAULT_BODY_METRICS },
      weeklyTargets: { ...DEFAULT_WEEKLY_TARGETS.general },
      weeklySchedule: { ...DEFAULT_WEEKLY_SCHEDULE },
    }
  }
}

export async function saveUserProfile(profile: UserProfileSettings): Promise<UserProfileSettings> {
  const normalized = normalizeUserProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  })

  await fs.mkdir(path.dirname(PROFILE_FILE), { recursive: true })
  await fs.writeFile(PROFILE_FILE, JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

function migrateLegacyProfile(input: Partial<UserProfileSettings> & LegacyProfile): Partial<UserProfileSettings> {
  if (input.athleteType && input.weeklyTargets) return input

  const focus = input.focusAreas ?? []
  let athleteType: AthleteType = 'general'

  if (input.trainingGoal === 'strength') athleteType = 'bodybuilding'
  else if (focus.includes('running') && focus.includes('strength_training')) athleteType = 'hybrid'
  else if (focus.includes('running')) athleteType = 'runner'
  else if (focus.includes('cycling')) athleteType = 'cyclist'
  else if (focus.includes('swimming')) athleteType = 'swimmer'
  else if (focus.includes('other')) athleteType = 'other'

  const sessions = input.targetWeeklySessions ?? 3
  const base = { ...DEFAULT_WEEKLY_TARGETS[athleteType] }

  const weeklyTargets: WeeklyTargets = {
    ...base,
    weeklyKm: input.targetWeeklyKm ?? base.weeklyKm,
    weeklyHours: input.targetWeeklyHours ?? base.weeklyHours,
  }

  if (athleteType === 'runner') weeklyTargets.runningSessions = sessions
  if (athleteType === 'bodybuilding') weeklyTargets.strengthSessions = sessions
  if (athleteType === 'cyclist') weeklyTargets.cyclingSessions = sessions
  if (athleteType === 'swimmer') weeklyTargets.swimmingSessions = sessions
  if (athleteType === 'hybrid') {
    weeklyTargets.runningSessions = Math.max(1, Math.ceil(sessions / 2))
    weeklyTargets.strengthSessions = Math.max(1, Math.floor(sessions / 2))
  }

  return {
    displayName: input.displayName,
    athleteType,
    customAthleteType: '',
    experienceLevel: input.experienceLevel,
    preferredIntensity: input.preferredIntensity,
    weeklyTargets,
    customRemarks: '',
    injuryNotes: input.injuryNotes,
    personalNotes: input.personalNotes,
    plannedRaces: [],
    updatedAt: input.updatedAt,
  }
}

export function normalizeUserProfile(
  input: Partial<UserProfileSettings> & LegacyProfile,
): UserProfileSettings {
  const migrated = migrateLegacyProfile(input)
  const validTypes = new Set(Object.keys(ATHLETE_TYPE_LABELS))
  const validLevels = new Set(['beginner', 'intermediate', 'advanced'])
  const validIntensity = new Set(['easy', 'balanced', 'hard'])

  const athleteType = validTypes.has(migrated.athleteType ?? '')
    ? (migrated.athleteType as AthleteType)
    : DEFAULT_USER_PROFILE.athleteType

  const experienceLevel = validLevels.has(migrated.experienceLevel ?? '')
    ? (migrated.experienceLevel as UserProfileSettings['experienceLevel'])
    : DEFAULT_USER_PROFILE.experienceLevel

  const preferredIntensity = validIntensity.has(migrated.preferredIntensity ?? '')
    ? (migrated.preferredIntensity as UserProfileSettings['preferredIntensity'])
    : DEFAULT_USER_PROFILE.preferredIntensity

  const weeklyTargets = normalizeWeeklyTargets(
    migrated.weeklyTargets ?? DEFAULT_WEEKLY_TARGETS[athleteType],
  )
  const weeklySchedule = normalizeWeeklySchedule(migrated.weeklySchedule)

  return {
    displayName: String(migrated.displayName ?? '').trim().slice(0, 80),
    athleteType,
    customAthleteType: String(migrated.customAthleteType ?? '').trim().slice(0, 80),
    experienceLevel,
    preferredIntensity,
    body: normalizeBodyMetrics(migrated.body),
    weeklyTargets,
    weeklySchedule,
    customRemarks: String(migrated.customRemarks ?? '').trim().slice(0, 800),
    injuryNotes: String(migrated.injuryNotes ?? '').trim().slice(0, 500),
    personalNotes: String(migrated.personalNotes ?? '').trim().slice(0, 500),
    plannedRaces: normalizePlannedRaces(migrated.plannedRaces),
    updatedAt: migrated.updatedAt ?? new Date().toISOString(),
  }
}

function normalizePlannedRaces(input: unknown) {
  if (!Array.isArray(input)) return [] as UserProfileSettings['plannedRaces']

  const validDistances = new Set(['5k', '10k', 'halfMarathon', 'marathon', 'other'])

  return input
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const row = entry as Record<string, unknown>
      const distance = String(row.distance ?? 'other')
      const target = row.targetTimeSeconds
      return {
        id: String(row.id ?? randomUUID()),
        name: String(row.name ?? '').trim().slice(0, 80),
        date: String(row.date ?? '').slice(0, 10),
        distance: validDistances.has(distance)
          ? (distance as UserProfileSettings['plannedRaces'][number]['distance'])
          : 'other',
        targetTimeSeconds:
          target === null || target === undefined || target === ''
            ? null
            : Math.max(0, Math.round(Number(target))),
      }
    })
    .filter((race) => race.name && race.date)
    .slice(0, 12)
}

function nullableInRange(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function normalizeBodyMetrics(input: Partial<BodyMetrics> | undefined): BodyMetrics {
  if (!input) return { ...DEFAULT_BODY_METRICS }

  const sex = String(input.sex ?? '').toLowerCase()
  const currentYear = new Date().getUTCFullYear()

  return {
    birthYear: nullableInRange(input.birthYear, currentYear - 100, currentYear - 10),
    sex: (sex === 'male' || sex === 'female' ? sex : 'unspecified') as BiologicalSex,
    heightCm: nullableInRange(input.heightCm, 100, 250),
    weightKg: nullableInRange(input.weightKg, 25, 350),
    restingHr: nullableInRange(input.restingHr, 30, 110),
    maxHr: nullableInRange(input.maxHr, 120, 230),
  }
}

const VALID_SESSION_TYPES = new Set<string>([
  'running',
  'cycling',
  'strength_training',
  'swimming',
  'other',
  'rest',
])

function normalizeScheduleEntry(input: unknown): WeeklyScheduleEntry | null {
  if (!input || typeof input !== 'object') return null
  const row = input as Partial<WeeklyScheduleEntry>
  const type = String(row.type ?? '')
  if (!VALID_SESSION_TYPES.has(type)) return null

  return {
    type: type as PlannedSessionType,
    note: String(row.note ?? '').trim().slice(0, 60),
  }
}

function normalizeWeeklySchedule(input: Partial<WeeklySchedule> | undefined): WeeklySchedule {
  if (!input) return { ...DEFAULT_WEEKLY_SCHEDULE }

  const schedule = { ...DEFAULT_WEEKLY_SCHEDULE }
  for (const day of WEEKDAY_KEYS) {
    schedule[day] = normalizeScheduleEntry(input[day])
  }
  return schedule
}

function normalizeWeeklyTargets(input: Partial<WeeklyTargets>): WeeklyTargets {
  return {
    runningSessions: nullableSessions(input.runningSessions),
    cyclingSessions: nullableSessions(input.cyclingSessions),
    strengthSessions: nullableSessions(input.strengthSessions),
    swimmingSessions: nullableSessions(input.swimmingSessions),
    otherSessions: nullableSessions(input.otherSessions),
    otherDescription: String(input.otherDescription ?? '').trim().slice(0, 120),
    weeklyKm: input.weeklyKm === null || input.weeklyKm === undefined
      ? null
      : clampNumber(input.weeklyKm, 0, 400, 0),
    weeklyHours:
      input.weeklyHours === null || input.weeklyHours === undefined
        ? null
        : clampNumber(input.weeklyHours, 0, 40, 0, 1),
  }
}

function nullableSessions(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.min(14, Math.max(0, Math.round(parsed)))
}

function clampNumber(value: unknown, min: number, max: number, fallback: number, decimals = 0): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const clamped = Math.min(max, Math.max(min, parsed))
  return decimals === 0 ? Math.round(clamped) : Math.round(clamped * 10) / 10
}

export function compactProfileLine(profile: UserProfileSettings): string {
  const parts = [
    `Type=${getAthleteTypeLabel(profile)}`,
    `Level=${profile.experienceLevel}`,
  ]

  const targets = profile.weeklyTargets
  if (targets.runningSessions) parts.push(`Run=${targets.runningSessions}/wk`)
  if (targets.cyclingSessions) parts.push(`Cycle=${targets.cyclingSessions}/wk`)
  if (targets.strengthSessions) parts.push(`Strength=${targets.strengthSessions}/wk`)
  if (targets.swimmingSessions) parts.push(`Swim=${targets.swimmingSessions}/wk`)
  if (targets.otherSessions) {
    const desc = targets.otherDescription ? `(${targets.otherDescription.slice(0, 20)})` : ''
    parts.push(`Other=${targets.otherSessions}/wk${desc}`)
  }
  if (targets.weeklyKm) parts.push(`${targets.weeklyKm}km/wk`)
  if (targets.weeklyHours) parts.push(`${targets.weeklyHours}h/wk`)
  if (profile.preferredIntensity !== 'balanced') parts.push(`Intensity=${profile.preferredIntensity}`)
  if (profile.customRemarks) parts.push(`Note=${profile.customRemarks.slice(0, 50)}`)
  if (profile.injuryNotes) parts.push(`Limit=${profile.injuryNotes.slice(0, 40)}`)
  if (profile.personalNotes) parts.push(`Note=${profile.personalNotes.slice(0, 40)}`)

  parts.push(`Plan=${sumTargetSessions(targets)}S/W`)
  return parts.join(' ')
}
