import { describe, expect, it, vi } from 'vitest'
import { resolveMetricsDate } from './garmin-mcp.js'
import type { CallToolFn } from './garmin-session.js'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIso(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

describe('resolveMetricsDate', () => {
  it('uses today when Garmin already has a readiness score for today', async () => {
    const call = vi.fn(async (_name: string, args?: Record<string, unknown>) => {
      if (args?.date === todayIso()) return { score: 72 }
      throw new Error('should not be called for yesterday')
    }) as unknown as CallToolFn

    const result = await resolveMetricsDate(call)

    expect(result.date).toBe(todayIso())
    expect(result.readiness).toEqual({ score: 72 })
    expect(call).toHaveBeenCalledTimes(1)
  })

  it('falls back to yesterday when today has no data yet', async () => {
    const call = vi.fn(async (_name: string, args?: Record<string, unknown>) => {
      if (args?.date === todayIso()) return null
      if (args?.date === yesterdayIso()) return { score: 55 }
      throw new Error('unexpected date')
    }) as unknown as CallToolFn

    const result = await resolveMetricsDate(call)

    expect(result.date).toBe(yesterdayIso())
    expect(result.readiness).toEqual({ score: 55 })
  })

  it('treats an empty array as "no data" and falls back', async () => {
    const call = vi.fn(async (_name: string, args?: Record<string, unknown>) => {
      if (args?.date === todayIso()) return []
      return [{ score: 40 }]
    }) as unknown as CallToolFn

    const result = await resolveMetricsDate(call)

    expect(result.date).toBe(yesterdayIso())
  })

  it('still returns yesterday as the date when both calls come back empty', async () => {
    const call = vi.fn(async () => null) as unknown as CallToolFn

    const result = await resolveMetricsDate(call)

    expect(result.date).toBe(yesterdayIso())
    expect(result.readiness).toBeNull()
  })
})
