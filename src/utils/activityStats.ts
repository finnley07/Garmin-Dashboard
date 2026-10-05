import type { GarminActivity, DashboardStats, WeeklyTargets } from '../types/garmin'
import { formatShortDate } from './formatters'
import { t } from '../i18n'
import { filterDashboardActivities } from './activityFilters'

export interface WeekStats {
  sessions: number
  km: number
  hours: number
  load: number
  calories: number
  byType: Record<string, number>
}

export interface WeekBucket {
  label: string
  start: string
  sessions: number
  km: number
  hours: number
  load: number
}

/** Monday 00:00 local time of the week containing `reference` – matches the ISO week used everywhere else in the app. */
function startOfWeek(reference = new Date()): Date {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  return start
}

/**
 * Stats for the current calendar week (Monday to now), not a rolling 7-day
 * window. "This week" showing sessions from last week's Tuesday–Sunday on a
 * quiet Monday was confusing – weekly targets reset on Monday, so this should
 * match that expectation.
 */
export function computeRecentWeekStats(activities: GarminActivity[]): WeekStats {
  const cutoff = startOfWeek().getTime()
  const recent = filterDashboardActivities(activities).filter(
    (a) => new Date(a.startTimeLocal).getTime() >= cutoff,
  )

  return {
    sessions: recent.length,
    km: recent.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000,
    hours: recent.reduce((s, a) => s + (a.duration ?? 0), 0) / 3600,
    load: recent.reduce((s, a) => s + (a.activityTrainingLoad ?? 0), 0),
    calories: recent.reduce((s, a) => s + (a.calories ?? 0), 0),
    byType: recent.reduce<Record<string, number>>((map, a) => {
      const type = a.activityType?.typeKey ?? 'unknown'
      map[type] = (map[type] ?? 0) + 1
      return map
    }, {}),
  }
}

export function computeWeeklyTrends(activities: GarminActivity[], weeks = 8): WeekBucket[] {
  const dashboardActivities = filterDashboardActivities(activities)
  const buckets: WeekBucket[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now)
    start.setDate(start.getDate() - i * 7 - ((now.getDay() + 6) % 7))
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const inWeek = dashboardActivities.filter((a) => {
      const t = new Date(a.startTimeLocal).getTime()
      return t >= start.getTime() && t < end.getTime()
    })

    buckets.push({
      label: formatShortDate(start),
      start: start.toISOString().slice(0, 10),
      sessions: inWeek.length,
      km: inWeek.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000,
      hours: inWeek.reduce((s, a) => s + (a.duration ?? 0), 0) / 3600,
      load: inWeek.reduce((s, a) => s + (a.activityTrainingLoad ?? 0), 0),
    })
  }

  return buckets
}

export function computeTrainingStreak(activities: GarminActivity[]): number {
  const dashboardActivities = filterDashboardActivities(activities)
  if (!dashboardActivities.length) return 0

  const days = new Set(dashboardActivities.map((a) => a.startTimeLocal.slice(0, 10)))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const todayKey = cursor.toISOString().slice(0, 10)
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (true) {
    const key = cursor.toISOString().slice(0, 10)
    if (!days.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export interface ProgressItem {
  key: string
  label: string
  current: number
  target: number
  unit: string
}

export function buildWeeklyProgress(
  week: WeekStats,
  targets: WeeklyTargets,
): ProgressItem[] {
  const items: ProgressItem[] = []

  const addSession = (key: keyof WeeklyTargets, label: string, typeKey: string) => {
    const target = targets[key]
    if (typeof target === 'number' && target > 0) {
      items.push({
        key: String(key),
        label,
        current: week.byType[typeKey] ?? 0,
        target,
        unit: '×',
      })
    }
  }

  addSession('runningSessions', t('progress.running'), 'running')
  addSession('strengthSessions', t('progress.strength'), 'strength_training')
  addSession('swimmingSessions', t('progress.swimming'), 'swimming')

  if (targets.otherSessions && targets.otherSessions > 0) {
    const tracked =
      week.sessions -
      (week.byType.running ?? 0) -
      (week.byType.strength_training ?? 0) -
      (week.byType.swimming ?? 0)
    items.push({
      key: 'other',
      label: targets.otherDescription.trim() || t('common.other'),
      current: Math.max(0, tracked),
      target: targets.otherSessions,
      unit: '×',
    })
  }

  if (targets.weeklyKm && targets.weeklyKm > 0) {
    items.push({
      key: 'km',
      label: t('progress.kilometers'),
      current: Math.round(week.km * 10) / 10,
      target: targets.weeklyKm,
      unit: 'km',
    })
  }

  if (targets.weeklyHours && targets.weeklyHours > 0) {
    items.push({
      key: 'hours',
      label: t('progress.hours'),
      current: Math.round(week.hours * 10) / 10,
      target: targets.weeklyHours,
      unit: 'h',
    })
  }

  return items
}

export function aggregateHrZones(activities: GarminActivity[]) {
  const cutoff = Date.now() - 28 * 24 * 60 * 60 * 1000
  const recent = filterDashboardActivities(activities).filter(
    (a) => new Date(a.startTimeLocal).getTime() >= cutoff,
  )

  let z1 = 0
  let z2 = 0
  let z3 = 0
  let z4 = 0
  let z5 = 0
  for (const a of recent) {
    z1 += a.hrTimeInZone_1 ?? 0
    z2 += a.hrTimeInZone_2 ?? 0
    z3 += a.hrTimeInZone_3 ?? 0
    z4 += a.hrTimeInZone_4 ?? 0
    z5 += a.hrTimeInZone_5 ?? 0
  }

  const totals = [z1, z2, z3, z4, z5]

  const sum = totals.reduce((a, b) => a + b, 0)
  return { totals, sum, activities: recent.length }
}

export function computeDashboardStats(activities: GarminActivity[]): DashboardStats {
  const dashboardActivities = filterDashboardActivities(activities)
  const activityBreakdown: Record<string, number> = {}
  let totalDistance = 0
  let totalDuration = 0
  let totalCalories = 0
  let hrSum = 0
  let hrCount = 0

  for (const activity of dashboardActivities) {
    const type = activity.activityType?.typeKey ?? 'unknown'
    activityBreakdown[type] = (activityBreakdown[type] ?? 0) + 1
    totalDistance += activity.distance ?? 0
    totalDuration += activity.duration ?? 0
    totalCalories += activity.calories ?? 0

    if (activity.averageHR) {
      hrSum += activity.averageHR
      hrCount++
    }
  }

  return {
    totalActivities: dashboardActivities.length,
    totalDistanceKm: totalDistance / 1000,
    totalDurationHours: totalDuration / 3600,
    totalCalories,
    avgHeartRate: hrCount > 0 ? Math.round(hrSum / hrCount) : 0,
    activityBreakdown,
  }
}

export function computeWeeklyLoadTrend(activities: GarminActivity[], weeks = 8): WeekBucket[] {
  const buckets = computeWeeklyTrends(activities, weeks)
  return buckets.map((b) => ({
    ...b,
    load: b.load,
  }))
}
