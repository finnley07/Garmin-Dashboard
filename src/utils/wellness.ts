import type {
  RaceDistanceKey,
  UserProfileSettings,
  WeeklyTargets,
} from '../types/garmin'
import type { WeekStats } from './activityStats'

export interface ReadinessFactor {
  key: string
  label: string
  percent: number
}

export interface LoadBalanceItem {
  key: string
  label: string
  current: number
  targetMin: number
  targetMax: number
}

export interface Vo2HistoryPoint {
  date: string
  value: number
}

export interface ReadinessHistoryPoint {
  date: string
  score: number
}

export interface SleepScoreHistoryPoint {
  date: string
  score: number
}

export interface MetricHistoryPoint {
  date: string
  value: number
}

export interface SleepDetailHistoryPoint {
  date: string
  score: number | null
  durationHours: number | null
}

export interface TrainingStatusHistoryPoint {
  date: string
  statusKey: string
  statusLabel: string
  acwr: number | null
}

export interface RacePredictionItem {
  distance: RaceDistanceKey
  timeLabel: string
}

export interface SleepDetail {
  score: number | null
  durationHours: number | null
  deepHours: number | null
  remHours: number | null
  lightHours: number | null
  awakeHours: number | null
}

export interface ExtendedWellness {
  trainingStatus: string | null
  trainingStatusDetail: string | null
  readinessScore: number | null
  readinessLevel: string | null
  readinessFeedback: string | null
  vo2max: number | null
  vo2Date: string | null
  vo2Cycling: number | null
  fitnessAge: number | null
  acwrRatio: number | null
  acwrStatus: string | null
  acuteLoad: number | null
  chronicLoad: number | null
  weeklyLoad: number | null
  sleepScore: number | null
  recoveryTimeHours: number | null
  hrvWeekly: number | null
  readinessFactors: ReadinessFactor[]
  loadBalance: LoadBalanceItem[]
  heatAcclimation: number | null
  heatTrend: string | null
  sleep: SleepDetail
  bodyBattery: number | null
  stressLevel: number | null
  restingHr: number | null
  hrvStatus: string | null
  vo2History: Vo2HistoryPoint[]
  readinessHistory: ReadinessHistoryPoint[]
  sleepHistory: SleepScoreHistoryPoint[]
  hrvHistory: MetricHistoryPoint[]
  stressHistory: MetricHistoryPoint[]
  bodyBatteryHistory: MetricHistoryPoint[]
  sleepDurationHistory: MetricHistoryPoint[]
  sleepDetailHistory: SleepDetailHistoryPoint[]
  trainingStatusHistory: TrainingStatusHistoryPoint[]
  racePredictions: RacePredictionItem[]
}

const TRAINING_STATUS_LABELS: Record<string, string> = {
  RECOVERY_1: 'Erholung',
  RECOVERY_2: 'Erholung',
  RECOVERY_3: 'Erholung',
  DETRAINING: 'Detraining',
  MAINTAINING: 'Erhalt',
  PRODUCTIVE: 'Produktiv',
  PEAKING: 'Peak',
  OVERREACHING: 'Überlastung',
  UNPRODUCTIVE: 'Unproduktiv',
}

const READINESS_LEVEL_LABELS: Record<string, string> = {
  POOR: 'Niedrig',
  LOW: 'Niedrig',
  MODERATE: 'Moderat',
  HIGH: 'Hoch',
  PRIME: 'Optimal',
}

const ACWR_STATUS_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  OPTIMAL: 'Optimal',
  HIGH: 'Hoch',
  VERY_HIGH: 'Sehr hoch',
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstArrayItem(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0])
  return asRecord(value)
}

function secondsToHours(seconds: number | undefined): number | null {
  if (!seconds || seconds <= 0) return null
  return Math.round((seconds / 3600) * 10) / 10
}

