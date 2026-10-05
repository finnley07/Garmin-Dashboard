import { localeTag, t } from '../i18n'

export function getTypeLabel(typeKey: string): string {
  const label = t(`activityTypes.${typeKey}`)
  if (label !== `activityTypes.${typeKey}`) {
    return label
  }
  return typeKey
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m} min ${s}s`
  return `${s}s`
}

export function formatDate(dateStr: string, tag = localeTag()): string {
  return new Date(dateStr).toLocaleDateString(tag, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatShortDate(date: Date, tag = localeTag()): string {
  return date.toLocaleDateString(tag, { day: '2-digit', month: 'short' })
}

export function formatPace(speedMps: number): string {
  if (!speedMps || speedMps <= 0) return '–'
  const secPerKm = 1000 / speedMps
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${sec.toString().padStart(2, '0')} min/km`
}

export function gramsToKg(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`
}

export function formatExerciseLabel(category: string, subCategory?: string): string {
  const source = subCategory ?? category
  return source
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatTrainingEffect(label?: string): string {
  if (!label) return '–'
  return label
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatNumber(n: number, decimals = 0, tag = localeTag()): string {
  return n.toLocaleString(tag, { maximumFractionDigits: decimals })
}
