import { describe, expect, it } from 'vitest'
import type { GarminActivity, WeeklySchedule } from '../types/garmin'
import { getTodaySchedule, weekdayKeyFor } from './weeklySchedule'

// A Wednesday, chosen so weekdayKeyFor is deterministic regardless of when the suite runs.
const WEDNESDAY = new Date('2026-08-19T09:00:00')

function scheduleWith(entries: Partial<WeeklySchedule>): WeeklySchedule {
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null, ...entries }
}

function activity(overrides: Partial<GarminActivity>): GarminActivity {
  return {
    activityId: 1,
    activityName: 'Session',
    activityType: { typeKey: 'running' },
    startTimeLocal: '2026-08-19 07:00:00',
    distance: 5000,
    duration: 1800,
    calories: 300,
    ...overrides,
  } as GarminActivity
}

describe('weekdayKeyFor', () => {
  it('maps a JS Date to the matching weekday key', () => {
    expect(weekdayKeyFor(WEDNESDAY)).toBe('wed')
    expect(weekdayKeyFor(new Date('2026-08-17T09:00:00'))).toBe('mon')
    expect(weekdayKeyFor(new Date('2026-08-23T09:00:00'))).toBe('sun')
  })
})

describe('getTodaySchedule', () => {
  it('returns null when no day is set for today', () => {
    expect(getTodaySchedule(scheduleWith({}), [], WEDNESDAY)).toBeNull()
  })

  it('reports "planned" when no matching activity was synced yet', () => {
    const schedule = scheduleWith({ wed: { type: 'strength_training', note: '' } })

    const result = getTodaySchedule(schedule, [], WEDNESDAY)

    expect(result?.status).toBe('planned')
    expect(result?.completedActivity).toBeNull()
  })

  it('reports "done" once a same-day activity of the matching type exists', () => {
    const schedule = scheduleWith({ wed: { type: 'running', note: '' } })
    const activities = [activity({ activityType: { typeKey: 'running' } })]

    const result = getTodaySchedule(schedule, activities, WEDNESDAY)

    expect(result?.status).toBe('done')
    expect(result?.completedActivity).toBe(activities[0])
  })

  it('ignores an activity of a different type or a different day', () => {
    const schedule = scheduleWith({ wed: { type: 'running', note: '' } })
    const wrongType = activity({ activityType: { typeKey: 'strength_training' } })
    const wrongDay = activity({ activityType: { typeKey: 'running' }, startTimeLocal: '2026-08-18 07:00:00' })

    const result = getTodaySchedule(schedule, [wrongType, wrongDay], WEDNESDAY)

    expect(result?.status).toBe('planned')
  })

  it('never marks a rest day as done, even with activities logged', () => {
    const schedule = scheduleWith({ wed: { type: 'rest', note: '' } })
    const activities = [activity({ activityType: { typeKey: 'running' } })]

    const result = getTodaySchedule(schedule, activities, WEDNESDAY)

    expect(result?.status).toBe('planned')
    expect(result?.completedActivity).toBeNull()
  })

  it('never auto-completes an "other" day, since it has no Garmin type to match', () => {
    const schedule = scheduleWith({ wed: { type: 'other', note: 'Yoga' } })
    const activities = [activity({ activityType: { typeKey: 'yoga' } })]

    const result = getTodaySchedule(schedule, activities, WEDNESDAY)

    expect(result?.status).toBe('planned')
  })
})
