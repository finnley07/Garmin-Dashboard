import { describe, expect, it } from 'vitest'
import { computeRecentWeekStats } from './analysis.js'
import type { GarminActivity } from './types.js'

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

describe('backend computeRecentWeekStats (weekly-target rules + Claude prompt)', () => {
  it('does not carry last week`s sessions into a fresh calendar week', () => {
    const monday = mondayOf(new Date())
    const lastWeek = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday)
      day.setDate(day.getDate() - 7 + i)
      return activity(asLocal(day), 27000)
    })

    const week = computeRecentWeekStats(lastWeek)

    expect(week.sessions).toBe(0)
    expect(week.km).toBe(0)
  })

  it('counts sessions from Monday onward', () => {
    const monday = mondayOf(new Date())
    const week = computeRecentWeekStats([activity(asLocal(monday, 6)), activity(asLocal(new Date()))])

    expect(week.sessions).toBe(2)
  })
})
