import type { DashboardData, GarminActivity } from '../types/garmin'
import { computeWeeklyTrends } from './activityStats'

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const content = rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportActivitiesCsv(activities: GarminActivity[]) {
  downloadCsv(`garmin-activities-${new Date().toISOString().slice(0, 10)}.csv`, [
    [
      'activityId',
      'date',
      'name',
      'type',
      'distanceKm',
      'durationMin',
      'calories',
      'avgHr',
      'trainingLoad',
      'aerobicEffect',
      'anaerobicEffect',
    ],
    ...activities.map((a) => [
      a.activityId,
      a.startTimeLocal,
      a.activityName,
      a.activityType?.typeKey ?? '',
      Math.round(((a.distance ?? 0) / 1000) * 100) / 100,
      Math.round((a.duration ?? 0) / 60),
      a.calories ?? '',
      a.averageHR ?? '',
      a.activityTrainingLoad ?? '',
      a.aerobicTrainingEffect ?? '',
      a.anaerobicTrainingEffect ?? '',
    ]),
  ])
}

export function exportWeeklyStatsCsv(activities: GarminActivity[]) {
  const weeks = computeWeeklyTrends(activities, 12)
  downloadCsv(`garmin-weekly-${new Date().toISOString().slice(0, 10)}.csv`, [
    ['weekStart', 'sessions', 'km', 'hours', 'load'],
    ...weeks.map((week) => [
      week.start,
      week.sessions,
      Math.round(week.km * 10) / 10,
      Math.round(week.hours * 10) / 10,
      Math.round(week.load),
    ]),
  ])
}

export function exportDashboardJson(data: DashboardData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `garmin-dashboard-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function parseActivitiesCsv(text: string): Partial<GarminActivity>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase())
  const idx = (name: string) => headers.indexOf(name)

  return lines.slice(1).map((line, index) => {
    const cols = line.split(',')
    const date = cols[idx('date')] ?? cols[1] ?? ''
    const name = cols[idx('name')] ?? cols[2] ?? `Imported ${index + 1}`
    const type = cols[idx('type')] ?? cols[3] ?? 'other'
    const distanceKm = Number(cols[idx('distancekm')] ?? cols[4] ?? 0)
    const durationMin = Number(cols[idx('durationmin')] ?? cols[5] ?? 0)

    return {
      activityId: Date.now() + index,
      activityName: name,
      startTimeLocal: date,
      activityType: { typeKey: type },
      distance: distanceKm * 1000,
      duration: durationMin * 60,
      calories: 0,
    }
  })
}
