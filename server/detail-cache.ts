import fs from 'fs/promises'
import path from 'path'
import { getAppConfig } from './app-config.js'
import type { ActivityDetail } from './types.js'

const CACHE_FILE = path.join(process.cwd(), 'data', 'activity-details-cache.json')

function getCacheTtlMs(): number {
  return getAppConfig().detailCacheDays * 24 * 60 * 60 * 1000
}

interface CacheFile {
  [activityId: string]: {
    fetchedAt: string
    data: ActivityDetail
  }
}

const memory = new Map<number, ActivityDetail>()

export async function getCachedDetail(activityId: number): Promise<ActivityDetail | null> {
  const mem = memory.get(activityId)
  if (mem) return mem

  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    const file = JSON.parse(raw) as CacheFile
    const entry = file[String(activityId)]
    if (!entry) return null

    if (Date.now() - new Date(entry.fetchedAt).getTime() > getCacheTtlMs()) {
      return null
    }

    memory.set(activityId, entry.data)
    return entry.data
  } catch {
    return null
  }
}

export async function saveDetailCache(
  activityId: number,
  data: ActivityDetail,
): Promise<void> {
  memory.set(activityId, data)

  let file: CacheFile = {}
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    file = JSON.parse(raw) as CacheFile
  } catch {
    // new cache file
  }

  file[String(activityId)] = { fetchedAt: new Date().toISOString(), data }

  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify(file), 'utf-8')
}
