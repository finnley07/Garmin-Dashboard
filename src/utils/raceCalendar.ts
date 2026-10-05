import type { PlannedRace, RaceDistanceKey } from '../types/garmin'
import type { RacePredictionItem } from './wellness'

export interface RaceCalendarEntry {
  race: PlannedRace
  daysUntil: number
  predictionLabel: string | null
  deltaSeconds: number | null
  onTrack: boolean | null
}

function parseTimeLabel(label: string): number | null {
  const parts = label.split(':').map(Number)
  if (parts.some((part) => !Number.isFinite(part))) return null
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!
  return null
}

function findPrediction(
  distance: RaceDistanceKey,
  predictions: RacePredictionItem[],
): RacePredictionItem | null {
  if (distance === 'other') return null
  return predictions.find((item) => item.distance === distance) ?? null
}

export function buildRaceCalendar(
  plannedRaces: PlannedRace[],
  predictions: RacePredictionItem[],
  today = new Date(),
): RaceCalendarEntry[] {
  const todayStart = new Date(today.toISOString().slice(0, 10))

  return [...plannedRaces]
    .filter((race) => race.name && race.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((race) => {
      const raceDate = new Date(race.date)
      const daysUntil = Math.ceil((raceDate.getTime() - todayStart.getTime()) / 86_400_000)
      const prediction = findPrediction(race.distance, predictions)
      const predictionSeconds = prediction ? parseTimeLabel(prediction.timeLabel) : null
      const deltaSeconds =
        predictionSeconds !== null && race.targetTimeSeconds
          ? predictionSeconds - race.targetTimeSeconds
          : null

      return {
        race,
        daysUntil,
        predictionLabel: prediction?.timeLabel ?? null,
        deltaSeconds,
        onTrack: deltaSeconds === null ? null : deltaSeconds <= 0,
      }
    })
}

export function raceDistanceLabel(
  distance: RaceDistanceKey,
  t: (key: string) => string,
): string {
  return t(`raceCalendar.distances.${distance}`)
}

export function formatTimeDelta(totalSec: number): string {
  const sign = totalSec <= 0 ? '−' : '+'
  const abs = Math.abs(Math.round(totalSec))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const min = m % 60
    return `${sign}${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${sign}${m}:${String(s).padStart(2, '0')}`
}

export function formatRaceTarget(seconds: number | null): string {
  if (!seconds) return '–'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
