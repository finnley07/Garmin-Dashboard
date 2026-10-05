import { describe, expect, it } from 'vitest'
import { parseActivitiesCsv } from './exportCsv'

describe('parseActivitiesCsv', () => {
  it('returns empty array for header-only CSV', () => {
    expect(parseActivitiesCsv('activityId,date,name,type\n')).toEqual([])
  })

  it('parses exported activity rows', () => {
    const csv = [
      'activityId,date,name,type,distanceKm,durationMin',
      '1,2026-07-20T10:00:00,Morning Run,running,5.2,30',
    ].join('\n')

    const rows = parseActivitiesCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.activityName).toBe('Morning Run')
    expect(rows[0]?.activityType?.typeKey).toBe('running')
    expect(rows[0]?.distance).toBe(5200)
    expect(rows[0]?.duration).toBe(1800)
  })

  it('escapes quoted fields when parsing simple comma split', () => {
    const csv = [
      'date,name,type,distancekm,durationmin',
      '2026-07-21,Easy Ride,cycling,10,45',
    ].join('\n')

    const rows = parseActivitiesCsv(csv)
    expect(rows[0]?.activityName).toBe('Easy Ride')
    expect(rows[0]?.distance).toBe(10000)
  })
})
