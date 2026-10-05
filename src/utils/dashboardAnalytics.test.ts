import { describe, expect, it } from 'vitest'
import type { GarminActivity } from '../types/garmin'
import {
  buildPaceTrend,
  buildPeriodComparison,
  buildTrainingHeatmap,
  hasStrengthData,
} from './dashboardAnalytics'

function activity(partial: Partial<GarminActivity> & Pick<GarminActivity, 'activityId' | 'startTimeLocal'>): GarminActivity {
  return {
    activityName: 'Test',
    activityType: { typeKey: 'running' },
    distance: 5000,
    duration: 1800,
    calories: 300,
    ...partial,
  } as GarminActivity
}

describe('buildTrainingHeatmap', () => {
  it('returns fixed number of days with zero defaults', () => {
    const rows = buildTrainingHeatmap([], 7)
    expect(rows).toHaveLength(7)
    expect(rows.every((row) => row.count === 0)).toBe(true)
  })

  it('counts activities on matching dates', () => {
    const rows = buildTrainingHeatmap([], 7)
    const targetDate = rows[rows.length - 1]!.date

    const result = buildTrainingHeatmap(
      [
        activity({
          activityId: 1,
          startTimeLocal: `${targetDate}T08:00:00`,
          activityTrainingLoad: 50,
        }),
      ],
      7,
    )

    const match = result.find((row) => row.date === targetDate)
    expect(match?.count).toBe(1)
    expect(match?.load).toBe(50)
  })
})

describe('buildPeriodComparison', () => {
  it('returns four metric rows', () => {
    const rows = buildPeriodComparison([])
    expect(rows.map((row) => row.key)).toEqual(['sessions', 'km', 'hours', 'load'])
  })
})

describe('buildPaceTrend', () => {
  it('filters out invalid pace values', () => {
    const rows = buildPaceTrend([
      activity({
        activityId: 1,
        startTimeLocal: '2026-07-20T10:00:00',
        distance: 5000,
        duration: 1500,
      }),
      activity({
        activityId: 2,
        startTimeLocal: '2026-07-19T10:00:00',
        distance: 100,
        duration: 60,
        activityType: { typeKey: 'strength_training' },
      }),
    ])

    expect(rows.every((row) => row.paceMinPerKm > 0 && row.paceMinPerKm < 30)).toBe(true)
  })
})

describe('hasStrengthData', () => {
  it('detects recent strength exercise sets', () => {
    const today = new Date().toISOString().slice(0, 10)
    const activities = [
      activity({
        activityId: 1,
        startTimeLocal: `${today}T18:00:00`,
        activityType: { typeKey: 'strength_training' },
        summarizedExerciseSets: [{ category: 'BENCH_PRESS', reps: 8, sets: 3, volume: 1000 }],
      }),
    ] as GarminActivity[]

    expect(hasStrengthData(activities)).toBe(true)
  })
})
