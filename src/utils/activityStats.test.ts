import { describe, expect, it } from 'vitest'
import { computeRecentWeekStats } from './activityStats'
import type { GarminActivity } from '../types/garmin'

function activity(startTimeLocal: string, distance = 10000): GarminActivity {
  return {
    activityId: Math.round(Math.random() * 1e9),
    activityName: 'Run',
    activityType: { typeKey: 'running' },
    startTimeLocal,
    distance,
    duration: 3600,
    calories: 600,
  } as GarminActivity
}

/** Monday 00:00 local of the week containing `reference`, formatted like startTimeLocal. */
function mondayOf(reference: Date): Date {
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function asLocal(date: Date, hour = 8): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hour)}:00:00`
}

describe('computeRecentWeekStats', () => {
  it('is empty right now even if last week had plenty of sessions', () => {
    const monday = mondayOf(new Date())
    // 7 sessions spread across the previous calendar week (last Monday–Sunday) – must not count.
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday)
      day.setDate(day.getDate() - 7 + i)
      return activity(asLocal(day), 27000)
    })

    const stats = computeRecentWeekStats(lastWeek)

    expect(stats.sessions).toBe(0)
    expect(stats.km).toBe(0)
  })

  it('counts an activity from earlier today', () => {
    const stats = computeRecentWeekStats([activity(asLocal(new Date()), 10000)])

    expect(stats.sessions).toBe(1)
    expect(stats.km).toBe(10)
  })

  it('excludes an activity from the day right before this Monday', () => {
    const monday = mondayOf(new Date())
    const sundayBefore = new Date(monday)
    sundayBefore.setDate(sundayBefore.getDate() - 1)

    const stats = computeRecentWeekStats([activity(asLocal(sundayBefore, 23))])
    expect(stats.sessions).toBe(0)
  })

  it('counts everything since Monday regardless of how many days that is', () => {
    const monday = mondayOf(new Date())
    const activities = [activity(asLocal(monday, 6)), activity(asLocal(new Date()))]

    const stats = computeRecentWeekStats(activities)

    expect(stats.sessions).toBe(2)
  })
})
