import { withGarminSession } from './garmin-session.js'

export interface RoutePoint {
  lat: number
  lng: number
}

export interface ActivityRouteResult {
  activityId: number
  points: RoutePoint[]
  source: 'polyline' | 'samples' | 'none'
}

function decodeGooglePolyline(encoded: string): RoutePoint[] {
  const points: RoutePoint[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

function extractPolylineString(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>

  const candidates = [
    row.polyline,
    row.summaryPolyline,
    row.geoPolylineDTO,
    row.metadataDTO,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 8) return candidate
    if (candidate && typeof candidate === 'object') {
      const obj = candidate as Record<string, unknown>
      if (typeof obj.polyline === 'string') return obj.polyline
      if (typeof obj.summaryPolyline === 'string') return obj.summaryPolyline
    }
  }

  return null
}

function extractSamplePoints(raw: unknown): RoutePoint[] {
  if (!raw || typeof raw !== 'object') return []
  const row = raw as Record<string, unknown>
  const samples = row.samples ?? row.geoSamples ?? row.trackPoints
  if (!Array.isArray(samples)) return []

  return samples
    .map((sample) => {
      const s = sample as Record<string, unknown>
      const lat = Number(s.latitude ?? s.lat ?? s.startLatitude)
      const lng = Number(s.longitude ?? s.lng ?? s.startLongitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    })
    .filter((point): point is RoutePoint => point !== null)
}

export async function fetchActivityRoute(activityId: number): Promise<ActivityRouteResult> {
  const raw = await withGarminSession(async (call) =>
    call<Record<string, unknown>>('get_activity', { activityId }),
  )

  if (!raw) {
    return { activityId, points: [], source: 'none' }
  }

  const polyline = extractPolylineString(raw)
  if (polyline) {
    const points = decodeGooglePolyline(polyline)
    if (points.length >= 2) {
      return { activityId, points, source: 'polyline' }
    }
  }

  const samples = extractSamplePoints(raw)
  if (samples.length >= 2) {
    return { activityId, points: samples, source: 'samples' }
  }

  return { activityId, points: [], source: 'none' }
}