function parseSleepDetail(
  readiness: Record<string, unknown> | null,
  sleepRaw: unknown,
): SleepDetail {
  const sleep = firstArrayItem(sleepRaw) ?? asRecord(sleepRaw)
  const scores = asRecord(sleep?.sleepScores) ?? asRecord(sleep?.dailySleepDTO)
  const overall = asRecord(scores?.overall) ?? asRecord(scores?.totalScore)

  const durationSec =
    (sleep?.sleepTimeSeconds as number | undefined) ??
    (sleep?.durationInSeconds as number | undefined) ??
    (sleep?.sleepStartTimestamp && sleep?.sleepEndTimestamp
      ? Number(sleep.sleepEndTimestamp) - Number(sleep.sleepStartTimestamp)
      : undefined)

  return {
    score:
      (readiness?.sleepScore as number | undefined) ??
      (overall?.value as number | undefined) ??
      (sleep?.sleepScore as number | undefined) ??
      null,
    durationHours: secondsToHours(durationSec),
    deepHours: secondsToHours(
      (sleep?.deepSleepSeconds as number | undefined) ??
        (sleep?.deepSleepDurationInSeconds as number | undefined),
    ),
    remHours: secondsToHours(
      (sleep?.remSleepSeconds as number | undefined) ??
        (sleep?.remSleepDurationInSeconds as number | undefined),
    ),
    lightHours: secondsToHours(
      (sleep?.lightSleepSeconds as number | undefined) ??
        (sleep?.lightSleepDurationInSeconds as number | undefined),
    ),
    awakeHours: secondsToHours(
      (sleep?.awakeSleepSeconds as number | undefined) ??
        (sleep?.awakeDurationInSeconds as number | undefined),
    ),
  }
}

function parseHealthSnapshot(raw: unknown) {
  const snap = asRecord(raw)
  if (!snap) {
    return { bodyBattery: null, stressLevel: null, restingHr: null, hrvStatus: null as string | null }
  }

  const bb = snap.bodyBattery ?? snap.bodyBatteryMostRecentValue
  const stress = snap.stressLevel ?? snap.averageStressLevel ?? snap.maxStressLevel
  const rhr = snap.restingHeartRate ?? snap.restingHr ?? snap.restingHeartRateValue
  const hrv = snap.hrvStatus ?? snap.weeklyHrv ?? snap.hrvWeeklyAverage

  return {
    bodyBattery: typeof bb === 'number' ? bb : null,
    stressLevel: typeof stress === 'number' ? stress : null,
    restingHr: typeof rhr === 'number' ? rhr : null,
    hrvStatus: typeof hrv === 'string' ? hrv : null,
  }
}

function parseReadinessFactors(readiness: Record<string, unknown> | null): ReadinessFactor[] {
  if (!readiness) return []

  const factors: ReadinessFactor[] = [
    { key: 'sleep', label: 'Schlaf', percent: Number(readiness.sleepScoreFactorPercent ?? 0) },
    { key: 'recovery', label: 'Erholung', percent: Number(readiness.recoveryTimeFactorPercent ?? 0) },
    { key: 'acwr', label: 'Belastung', percent: Number(readiness.acwrFactorPercent ?? 0) },
    { key: 'hrv', label: 'HRV', percent: Number(readiness.hrvFactorPercent ?? 0) },
    { key: 'stress', label: 'Stress', percent: Number(readiness.stressHistoryFactorPercent ?? 0) },
    { key: 'sleepHistory', label: 'Schlaf-Trend', percent: Number(readiness.sleepHistoryFactorPercent ?? 0) },
  ]

  return factors.filter((f) => f.percent > 0).sort((a, b) => b.percent - a.percent)
}

function parseLoadBalance(trainingStatus: Record<string, unknown> | null): LoadBalanceItem[] {
  const balanceRoot = asRecord(trainingStatus?.mostRecentTrainingLoadBalance)
  const map = asRecord(balanceRoot?.metricsTrainingLoadBalanceDTOMap)
  if (!map) return []

  const first = asRecord(Object.values(map)[0])
  if (!first) return []

  return [
    {
      key: 'aerobicLow',
      label: 'Aerob niedrig',
      current: Number(first.monthlyLoadAerobicLow ?? 0),
      targetMin: Number(first.monthlyLoadAerobicLowTargetMin ?? 0),
      targetMax: Number(first.monthlyLoadAerobicLowTargetMax ?? first.monthlyLoadAerobicLowTargetMin ?? 0),
    },
    {
      key: 'aerobicHigh',
      label: 'Aerob hoch',
      current: Number(first.monthlyLoadAerobicHigh ?? 0),
      targetMin: Number(first.monthlyLoadAerobicHighTargetMin ?? 0),
      targetMax: Number(first.monthlyLoadAerobicHighTargetMax ?? first.monthlyLoadAerobicHighTargetMin ?? 0),
    },
    {
      key: 'anaerobic',
      label: 'Anaerob',
      current: Number(first.monthlyLoadAnaerobic ?? 0),
      targetMin: Number(first.monthlyLoadAnaerobicTargetMin ?? 0),
      targetMax: Number(first.monthlyLoadAnaerobicTargetMax ?? first.monthlyLoadAnaerobicTargetMin ?? 0),
    },
  ].filter((item) => item.current > 0 || item.targetMin > 0)
}

