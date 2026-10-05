import type { GarminActivity } from './types.js'

/** Activity types excluded from dashboard metrics, charts, and coaching logic. */
export const DASHBOARD_EXCLUDED_ACTIVITY_TYPES = new Set<string>([])

export function isDashboardActivity(activity: Pick<GarminActivity, 'activityType'>): boolean {
  const type = activity.activityType?.typeKey
  if (!type) return true
  return !DASHBOARD_EXCLUDED_ACTIVITY_TYPES.has(type)
}

export function filterDashboardActivities(activities: GarminActivity[]): GarminActivity[] {
  return activities.filter(isDashboardActivity)
}
