import { describe, expect, it } from 'vitest'
import { compactRaceLine, parseRacePredictions } from './race-calendar.js'
import type { PlannedRace } from './types.js'

const TODAY = new Date('2026-08-23T00:00:00.000Z')

describe('parseRacePredictions', () => {
  it('reads Garmin\'s flat time5K/time10K/timeHalfMarathon/timeMarathon fields', () => {
    const entries = parseRacePredictions({
      userId: 1,
      calendarDate: '2026-08-23',
      time5K: 1165,
      time10K: 2504,
      timeHalfMarathon: 5633,
      timeMarathon: 12388,
    })

    expect(entries).toEqual([
      { distance: '5k', timeSeconds: 1165 },
      { distance: '10k', timeSeconds: 2504 },
      { distance: 'halfMarathon', timeSeconds: 5633 },
      { distance: 'marathon', timeSeconds: 12388 },
    ])
  })

  it('handles a missing or empty envelope', () => {
    expect(parseRacePredictions(null)).toEqual([])
    expect(parseRacePredictions({})).toEqual([])
  })
})

function race(overrides: Partial<PlannedRace>): PlannedRace {
  return {
    id: '1',
    name: 'Berlin Marathon',
    date: '2026-10-15',
    distance: 'marathon',
    targetTimeSeconds: 12600,
    ...overrides,
  }
}

describe('compactRaceLine', () => {
  it('returns nothing when there are no upcoming planned races', () => {
    expect(compactRaceLine([], null, TODAY)).toBe('')
    expect(
      compactRaceLine([race({ date: '2026-01-01' })], null, TODAY),
    ).toBe('')
  })

  it('picks the nearest upcoming race and includes days-to-go and target time', () => {
    const line = compactRaceLine([race({})], null, TODAY)

    expect(line).toContain('Berlin Marathon in 53d')
    expect(line).toContain('Distance=marathon')
    expect(line).toContain('Target=3:30:00')
  })

  it('adds the Garmin prediction and delta against the goal when available', () => {
    const line = compactRaceLine(
      [race({})],
      { timeMarathon: 12388 },
      TODAY,
    )

    expect(line).toContain('Predicted=3:26:28')
    expect(line).toContain('Delta=-3:32')
  })

  it('ignores past races and picks the soonest of several', () => {
    const line = compactRaceLine(
      [
        race({ id: 'past', date: '2026-01-01' }),
        race({ id: 'far', name: 'Far Race', date: '2027-01-01' }),
        race({ id: 'near', name: 'Near Race', date: '2026-09-01' }),
      ],
      null,
      TODAY,
    )

    expect(line).toContain('Near Race')
  })
})
