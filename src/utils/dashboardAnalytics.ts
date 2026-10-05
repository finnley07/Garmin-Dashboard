import type { ExerciseSetSummary, GarminActivity } from '../types/garmin'
import { computeRecentWeekStats, computeWeeklyTrends, type WeekStats } from './activityStats'
import { formatShortDate } from './formatters'
import { filterDashboardActivities } from './activityFilters'

export interface HeatmapDay {
  date: string
  count: number
  load: number
}

export interface PeriodComparisonRow {
  key: string
  label: string
  current: number
  previous: number
  avg4w: number
  unit: string
}

export interface PacePoint {
  activityId: number
  label: string
  paceMinPerKm: number
  date: string
}

function weekRange(offsetWeeks: number): { start: number; end: number } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(now)
  start.setDate(start.getDate() - offsetWeeks * 7 - ((now.getDay() + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.getTime(), end: end.getTime() }
}

function statsInRange(activities: GarminActivity[], start: number, end: number): WeekStats {
  const filtered = filterDashboardActivities(activities).filter((a) => {
    const t = new Date(a.startTimeLocal).getTime()
    return t >= start && t < end
  })

  return {
    sessions: filtered.length,
    km: filtered.reduce((s, a) => s + (a.distance ?? 0), 0) / 1000,
    hours: filtered.reduce((s, a) => s + (a.duration ?? 0), 0) / 3600,
    load: filtered.reduce((s, a) => s + (a.activityTrainingLoad ?? 0), 0),
    calories: filtered.reduce((s, a) => s + (a.calories ?? 0), 0),
    byType: filtered.reduce<Record<string, number>>((map, a) => {
      const type = a.activityType?.typeKey ?? 'unknown'
      map[type] = (map[type] ?? 0) + 1
      return map
    }, {}),
  }
}

export function buildTrainingHeatmap(activities: GarminActivity[], days = 84): HeatmapDay[] {
  const map = new Map<string, HeatmapDay>()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    const key = date.toISOString().slice(0, 10)
    map.set(key, { date: key, count: 0, load: 0 })
  }

  for (const activity of filterDashboardActivities(activities)) {
    const key = activity.startTimeLocal.slice(0, 10)
    const row = map.get(key)
    if (!row) continue
    row.count += 1
    row.load += activity.activityTrainingLoad ?? 0
  }

  return [...map.values()]
}

export function buildPeriodComparison(activities: GarminActivity[]): PeriodComparisonRow[] {
  const currentRange = weekRange(0)
  const previousRange = weekRange(1)
  const current = statsInRange(activities, currentRange.start, currentRange.end)
  const previous = statsInRange(activities, previousRange.start, previousRange.end)

  const last4 = computeWeeklyTrends(activities, 4)
  const avg4 = {
    sessions: last4.reduce((s, w) => s + w.sessions, 0) / Math.max(last4.length, 1),
    km: last4.reduce((s, w) => s + w.km, 0) / Math.max(last4.length, 1),
    hours: last4.reduce((s, w) => s + w.hours, 0) / Math.max(last4.length, 1),
    load: last4.reduce((s, w) => s + w.load, 0) / Math.max(last4.length, 1),
  }

  return [
    {
      key: 'sessions',
      label: 'sessions',
      current: current.sessions,
      previous: previous.sessions,
      avg4w: Math.round(avg4.sessions * 10) / 10,
      unit: '×',
    },
    {
      key: 'km',
      label: 'km',
      current: Math.round(current.km * 10) / 10,
      previous: Math.round(previous.km * 10) / 10,
      avg4w: Math.round(avg4.km * 10) / 10,
      unit: 'km',
    },
    {
      key: 'hours',
      label: 'hours',
      current: Math.round(current.hours * 10) / 10,
      previous: Math.round(previous.hours * 10) / 10,
      avg4w: Math.round(avg4.hours * 10) / 10,
      unit: 'h',
    },
    {
      key: 'load',
      label: 'load',
      current: Math.round(current.load),
      previous: Math.round(previous.load),
      avg4w: Math.round(avg4.load),
      unit: '',
    },
  ]
}

export function buildPaceTrend(activities: GarminActivity[], limit = 12): PacePoint[] {
  return activities
    .filter((a) => {
      const type = a.activityType?.typeKey
      return (type === 'running' || type === 'walking') && (a.distance ?? 0) > 500
    })
    .slice(0, 50)
    .map((activity) => {
      const km = (activity.distance ?? 0) / 1000
      const paceSec =
        activity.averageSpeed && activity.averageSpeed > 0
          ? 1000 / activity.averageSpeed
          : km > 0
            ? activity.duration / km
            : 0
      return {
        activityId: activity.activityId,
        label: formatShortDate(new Date(activity.startTimeLocal)),
        paceMinPerKm: paceSec / 60,
        date: activity.startTimeLocal.slice(0, 10),
      }
    })
    .filter((point) => point.paceMinPerKm > 0 && point.paceMinPerKm < 30)
    .slice(0, limit)
    .reverse()
}

export function collectRecentStrengthExercises(
  activities: GarminActivity[],
  days = 7,
): ExerciseSetSummary[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const exercises: ExerciseSetSummary[] = []

  for (const activity of filterDashboardActivities(activities)) {
    if (new Date(activity.startTimeLocal).getTime() < cutoff) continue
    if (activity.activityType?.typeKey !== 'strength_training') continue
    if (activity.summarizedExerciseSets?.length) {
      exercises.push(...activity.summarizedExerciseSets)
    }
  }

  return exercises
}

export function recentCardioActivities(activities: GarminActivity[], limit = 8): GarminActivity[] {
  return filterDashboardActivities(activities)
    .filter((a) => {
      const type = a.activityType?.typeKey
      return type === 'running' || type === 'walking' || type === 'hiking'
    })
    .slice(0, limit)
}

export function hasStrengthData(activities: GarminActivity[]): boolean {
  return collectRecentStrengthExercises(activities).length > 0
}

export { computeRecentWeekStats }
