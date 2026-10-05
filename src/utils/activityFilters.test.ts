import { describe, expect, it } from 'vitest'
import { filterDashboardActivities, isDashboardActivity } from './activityFilters'
import type { GarminActivity } from '../types/garmin'

function activity(typeKey: string): GarminActivity {
  return {
    activityId: 1,
    activityName: 'Test',
    startTimeLocal: '2026-07-20T10:00:00',
    activityType: { typeKey },
    distance: 5000,
    duration: 1800,
    calories: 300,
  } as GarminActivity
}

describe('activityFilters', () => {
  it('includes every activity type, including cycling', () => {
    expect(isDashboardActivity(activity('running'))).toBe(true)
    expect(isDashboardActivity(activity('cycling'))).toBe(true)
  })

  it('does not drop any activities from mixed lists', () => {
    const filtered = filterDashboardActivities([
      activity('running'),
      activity('cycling'),
      activity('strength_training'),
    ])
    expect(filtered.map((a) => a.activityType?.typeKey)).toEqual([
      'running',
      'cycling',
      'strength_training',
    ])
  })
})