function unwrapHistoryRow(entry: unknown): Record<string, unknown> | null {
  const wrapper = asRecord(entry)
  if (!wrapper) return null

  const nested = wrapper.data
  if (Array.isArray(nested) && nested.length > 0) {
    return asRecord(nested[0])
  }

  return wrapper
}

function historyEntryDate(entry: unknown, row: Record<string, unknown>): string {
  return String(row.calendarDate ?? asRecord(entry)?.date ?? '')
}

function parseVo2History(raw: unknown[] | null): Vo2HistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = unwrapHistoryRow(entry)
      if (!row) return null

      const generic = asRecord(row.generic) ?? row
      const value =
        (generic.vo2MaxPreciseValue as number | undefined) ??
        (generic.vo2MaxValue as number | undefined)
      const date = historyEntryDate(entry, generic)
      if (!value || !date) return null
      return { date, value }
    })
    .filter((p): p is Vo2HistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseReadinessHistory(raw: unknown[] | null): ReadinessHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = unwrapHistoryRow(entry)
      if (!row) return null

      const score = row.score as number | undefined
      const date = historyEntryDate(entry, row)
      if (score === undefined || !date) return null
      return { date, score }
    })
    .filter((p): p is ReadinessHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseSleepScoreHistory(raw: unknown[] | null): SleepScoreHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const sleepRow = unwrapSleepRangeRow(entry)
      if (!sleepRow) return null

      const scores = asRecord(sleepRow.sleepScores) ?? asRecord(sleepRow.dailySleepDTO)
      const overall = asRecord(scores?.overall) ?? asRecord(scores?.totalScore)
      const score =
        (overall?.value as number | undefined) ??
        (sleepRow.sleepScore as number | undefined)
      const date = String(asRecord(entry)?.date ?? sleepRow.calendarDate ?? '')
      if (score === undefined || !date) return null
      return { date, score }
    })
    .filter((p): p is SleepScoreHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseSleepScoreHistoryFromReadiness(raw: unknown[] | null): SleepScoreHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = unwrapHistoryRow(entry)
      if (!row) return null

      const score = row.sleepScore as number | undefined
      const date = historyEntryDate(entry, row)
      if (score === undefined || !date) return null
      return { date, score }
    })
    .filter((p): p is SleepScoreHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function unwrapSleepRangeRow(entry: unknown): Record<string, unknown> | null {
  const wrapper = asRecord(entry)
  if (!wrapper) return null

  const data = wrapper.data
  if (Array.isArray(data) && data.length > 0) {
    return asRecord(data[0]) ?? firstArrayItem(data[0])
  }
  return wrapper
}

function parseSleepDetailHistory(raw: unknown[] | null): SleepDetailHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const sleepRow = unwrapSleepRangeRow(entry)
      if (!sleepRow) return null

      const date = String(asRecord(entry)?.date ?? sleepRow.calendarDate ?? '')
      if (!date) return null

      const scores = asRecord(sleepRow.sleepScores) ?? asRecord(sleepRow.dailySleepDTO)
      const overall = asRecord(scores?.overall) ?? asRecord(scores?.totalScore)
      const score =
        (overall?.value as number | undefined) ??
        (sleepRow.sleepScore as number | undefined) ??
        null

      const durationSec =
        (sleepRow.sleepTimeSeconds as number | undefined) ??
        (sleepRow.durationInSeconds as number | undefined)

      return {
        date,
        score,
        durationHours: secondsToHours(durationSec),
      }
    })
    .filter((p): p is SleepDetailHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseHrvHistory(raw: unknown[] | null): MetricHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = unwrapHistoryRow(entry)
      if (!row) return null

      const summary = asRecord(row.hrvSummary) ?? row
      const value =
        (summary.lastNightAvg as number | undefined) ??
        (summary.weeklyAvg as number | undefined) ??
        (summary.lastNight5MinHigh as number | undefined)
      const date = historyEntryDate(entry, summary)
      if (value === undefined || !date) return null
      return { date, value }
    })
    .filter((p): p is MetricHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseStressHistory(raw: unknown[] | null): MetricHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = unwrapHistoryRow(entry)
      if (!row) return null

      const value =
        (row.avgStressLevel as number | undefined) ??
        (row.averageStressLevel as number | undefined)
      const date = historyEntryDate(entry, row)
      if (value === undefined || !date) return null
      return { date, value }
    })
    .filter((p): p is MetricHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function parseBodyBatteryHistory(raw: unknown): MetricHistoryPoint[] {
  const rows = normalizeBodyBatteryRows(raw)
  if (!rows.length) return []

  return rows
    .map((row) => {
      const date = String(row.date ?? row.calendarDate ?? '')
      if (!date) return null

      const values = row.bodyBatteryValuesArray
      if (Array.isArray(values) && values.length > 0) {
        const levels = values
          .map((item) => (Array.isArray(item) ? Number(item[1]) : null))
          .filter((v): v is number => v !== null && Number.isFinite(v))
        if (levels.length) {
          return { date, value: Math.max(...levels) }
        }
      }

      const fallback =
        (row.highest as number | undefined) ??
        (row.bodyBatteryMostRecentValue as number | undefined) ??
        (row.charged as number | undefined)
      if (fallback === undefined) return null
      return { date, value: fallback }
    })
    .filter((p): p is MetricHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-84)
}

function normalizeBodyBatteryRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => {
      const row = asRecord(entry)
      if (!row) return []
      if (Array.isArray(row.bodyBattery)) {
        return row.bodyBattery.map((item) => asRecord(item)).filter(Boolean) as Record<string, unknown>[]
      }
      return [row]
    })
  }

  const root = asRecord(raw)
  if (!root) return []
  if (Array.isArray(root.bodyBattery)) {
    return root.bodyBattery.map((item) => asRecord(item)).filter(Boolean) as Record<string, unknown>[]
  }
  return [root]
}

