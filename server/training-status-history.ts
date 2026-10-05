export interface TrainingStatusHistoryPoint {
  date: string
  statusKey: string
  acwr: number | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function extractTrainingStatusKey(
  trainingStatus: Record<string, unknown> | null,
): string | null {
  const mostRecent = asRecord(trainingStatus?.mostRecentTrainingStatus)
  const latestMap = asRecord(mostRecent?.latestTrainingStatusData)
  const firstDevice = latestMap ? asRecord(Object.values(latestMap)[0]) : null
  return (firstDevice?.trainingStatusFeedbackPhrase as string | undefined) ?? null
}

export function extractAcwrRatio(
  trainingStatus: Record<string, unknown> | null,
): number | null {
  const mostRecent = asRecord(trainingStatus?.mostRecentTrainingStatus)
  const latestMap = asRecord(mostRecent?.latestTrainingStatusData)
  const firstDevice = latestMap ? asRecord(Object.values(latestMap)[0]) : null
  const acute = asRecord(firstDevice?.acuteTrainingLoadDTO)
  const ratio = acute?.dailyAcuteChronicWorkloadRatio as number | undefined
  return ratio ?? null
}

export function appendTrainingStatusHistory(
  existing: TrainingStatusHistoryPoint[] | undefined,
  trainingStatus: Record<string, unknown> | null,
  date: string,
): TrainingStatusHistoryPoint[] {
  const statusKey = extractTrainingStatusKey(trainingStatus)
  if (!statusKey || !date) return existing ?? []

  const acwr = extractAcwrRatio(trainingStatus)
  const history = (existing ?? []).filter((point) => point.date !== date)
  history.push({ date, statusKey, acwr })
  history.sort((a, b) => a.date.localeCompare(b.date))
  return history.slice(-120)
}
