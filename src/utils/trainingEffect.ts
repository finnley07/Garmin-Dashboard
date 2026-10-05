import type { GarminActivity } from '../types/garmin'
import { filterDashboardActivities } from './activityFilters'

export interface TrainingEffectPoint {
  date: string
  label: string
  aerobic: number
  anaerobic: number
  activityName: string
  activityType: string
}

export interface WeeklyTrainingEffect {
  label: string
  aerobicAvg: number
  anaerobicAvg: number
  sessions: number
}

export function computeTrainingEffectHistory(
  activities: GarminActivity[],
  limit = 18,
): TrainingEffectPoint[] {
  return filterDashboardActivities([...activities])
    .filter(
      (activity) =>
        (activity.aerobicTrainingEffect ?? 0) > 0 || (activity.anaerobicTrainingEffect ?? 0) > 0,
    )
    .slice(0, limit)
    .reverse()
    .map((activity) => ({
      date: activity.startTimeLocal.slice(0, 10),
      label: activity.startTimeLocal.slice(5, 10),
      aerobic: Math.round((activity.aerobicTrainingEffect ?? 0) * 10) / 10,
      anaerobic: Math.round((activity.anaerobicTrainingEffect ?? 0) * 10) / 10,
      activityName: activity.activityName,
      activityType: activity.activityType?.typeKey ?? 'unknown',
    }))
}

export function computeWeeklyTrainingEffect(
  activities: GarminActivity[],
  weeks = 8,
): WeeklyTrainingEffect[] {
  const dashboardActivities = filterDashboardActivities(activities)
  const buckets: WeeklyTrainingEffect[] = []
  const now = new Date()

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const end = new Date(now)
    end.setDate(end.getDate() - index * 7)
    const start = new Date(end)
    start.setDate(start.getDate() - 6)

    const inWeek = dashboardActivities.filter((activity) => {
      const date = new Date(activity.startTimeLocal)
      return date >= start && date <= end
    })

    const withEffect = inWeek.filter(
      (activity) =>
        (activity.aerobicTrainingEffect ?? 0) > 0 || (activity.anaerobicTrainingEffect ?? 0) > 0,
    )

    const aerobicAvg =
      withEffect.length > 0
        ? withEffect.reduce((sum, activity) => sum + (activity.aerobicTrainingEffect ?? 0), 0) /
          withEffect.length
        : 0

    const anaerobicAvg =
      withEffect.length > 0
        ? withEffect.reduce((sum, activity) => sum + (activity.anaerobicTrainingEffect ?? 0), 0) /
          withEffect.length
        : 0

    buckets.push({
      label: start.toISOString().slice(5, 10),
      aerobicAvg: Math.round(aerobicAvg * 10) / 10,
      anaerobicAvg: Math.round(anaerobicAvg * 10) / 10,
      sessions: withEffect.length,
    })
  }

  return buckets
}

export function hasTrainingEffectData(activities: GarminActivity[]): boolean {
  return filterDashboardActivities(activities).some(
    (activity) =>
      (activity.aerobicTrainingEffect ?? 0) > 0 || (activity.anaerobicTrainingEffect ?? 0) > 0,
  )
}