export function formatTrainingStatusLabel(statusKey: string | null): string | null {
  if (!statusKey) return null
  return TRAINING_STATUS_LABELS[statusKey] ?? statusKey.replace(/_/g, ' ')
}

function parseTrainingStatusHistory(raw: unknown[] | null | undefined): TrainingStatusHistoryPoint[] {
  if (!raw?.length) return []

  return raw
    .map((entry) => {
      const row = asRecord(entry)
      if (!row) return null
      const statusKey = String(row.statusKey ?? '')
      const date = String(row.date ?? '')
      if (!statusKey || !date) return null
      return {
        date,
        statusKey,
        statusLabel: formatTrainingStatusLabel(statusKey) ?? statusKey,
        acwr: typeof row.acwr === 'number' ? row.acwr : null,
      }
    })
    .filter((p): p is TrainingStatusHistoryPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-120)
}

/** Garmin's race-predictions endpoint uses these exact field names - flat seconds, not nested objects. */
const RACE_PREDICTION_FIELDS: Record<RaceDistanceKey, string> = {
  '5k': 'time5K',
  '10k': 'time10K',
  halfMarathon: 'timeHalfMarathon',
  marathon: 'timeMarathon',
  other: '',
}

function parseRacePredictions(raw: unknown): RacePredictionItem[] {
  const root = asRecord(raw)
  if (!root) return []

  const entries: RacePredictionItem[] = []
  const distances: RaceDistanceKey[] = ['5k', '10k', 'halfMarathon', 'marathon']

  for (const key of distances) {
    const seconds = root[RACE_PREDICTION_FIELDS[key]] as number | undefined
    if (typeof seconds === 'number' && seconds > 0) {
      entries.push({ distance: key, timeLabel: formatRaceTime(seconds) })
    }
  }

  return entries
}

function formatRaceTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function parseExtendedWellness(data: {
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
  sleepData?: unknown
  healthSnapshot?: unknown
  vo2maxHistory?: unknown[] | null
  readinessHistory?: unknown[] | null
  sleepHistory?: unknown[] | null
  hrvHistory?: unknown[] | null
  stressHistory?: unknown[] | null
  bodyBatteryHistory?: unknown | null
  trainingStatusHistory?: unknown[] | null
  racePredictions?: unknown
}): ExtendedWellness {
  const statusRoot = data.trainingStatus
  const mostRecent = asRecord(statusRoot?.mostRecentTrainingStatus)
  const latestMap = asRecord(mostRecent?.latestTrainingStatusData)
  const firstDevice = latestMap ? asRecord(Object.values(latestMap)[0]) : null
  const feedback = firstDevice?.trainingStatusFeedbackPhrase as string | undefined
  const acute = asRecord(firstDevice?.acuteTrainingLoadDTO)

  const readiness = firstArrayItem(data.trainingReadiness)
  const vo2Entry = firstArrayItem(data.vo2max)
  const generic = asRecord(vo2Entry?.generic)
  const cycling = asRecord(vo2Entry?.cycling)
  const heat = asRecord(vo2Entry?.heatAltitudeAcclimation) ?? asRecord(
    asRecord(statusRoot?.mostRecentVO2Max)?.heatAltitudeAcclimation,
  )

  const health = parseHealthSnapshot(data.healthSnapshot)
  const sleep = parseSleepDetail(readiness, data.sleepData)

  const acwrStatusRaw = acute?.acwrStatus as string | undefined

  const sleepDetailHistory = parseSleepDetailHistory(data.sleepHistory ?? null)
  const sleepFromRange = parseSleepScoreHistory(data.sleepHistory ?? null)
  const sleepFromReadiness = parseSleepScoreHistoryFromReadiness(data.readinessHistory ?? null)

  // Garmin's "current" VO2max snapshot is sometimes empty even though the
  // history endpoint has recent readings - fall back to the latest history
  // point so the dashboard doesn't hide VO2max just because that one field
  // came back blank.
  const vo2History = parseVo2History(data.vo2maxHistory ?? null)
  const latestVo2History = vo2History.length ? vo2History[vo2History.length - 1] : null

  return {
    trainingStatus: feedback ? (TRAINING_STATUS_LABELS[feedback] ?? feedback.replace(/_/g, ' ')) : null,
    trainingStatusDetail: feedback ?? null,
    readinessScore: (readiness?.score as number | undefined) ?? null,
    readinessLevel: readiness?.level
      ? (READINESS_LEVEL_LABELS[String(readiness.level)] ?? String(readiness.level))
      : null,
    readinessFeedback: (readiness?.feedbackShort as string | undefined) ?? null,
    vo2max:
      (generic?.vo2MaxPreciseValue as number | undefined) ??
      (generic?.vo2MaxValue as number | undefined) ??
      latestVo2History?.value ??
      null,
    vo2Date:
      (generic?.calendarDate as string | undefined) ?? latestVo2History?.date ?? null,
    vo2Cycling:
      (cycling?.vo2MaxPreciseValue as number | undefined) ??
      (cycling?.vo2MaxValue as number | undefined) ??
      null,
    fitnessAge: (generic?.fitnessAge as number | undefined) ?? null,
    acwrRatio: (acute?.dailyAcuteChronicWorkloadRatio as number | undefined) ?? null,
    acwrStatus: acwrStatusRaw ? (ACWR_STATUS_LABELS[acwrStatusRaw] ?? acwrStatusRaw) : null,
    acuteLoad: (acute?.dailyTrainingLoadAcute as number | undefined) ?? null,
    chronicLoad: (acute?.dailyTrainingLoadChronic as number | undefined) ?? null,
    weeklyLoad: (acute?.dailyTrainingLoadAcute as number | undefined) ?? null,
    sleepScore: sleep.score,
    recoveryTimeHours: (readiness?.recoveryTime as number | undefined) ?? null,
    hrvWeekly: (readiness?.hrvWeeklyAverage as number | undefined) ?? null,
    readinessFactors: parseReadinessFactors(readiness),
    loadBalance: parseLoadBalance(statusRoot),
    heatAcclimation: (heat?.heatAcclimationPercentage as number | undefined) ?? null,
    heatTrend: (heat?.heatTrend as string | undefined) ?? null,
    sleep,
    bodyBattery: health.bodyBattery,
    stressLevel: health.stressLevel,
    restingHr: health.restingHr,
    hrvStatus: health.hrvStatus,
    vo2History,
    readinessHistory: parseReadinessHistory(data.readinessHistory ?? null),
    sleepHistory: sleepFromRange.length ? sleepFromRange : sleepFromReadiness,
    hrvHistory: parseHrvHistory(data.hrvHistory ?? null),
    stressHistory: parseStressHistory(data.stressHistory ?? null),
    bodyBatteryHistory: parseBodyBatteryHistory(data.bodyBatteryHistory ?? null),
    sleepDurationHistory: sleepDetailHistory
      .filter((point) => point.durationHours !== null)
      .map((point) => ({ date: point.date, value: point.durationHours! })),
    sleepDetailHistory,
    trainingStatusHistory: parseTrainingStatusHistory(data.trainingStatusHistory),
    racePredictions: parseRacePredictions(data.racePredictions),
  }
}

