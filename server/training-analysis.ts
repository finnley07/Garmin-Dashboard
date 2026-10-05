import { filterDashboardActivities } from './activity-filters.js'
import type { GarminActivity } from './types.js'

export interface DailyLoadPoint {
  date: string
  load: number
  sessions: number
  minutes: number
}

export interface IntensityDistribution {
  easyMinutes: number
  moderateMinutes: number
  hardMinutes: number
  easySharePct: number
  moderateSharePct: number
  hardSharePct: number
  /**
   * Polarised/pyramidal training keeps roughly 75-85 % of the time easy.
   * Below that the athlete lives in the grey zone, far above it there is no stimulus.
   */
  verdict: 'too-hard' | 'balanced' | 'too-easy'
}

export interface TypeVolume {
  sessions: number
  km: number
  hours: number
  load: number
}

export interface TrainingAnalysis {
  /** Where the per-session load came from – Garmin, an HR estimate, or plain duration. */
  loadSource: 'garmin' | 'estimated' | 'duration' | 'none'
  dailyLoad: DailyLoadPoint[]
  acuteLoad7d: number
  chronicLoadWeekly: number
  /** Acute:chronic workload ratio computed from the stored activities. */
  acwr: number | null
  /** Foster monotony: mean daily load / standard deviation over the last 7 days. */
  monotony: number | null
  /** Foster strain: weekly load x monotony. High strain correlates with illness/injury. */
  strain: number | null
  weeklyLoads: number[]
  loadTrendPct: number | null
  intensity: IntensityDistribution | null
  aerobicTeAvg: number | null
  anaerobicTeAvg: number | null
  sessions7d: number
  sessions28d: number
  restDays7d: number
  longestGapDays: number
  daysSinceLastSession: number | null
  byType7d: Record<string, TypeVolume>
  longestSessionMinutes7d: number
  /** Share of the 28-day volume that is strength work – used for hybrid/bodybuilding checks. */
  strengthShare28dPct: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Upper bound for the monotony ratio; anything above ~2.5 is already "too even". */
const MONOTONY_CAP = 5

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function dayKey(activity: GarminActivity): string {
  return activity.startTimeLocal.slice(0, 10)
}

function activityTime(activity: GarminActivity): number {
  return new Date(activity.startTimeLocal.replace(' ', 'T')).getTime()
}

/**
 * Per-session load. Garmin's own value is preferred; otherwise a TRIMP-style
 * estimate from duration and heart rate, and duration alone as last resort.
 */
function sessionLoad(
  activity: GarminActivity,
  maxHr: number | null,
): { load: number; source: 'garmin' | 'estimated' | 'duration' } {
  const garmin = activity.activityTrainingLoad
  if (typeof garmin === 'number' && garmin > 0) {
    return { load: garmin, source: 'garmin' }
  }

  const minutes = (activity.duration ?? 0) / 60
  if (minutes <= 0) return { load: 0, source: 'duration' }

  if (activity.averageHR && maxHr && maxHr > 0) {
    const intensity = Math.min(1.2, activity.averageHR / maxHr)
    return { load: Math.round(minutes * intensity * intensity * 10), source: 'estimated' }
  }

  return { load: Math.round(minutes), source: 'duration' }
}

function buildDailySeries(
  activities: GarminActivity[],
  days: number,
  endDate: Date,
  maxHr: number | null,
): { series: DailyLoadPoint[]; loadSource: TrainingAnalysis['loadSource'] } {
  const byDate = new Map<string, DailyLoadPoint>()
  for (let index = days - 1; index >= 0; index--) {
    const date = isoDay(new Date(endDate.getTime() - index * DAY_MS))
    byDate.set(date, { date, load: 0, sessions: 0, minutes: 0 })
  }

  const sources = new Set<'garmin' | 'estimated' | 'duration'>()

  for (const activity of activities) {
    const bucket = byDate.get(dayKey(activity))
    if (!bucket) continue

    const { load, source } = sessionLoad(activity, maxHr)
    bucket.load += load
    bucket.sessions += 1
    bucket.minutes += (activity.duration ?? 0) / 60
    if (load > 0) sources.add(source)
  }

  const loadSource: TrainingAnalysis['loadSource'] = sources.has('garmin')
    ? 'garmin'
    : sources.has('estimated')
      ? 'estimated'
      : sources.has('duration')
        ? 'duration'
        : 'none'

  return { series: [...byDate.values()], loadSource }
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
  return Math.sqrt(variance)
}

function computeIntensity(activities: GarminActivity[]): IntensityDistribution | null {
  let easy = 0
  let moderate = 0
  let hard = 0

  for (const activity of activities) {
    easy += (activity.hrTimeInZone_1 ?? 0) + (activity.hrTimeInZone_2 ?? 0)
    moderate += activity.hrTimeInZone_3 ?? 0
    hard += (activity.hrTimeInZone_4 ?? 0) + (activity.hrTimeInZone_5 ?? 0)
  }

  const total = easy + moderate + hard
  if (total <= 0) return null

  // Garmin reports zone times in seconds.
  const easyMinutes = Math.round(easy / 60)
  const moderateMinutes = Math.round(moderate / 60)
  const hardMinutes = Math.round(hard / 60)
  const easySharePct = Math.round((easy / total) * 100)
  const hardSharePct = Math.round((hard / total) * 100)

  const verdict: IntensityDistribution['verdict'] =
    easySharePct < 65 ? 'too-hard' : easySharePct > 92 ? 'too-easy' : 'balanced'

  return {
    easyMinutes,
    moderateMinutes,
    hardMinutes,
    easySharePct,
    moderateSharePct: Math.max(0, 100 - easySharePct - hardSharePct),
    hardSharePct,
    verdict,
  }
}

function averageOf(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
}

function buildTypeVolumes(activities: GarminActivity[]): Record<string, TypeVolume> {
  const byType: Record<string, TypeVolume> = {}

  for (const activity of activities) {
    const type = activity.activityType?.typeKey ?? 'unknown'
    const entry = (byType[type] ??= { sessions: 0, km: 0, hours: 0, load: 0 })
    entry.sessions += 1
    entry.km += (activity.distance ?? 0) / 1000
    entry.hours += (activity.duration ?? 0) / 3600
    entry.load += activity.activityTrainingLoad ?? 0
  }

  for (const entry of Object.values(byType)) {
    entry.km = Math.round(entry.km * 10) / 10
    entry.hours = Math.round(entry.hours * 10) / 10
    entry.load = Math.round(entry.load)
  }

  return byType
}

/** Longest stretch of consecutive days without a session inside the window. */
function longestGap(series: DailyLoadPoint[]): number {
  let longest = 0
  let current = 0
  for (const day of series) {
    if (day.sessions === 0) {
      current += 1
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }
  return longest
}

export function analyzeTraining(
  allActivities: GarminActivity[],
  maxHr: number | null = null,
  now: Date = new Date(),
): TrainingAnalysis {
  const activities = filterDashboardActivities(allActivities)
  const { series, loadSource } = buildDailySeries(activities, 28, now, maxHr)

  const last7 = series.slice(-7)
  const acuteLoad7d = Math.round(last7.reduce((sum, day) => sum + day.load, 0))
  const total28 = series.reduce((sum, day) => sum + day.load, 0)
  const chronicLoadWeekly = Math.round(total28 / 4)
  const acwr = chronicLoadWeekly > 0 ? Math.round((acuteLoad7d / chronicLoadWeekly) * 100) / 100 : null

  const dailyLoads7 = last7.map((day) => day.load)
  const meanDaily = dailyLoads7.reduce((sum, value) => sum + value, 0) / 7
  const sd = standardDeviation(dailyLoads7)
  // Identical load every day means zero deviation, i.e. maximum monotony – not
  // "unknown". The ratio is capped because it would otherwise diverge.
  const monotony =
    meanDaily <= 0
      ? null
      : sd === 0
        ? MONOTONY_CAP
        : Math.min(MONOTONY_CAP, Math.round((meanDaily / sd) * 100) / 100)
  const strain = monotony !== null ? Math.round(acuteLoad7d * monotony) : null

  const weeklyLoads = [0, 1, 2, 3].map((weekIndex) => {
    const slice = series.slice(21 - weekIndex * 7, 28 - weekIndex * 7)
    return Math.round(slice.reduce((sum, day) => sum + day.load, 0))
  })
  const previousWeeksAvg =
    weeklyLoads.slice(1).filter((load) => load > 0).length > 0
      ? weeklyLoads.slice(1).reduce((sum, load) => sum + load, 0) /
        weeklyLoads.slice(1).length
      : 0
  const loadTrendPct =
    previousWeeksAvg > 0
      ? Math.round(((weeklyLoads[0]! - previousWeeksAvg) / previousWeeksAvg) * 100)
      : null

  const windowStart7 = now.getTime() - 7 * DAY_MS
  const windowStart28 = now.getTime() - 28 * DAY_MS
  const recent7 = activities.filter((activity) => activityTime(activity) >= windowStart7)
  const recent28 = activities.filter((activity) => activityTime(activity) >= windowStart28)

  const lastSession = activities
    .map(activityTime)
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0]

  const strengthLoad = recent28
    .filter((activity) => activity.activityType?.typeKey === 'strength_training')
    .reduce((sum, activity) => sum + (activity.duration ?? 0), 0)
  const totalLoad28 = recent28.reduce((sum, activity) => sum + (activity.duration ?? 0), 0)

  return {
    loadSource,
    dailyLoad: series,
    acuteLoad7d,
    chronicLoadWeekly,
    acwr,
    monotony,
    strain,
    weeklyLoads,
    loadTrendPct,
    intensity: computeIntensity(recent28),
    aerobicTeAvg: averageOf(
      recent28
        .map((activity) => activity.aerobicTrainingEffect)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
    anaerobicTeAvg: averageOf(
      recent28
        .map((activity) => activity.anaerobicTrainingEffect)
        .filter((value): value is number => typeof value === 'number' && value > 0),
    ),
    sessions7d: recent7.length,
    sessions28d: recent28.length,
    restDays7d: last7.filter((day) => day.sessions === 0).length,
    longestGapDays: longestGap(series),
    daysSinceLastSession:
      lastSession === undefined ? null : Math.floor((now.getTime() - lastSession) / DAY_MS),
    byType7d: buildTypeVolumes(recent7),
    longestSessionMinutes7d: Math.round(
      Math.max(0, ...recent7.map((activity) => (activity.duration ?? 0) / 60)),
    ),
    strengthShare28dPct: totalLoad28 > 0 ? Math.round((strengthLoad / totalLoad28) * 100) : null,
  }
}

/** Compact training-load line for the Claude prompt. */
export function compactTrainingLine(analysis: TrainingAnalysis): string {
  const parts: string[] = [
    `Last7=${analysis.acuteLoad7d}`,
    `Chronic/W=${analysis.chronicLoadWeekly}`,
  ]

  if (analysis.acwr !== null) parts.push(`ACWR(local)=${analysis.acwr.toFixed(2)}`)
  if (analysis.monotony !== null) parts.push(`Monotony=${analysis.monotony.toFixed(2)}`)
  if (analysis.strain !== null) parts.push(`Strain=${analysis.strain}`)
  if (analysis.loadTrendPct !== null) {
    parts.push(`Trend=${analysis.loadTrendPct > 0 ? '+' : ''}${analysis.loadTrendPct}%`)
  }
  if (analysis.intensity) {
    parts.push(
      `Intensity easy/mod/hard=${analysis.intensity.easySharePct}/${analysis.intensity.moderateSharePct}/${analysis.intensity.hardSharePct}%`,
    )
  }
  parts.push(`RestDays7=${analysis.restDays7d}`)
  if (analysis.longestGapDays > 0) parts.push(`LongestGap=${analysis.longestGapDays}d`)
  if (analysis.loadSource !== 'garmin') parts.push(`Load=${analysis.loadSource}`)

  return `Load: ${parts.join(' ')}`
}
