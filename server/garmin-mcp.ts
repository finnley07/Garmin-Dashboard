import type { CallToolFn } from './garmin-session.js'
import { withGarminSession } from './garmin-session.js'
import { getAppConfig } from './app-config.js'
import type { GarminActivity } from './types.js'
import { logger } from './logger.js'

export type { CallToolFn }

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIsoDate(): string {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function subtractDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function maxIsoDate(a: string, b: string): string {
  return a.localeCompare(b) >= 0 ? a : b
}

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

function flattenBodyBatteryChunk(chunk: unknown): Record<string, unknown>[] {
  if (Array.isArray(chunk)) {
    return chunk.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const row = entry as Record<string, unknown>
      if (Array.isArray(row.bodyBattery)) {
        return row.bodyBattery.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
      }
      return [row]
    })
  }

  if (chunk && typeof chunk === 'object') {
    const root = chunk as Record<string, unknown>
    if (Array.isArray(root.bodyBattery)) {
      return root.bodyBattery.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
    }
    return [root]
  }

  return []
}

const BODY_BATTERY_CHUNK_DAYS = 28

async function fetchBodyBatteryHistory(
  call: CallToolFn,
  rangeStart: string,
  endDate: string,
): Promise<unknown[] | null> {
  const byDate = new Map<string, Record<string, unknown>>()
  let cursorEnd = endDate

  while (cursorEnd.localeCompare(rangeStart) >= 0) {
    const chunkStart = maxIsoDate(subtractDays(cursorEnd, BODY_BATTERY_CHUNK_DAYS - 1), rangeStart)
    const chunk = await safeCall<unknown>(call, 'get_body_battery', {
      startDate: chunkStart,
      endDate: cursorEnd,
    })

    for (const row of flattenBodyBatteryChunk(chunk)) {
      const date = String(row.date ?? row.calendarDate ?? '')
      if (date) byDate.set(date, row)
    }

    if (chunkStart === rangeStart) break
    cursorEnd = subtractDays(chunkStart, 1)
  }

  if (byDate.size > 0) {
    return [...byDate.values()].sort((a, b) =>
      String(a.date ?? a.calendarDate ?? '').localeCompare(String(b.date ?? b.calendarDate ?? '')),
    )
  }

  const singleDay = await safeCall<unknown>(call, 'get_body_battery', {
    startDate: endDate,
    endDate,
  })
  const fallback = flattenBodyBatteryChunk(singleDay)
  return fallback.length > 0 ? fallback : null
}