// Legacy export for existing components
export interface WellnessSnapshot {
  trainingStatus: string | null
  trainingStatusDetail: string | null
  readinessScore: number | null
  readinessLevel: string | null
  vo2max: number | null
  vo2Date: string | null
  acwrRatio: number | null
  weeklyLoad: number | null
  sleepScore: number | null
}

export function parseWellness(data: Parameters<typeof parseExtendedWellness>[0]): WellnessSnapshot {
  const ext = parseExtendedWellness(data)
  return {
    trainingStatus: ext.trainingStatus,
    trainingStatusDetail: ext.trainingStatusDetail,
    readinessScore: ext.readinessScore,
    readinessLevel: ext.readinessLevel,
    vo2max: ext.vo2max,
    vo2Date: ext.vo2Date,
    acwrRatio: ext.acwrRatio,
    weeklyLoad: ext.weeklyLoad,
    sleepScore: ext.sleepScore,
  }
}

const PR_TYPE_KEYS: Record<number, string> = {
  1: 'pr.types.1km',
  2: 'pr.types.1mile',
  3: 'pr.types.5km',
  4: 'pr.types.10km',
  5: 'pr.types.halfMarathon',
  6: 'pr.types.marathon',
  7: 'pr.types.longestDistance',
  8: 'pr.types.longestRide',
  9: 'pr.types.fastest100m',
  13: 'pr.types.400m',
}

export interface PersonalRecordItem {
  id: number
  typeLabel: string
  activityName: string
  activityType: string
  activityId: number
  date: string
  valueLabel: string
}

