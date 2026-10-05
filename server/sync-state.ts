import type { DashboardData } from './types.js'

export interface SyncProgress {
  running: boolean
  phase: string
  progress: number
  message: string
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
  triggeredBy: 'manual' | 'auto' | 'startup' | null
}

const idle: SyncProgress = {
  running: false,
  phase: 'idle',
  progress: 0,
  message: '',
  error: null,
  startedAt: null,
  finishedAt: null,
  lastSuccessAt: null,
  lastError: null,
  triggeredBy: null,
}

let state: SyncProgress = { ...idle }
let syncLock: Promise<DashboardData> | null = null

export function getSyncProgress(): SyncProgress {
  return { ...state }
}

export function setSyncProgress(patch: Partial<SyncProgress>) {
  state = { ...state, ...patch }
}

export function resetSyncProgressError() {
  state = { ...state, error: null, lastError: state.lastError }
}

export function beginSync(triggeredBy: SyncProgress['triggeredBy']) {
  state = {
    ...state,
    running: true,
    phase: 'starting',
    progress: 0,
    message: 'Sync starting…',
    error: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    triggeredBy,
  }
}

export function finishSync(success: boolean, errorMessage?: string) {
  const now = new Date().toISOString()
  state = {
    ...state,
    running: false,
    phase: success ? 'done' : 'error',
    progress: success ? 100 : state.progress,
    message: success ? 'Sync complete' : errorMessage ?? 'Sync failed',
    error: success ? null : errorMessage ?? 'Sync failed',
    finishedAt: now,
    lastSuccessAt: success ? now : state.lastSuccessAt,
    lastError: success ? state.lastError : errorMessage ?? state.lastError,
    triggeredBy: null,
  }
}

export function updateSyncPhase(phase: string, progress: number, message: string) {
  if (!state.running) return
  state = {
    ...state,
    phase,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    message,
  }
}

export function getSyncLock(): Promise<DashboardData> | null {
  return syncLock
}

export function setSyncLock(promise: Promise<DashboardData> | null) {
  syncLock = promise
}

/** Test helper – resets in-memory sync progress state. */
export function resetSyncStateForTests() {
  state = { ...idle }
  syncLock = null
}
