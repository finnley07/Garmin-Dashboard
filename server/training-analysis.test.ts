import { describe, expect, it } from 'vitest'
import { analyzeTraining, compactTrainingLine } from './training-analysis.js'
import type { GarminActivity } from './types.js'

const NOW = new Date('2026-08-17T12:00:00.000Z')

function daysAgo(days: number): string {
  const date = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)
  return `${date.toISOString().slice(0, 10)} 07:00:00`
}

function activity(overrides: Partial<GarminActivity> & { startTimeLocal: string }): GarminActivity {
  return {
    activityId: Math.round(Math.abs(overrides.startTimeLocal.length * 7919)) + (overrides.activityId ?? 0),
    activityName: 'Session',
    activityType: { typeKey: 'running' },
    distance: 10000,
    duration: 3600,
    calories: 600,
    ...overrides,
  } as GarminActivity
}

describe('analyzeTraining', () => {
  it('prefers Garmin training load and computes the acute:chronic ratio', () => {
    // 100 load per day in the current week, 20 per day in the three weeks before.
    const activities = [
      ...[0, 1, 2, 3, 4, 5, 6].map((day, index) =>
        activity({ activityId: index, startTimeLocal: daysAgo(day), activityTrainingLoad: 100 }),
      ),
      ...Array.from({ length: 21 }, (_, index) =>
        activity({
          activityId: 100 + index,
          startTimeLocal: daysAgo(7 + index),
          activityTrainingLoad: 20,
        }),
      ),
    ]

    const analysis = analyzeTraining(activities, 190, NOW)

    expect(analysis.loadSource).toBe('garmin')
    expect(analysis.acuteLoad7d).toBe(700)
    expect(analysis.chronicLoadWeekly).toBe(Math.round((700 + 420) / 4))
    expect(analysis.acwr).toBeGreaterThan(2)
    expect(analysis.restDays7d).toBe(0)
  })

  it('estimates load from heart rate when Garmin reports none', () => {
    const analysis = analyzeTraining(
      [activity({ startTimeLocal: daysAgo(1), averageHR: 150, duration: 3600 })],
      190,
      NOW,
    )

    expect(analysis.loadSource).toBe('estimated')
    expect(analysis.acuteLoad7d).toBeGreaterThan(0)
  })

  it('falls back to duration without heart rate', () => {
    const analysis = analyzeTraining(
      [activity({ startTimeLocal: daysAgo(1), duration: 3600 })],
      null,
      NOW,
    )

    expect(analysis.loadSource).toBe('duration')
    expect(analysis.acuteLoad7d).toBe(60)
  })

  it('flags high monotony when every day carries the same load', () => {
    const even = [0, 1, 2, 3, 4, 5, 6].map((day, index) =>
      activity({ activityId: index, startTimeLocal: daysAgo(day), activityTrainingLoad: 100 }),
    )
    const contrasted = [0, 2, 4].map((day, index) =>
      activity({
        activityId: index,
        startTimeLocal: daysAgo(day),
        activityTrainingLoad: day === 0 ? 300 : 60,
      }),
    )

    const evenAnalysis = analyzeTraining(even, 190, NOW)
    const contrastedAnalysis = analyzeTraining(contrasted, 190, NOW)

    expect(evenAnalysis.monotony).not.toBeNull()
    expect(contrastedAnalysis.monotony).not.toBeNull()
    expect(evenAnalysis.monotony!).toBeGreaterThan(contrastedAnalysis.monotony!)
  })

  it('derives the intensity distribution from the HR zone times', () => {
    const analysis = analyzeTraining(
      [
        activity({
          startTimeLocal: daysAgo(2),
          hrTimeInZone_1: 600,
          hrTimeInZone_2: 1800,
          hrTimeInZone_3: 300,
          hrTimeInZone_4: 240,
          hrTimeInZone_5: 60,
        }),
      ],
      190,
      NOW,
    )

    expect(analysis.intensity).not.toBeNull()
    expect(analysis.intensity!.easySharePct).toBe(80)
    expect(analysis.intensity!.verdict).toBe('balanced')
  })

  it('calls out a grey-zone distribution', () => {
    const analysis = analyzeTraining(
      [
        activity({
          startTimeLocal: daysAgo(2),
          hrTimeInZone_1: 60,
          hrTimeInZone_2: 300,
          hrTimeInZone_3: 1200,
          hrTimeInZone_4: 900,
          hrTimeInZone_5: 240,
        }),
      ],
      190,
      NOW,
    )

    expect(analysis.intensity!.verdict).toBe('too-hard')
  })

  it('counts rest days, gaps and the strength share', () => {
    const analysis = analyzeTraining(
      [
        activity({ activityId: 1, startTimeLocal: daysAgo(1), duration: 3600 }),
        activity({
          activityId: 2,
          startTimeLocal: daysAgo(9),
          duration: 3600,
          activityType: { typeKey: 'strength_training' },
          distance: 0,
        }),
      ],
      null,
      NOW,
    )

    expect(analysis.restDays7d).toBe(6)
    expect(analysis.longestGapDays).toBeGreaterThanOrEqual(6)
    expect(analysis.daysSinceLastSession).toBe(1)
    expect(analysis.strengthShare28dPct).toBe(50)
  })

  it('counts cycling activities like any other type', () => {
    const analysis = analyzeTraining(
      [
        activity({
          startTimeLocal: daysAgo(1),
          activityType: { typeKey: 'cycling' },
          activityTrainingLoad: 500,
        }),
      ],
      190,
      NOW,
    )

    expect(analysis.acuteLoad7d).toBe(500)
    expect(analysis.sessions7d).toBe(1)
  })

  it('produces a compact prompt line', () => {
    const analysis = analyzeTraining(
      [activity({ startTimeLocal: daysAgo(1), activityTrainingLoad: 120 })],
      190,
      NOW,
    )

    const line = compactTrainingLine(analysis)
    expect(line).toContain('Load:')
    expect(line).toContain('Last7=120')
  })
})