export function parsePersonalRecords(
  raw: unknown,
  t: (key: string, params?: Record<string, string | number>) => string,
): PersonalRecordItem[] {
  if (!Array.isArray(raw)) return []

  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const pr = entry as Record<string, unknown>
      const typeId = Number(pr.typeId ?? 0)
      const activityType = String(pr.activityType ?? '')
      const value = Number(pr.value ?? 0)

      return {
        id: Number(pr.id ?? 0),
        typeLabel: PR_TYPE_KEYS[typeId] ? t(PR_TYPE_KEYS[typeId]!) : `PR #${typeId}`,
        activityName: String(pr.activityName ?? '–'),
        activityType,
        activityId: Number(pr.activityId ?? 0),
        date: String(
          pr.activityStartDateTimeLocalFormatted ??
            pr.actStartDateTimeInGMTFormatted ??
            '',
        ).slice(0, 10),
        valueLabel: formatPrValue(typeId, value, activityType),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

function formatPrValue(typeId: number, value: number, activityType: string): string {
  if (!value) return '–'

  if (activityType === 'running' || activityType === 'cycling') {
    if (typeId <= 6 || typeId === 13) {
      const totalSec = Math.round(value)
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = totalSec % 60
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      return `${m}:${String(s).padStart(2, '0')}`
    }
    if (value > 1000) return `${(value / 1000).toFixed(2)} km`
  }

  if (value > 1000) return `${(value / 1000).toFixed(1)} km`
  return String(Math.round(value))
}

export type PlanIntensity = 'rest' | 'easy' | 'moderate' | 'hard'

export interface TodayPlan {
  intensity: PlanIntensity
  title: string
  description: string
  focus: string
}

export function buildTodayPlan(
  wellness: ExtendedWellness,
  week: WeekStats,
  profile: UserProfileSettings,
  t: (key: string, params?: Record<string, string | number>) => string,
): TodayPlan {
  const status = wellness.trainingStatusDetail ?? ''
  const readiness = wellness.readinessScore ?? 50
  const acwr = wellness.acwrRatio
  const sleep = wellness.sleepScore

  if (status === 'OVERREACHING' || (readiness < 40 && (acwr ?? 0) > 1.2)) {
    return {
      intensity: 'rest',
      title: t('plan.messages.restDay.title'),
      description: t('plan.messages.restDay.description'),
      focus: t('plan.focusOptions.recovery'),
    }
  }

  if (sleep !== null && sleep < 55) {
    return {
      intensity: 'easy',
      title: t('plan.messages.easySession.title'),
      description: t('plan.messages.easySession.description', { sleep }),
      focus: t('plan.focusOptions.catchUpSleep'),
    }
  }

  if (readiness >= 75 && (acwr === null || acwr <= 1.0)) {
    const focus = primaryFocusForProfile(profile, week, t)
    return {
      intensity: 'hard',
      title: t('plan.messages.qualityDay.title'),
      description: t('plan.messages.qualityDay.description', { readiness }),
      focus,
    }
  }

  const gap = biggestWeeklyGap(week, profile.weeklyTargets, t)
  if (gap) {
    return {
      intensity: 'moderate',
      title: t('plan.messages.weeklyGap.title', { label: gap.label }),
      description: gap.description,
      focus: gap.label,
    }
  }

  return {
    intensity: 'moderate',
    title: t('plan.messages.balanced.title'),
    description: t('plan.messages.balanced.description', { readiness }),
    focus: t('plan.focusOptions.continuePlan'),
  }
}

function primaryFocusForProfile(
  profile: UserProfileSettings,
  week: WeekStats,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  switch (profile.athleteType) {
    case 'runner':
      return week.byType.running ? t('plan.focusOptions.tempoOrIntervals') : t('plan.focusOptions.planRun')
    case 'bodybuilding':
      return week.byType.strength_training
        ? t('plan.focusOptions.progressiveOverload')
        : t('plan.focusOptions.strengthSession')
    case 'cyclist':
      return week.byType.running ? t('plan.focusOptions.tempoOrIntervals') : t('plan.focusOptions.planRun')
    case 'hybrid':
      return t('plan.focusOptions.qualityRunOrStrength')
    case 'triathlon':
      return t('plan.focusOptions.weaknessDiscipline')
    default:
      return t('plan.focusOptions.qualitySession')
  }
}

function biggestWeeklyGap(
  week: WeekStats,
  targets: WeeklyTargets,
  t: (key: string, params?: Record<string, string | number>) => string,
): { label: string; description: string } | null {
  const checks = [
    { label: t('plan.disciplines.running'), target: targets.runningSessions, actual: week.byType.running ?? 0 },
    {
      label: t('plan.disciplines.strength'),
      target: targets.strengthSessions,
      actual: week.byType.strength_training ?? 0,
    },
    { label: t('plan.disciplines.swimming'), target: targets.swimmingSessions, actual: week.byType.swimming ?? 0 },
  ]

  let best: { label: string; gap: number; target: number; actual: number } | null = null
  for (const check of checks) {
    if (!check.target || check.target <= 0) continue
    const gap = check.target - check.actual
    if (gap > 0 && (!best || gap > best.gap)) {
      best = { label: check.label, gap, target: check.target, actual: check.actual }
    }
  }

  if (!best) return null
  return {
    label: best.label,
    description: t('plan.messages.weeklyGap.description', {
      actual: best.actual,
      target: best.target,
      label: best.label,
    }),
  }
}

export function hasRecoveryData(wellness: ExtendedWellness): boolean {
  return Boolean(
    wellness.sleepScore ||
      wellness.sleep.durationHours ||
      wellness.bodyBattery ||
      wellness.stressLevel ||
      wellness.readinessFactors.length ||
      wellness.hrvHistory.length ||
      wellness.stressHistory.length ||
      wellness.bodyBatteryHistory.length,
  )
}

export function hasPerformanceData(wellness: ExtendedWellness): boolean {
  return Boolean(
    wellness.vo2max ||
      wellness.vo2History.length ||
      wellness.acwrRatio ||
      wellness.loadBalance.length,
  )
}