async function safeCall<T>(call: CallToolFn, tool: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    return await call<T>(tool, args)
  } catch (error) {
    logger.warn(`Garmin MCP ${tool} failed`, error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Training readiness and sleep score are generated once each morning and are
 * tagged with the day you wake up on, not the day before – unlike calorie/step
 * totals they are already final by then. Always asking for "yesterday" showed
 * data one full day older than what Garmin Connect displays "right now".
 *
 * This tries today's date first and only falls back to yesterday when Garmin
 * has nothing for today yet (e.g. a sync run right after midnight, before the
 * night's sleep has been processed).
 */
export async function resolveMetricsDate(
  call: CallToolFn,
): Promise<{ date: string; readiness: Record<string, unknown> | unknown[] | null }> {
  const today = todayIsoDate()
  const todayReadiness = await safeCall<Record<string, unknown> | unknown[]>(
    call,
    'get_training_readiness',
    { date: today },
  )
  if (hasContent(todayReadiness)) {
    return { date: today, readiness: todayReadiness }
  }

  const yesterday = yesterdayIsoDate()
  const yesterdayReadiness = await safeCall<Record<string, unknown> | unknown[]>(
    call,
    'get_training_readiness',
    { date: yesterday },
  )
  return { date: yesterday, readiness: yesterdayReadiness }
}

export async function withGarminClient<T>(
  fn: (call: CallToolFn) => Promise<T>,
): Promise<T> {
  return withGarminSession(fn)
}

export async function fetchLiveMetrics(call: CallToolFn): Promise<{
  profile: Record<string, unknown> | null
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | unknown[] | null
  vo2max: Record<string, unknown> | unknown[] | null
  personalRecords: Record<string, unknown> | unknown[] | null
  sleepData: Record<string, unknown> | unknown[] | null
  healthSnapshot: Record<string, unknown> | null
  vo2maxHistory: unknown[] | null
  readinessHistory: unknown[] | null
  sleepHistory: unknown[] | null
  hrvHistory: unknown[] | null
  stressHistory: unknown[] | null
  bodyBatteryHistory: unknown[] | null
  racePredictions: Record<string, unknown> | null
  metricsDate: string
}> {
  const { date, readiness: trainingReadiness } = await resolveMetricsDate(call)
  const historyDays = getAppConfig().metricsHistoryDays
  const rangeStart = subtractDays(date, historyDays)

  const [
    profile,
    trainingStatus,
    vo2max,
    personalRecords,
    sleepData,
    healthSnapshot,
    vo2maxHistory,
    readinessHistory,
    sleepHistory,
    hrvHistory,
    stressHistory,
    racePredictions,
  ] = await Promise.all([
    safeCall<Record<string, unknown>>(call, 'get_user_profile'),
    safeCall<Record<string, unknown>>(call, 'get_training_status', { date }),
    safeCall<Record<string, unknown> | unknown[]>(call, 'get_vo2max', { date }),
    safeCall<Record<string, unknown> | unknown[]>(call, 'get_personal_records'),
    safeCall<Record<string, unknown> | unknown[]>(call, 'get_sleep_data', { date }),
    safeCall<Record<string, unknown>>(call, 'get_daily_health_snapshot', { date }),
    safeCall<unknown[]>(call, 'get_vo2max_range', { startDate: rangeStart, endDate: date }),
    safeCall<unknown[]>(call, 'get_training_readiness_range', { startDate: rangeStart, endDate: date }),
    safeCall<unknown[]>(call, 'get_sleep_data_range', { startDate: rangeStart, endDate: date }),
    safeCall<unknown[]>(call, 'get_hrv_range', { startDate: rangeStart, endDate: date }),
    safeCall<unknown[]>(call, 'get_stress_range', { startDate: rangeStart, endDate: date }),
    safeCall<Record<string, unknown>>(call, 'get_race_predictions'),
  ])

  const bodyBatteryHistory = await fetchBodyBatteryHistory(call, rangeStart, date)

  return {
    profile,
    trainingStatus,
    trainingReadiness,
    vo2max,
    personalRecords,
    sleepData,
    healthSnapshot,
    vo2maxHistory,
    readinessHistory,
    sleepHistory,
    hrvHistory,
    stressHistory,
    bodyBatteryHistory,
    racePredictions,
    metricsDate: date,
  }
}

export async function fetchAllActivities(call: CallToolFn): Promise<GarminActivity[]> {
  const maxActivities = getAppConfig().maxActivitiesLimit
  const all: GarminActivity[] = []
  let start = 0
  const pageSize = 100

  while (true) {
    const page = await call<GarminActivity[]>('get_activities', {
      start,
      limit: pageSize,
    })

    if (!page || page.length === 0) break
    all.push(...page)
    if (page.length < pageSize || all.length >= maxActivities) break
    start += pageSize
  }

  return all
}

export async function fetchNewActivities(
  call: CallToolFn,
  sinceDate: string,
): Promise<GarminActivity[]> {
  const bufferDays = getAppConfig().incrementalSyncBufferDays
  const startDate = subtractDays(sinceDate, bufferDays)
  const endDate = todayIsoDate()

  const activities = await call<GarminActivity[]>('get_activities_by_date', {
    startDate,
    endDate,
  })

  return activities ?? []
}
