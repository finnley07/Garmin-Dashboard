import type { PlannedRace, RaceDistanceKey } from './types.js'

export interface RacePredictionItem {
  distance: RaceDistanceKey
  timeSeconds: number
}

/** Garmin's race-predictions endpoint uses these exact field names - flat seconds, not nested objects. */
const RACE_PREDICTION_FIELDS: Record<Exclude<RaceDistanceKey, 'other'>, string> = {
  '5k': 'time5K',
  '10k': 'time10K',
  halfMarathon: 'timeHalfMarathon',
  marathon: 'timeMarathon',
}

export function parseRacePredictions(
  raw: Record<string, unknown> | null,
): RacePredictionItem[] {
  if (!raw) return []

  const entries: RacePredictionItem[] = []
  for (const [distance, field] of Object.entries(RACE_PREDICTION_FIELDS) as [
    Exclude<RaceDistanceKey, 'other'>,
    string,
  ][]) {
    const seconds = raw[field]
    if (typeof seconds === 'number' && seconds > 0) {
      entries.push({ distance, timeSeconds: seconds })
    }
  }
  return entries
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.round(totalSec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDelta(deltaSeconds: number): string {
  const sign = deltaSeconds <= 0 ? '-' : '+'
  const abs = Math.abs(Math.round(deltaSeconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${sign}${m}:${String(s).padStart(2, '0')}`
}

/**
 * Compact line for the Claude prompt: the nearest upcoming planned race,
 * with days-to-go and how the current Garmin prediction compares to the
 * goal time. Lets the coach reason about tapering/peaking instead of only
 * ever looking at today's numbers - without this the AI has no idea a race
 * is coming up at all.
 */
export function compactRaceLine(
  plannedRaces: PlannedRace[],
  racePredictions: Record<string, unknown> | null,
  today = new Date(),
): string {
  const todayStart = new Date(today.toISOString().slice(0, 10))

  const next = plannedRaces
    .filter((race) => race.name && race.date)
    .map((race) => ({
      race,
      daysUntil: Math.ceil(
        (new Date(race.date).getTime() - todayStart.getTime()) / 86_400_000,
      ),
    }))
    .filter((entry) => entry.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)[0]

  if (!next) return ''

  const prediction =
    next.race.distance === 'other'
      ? null
      : parseRacePredictions(racePredictions).find(
          (p) => p.distance === next.race.distance,
        )

  const parts = [`${next.race.name} in ${next.daysUntil}d`, `Distance=${next.race.distance}`]

  if (next.race.targetTimeSeconds) {
    parts.push(`Target=${formatDuration(next.race.targetTimeSeconds)}`)
  }
  if (prediction) {
    parts.push(`Predicted=${formatDuration(prediction.timeSeconds)}`)
    if (next.race.targetTimeSeconds) {
      parts.push(
        `Delta=${formatDelta(prediction.timeSeconds - next.race.targetTimeSeconds)}`,
      )
    }
  }

  return `Race: ${parts.join(' ')}`
}
