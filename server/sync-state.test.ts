import { describe, expect, it, beforeEach } from 'vitest'
import {
  beginSync,
  finishSync,
  getSyncProgress,
  resetSyncStateForTests,
  updateSyncPhase,
} from './sync-state.js'

describe('sync-state', () => {
  beforeEach(() => {
    resetSyncStateForTests()
  })

  it('starts idle', () => {
    expect(getSyncProgress().running).toBe(false)
    expect(getSyncProgress().phase).toBe('idle')
  })

  it('tracks phases while running', () => {
    beginSync('manual')
    updateSyncPhase('activities', 40, 'Fetching activities…')

    const progress = getSyncProgress()
    expect(progress.running).toBe(true)
    expect(progress.phase).toBe('activities')
    expect(progress.progress).toBe(40)
    expect(progress.triggeredBy).toBe('manual')
  })

  it('finishes with success state', () => {
    beginSync('auto')
    finishSync(true)

    const progress = getSyncProgress()
    expect(progress.running).toBe(false)
    expect(progress.phase).toBe('done')
    expect(progress.progress).toBe(100)
    expect(progress.lastSuccessAt).toBeTruthy()
  })

  it('records errors on failure', () => {
    beginSync('startup')
    finishSync(false, 'Garmin login failed')

    const progress = getSyncProgress()
    expect(progress.phase).toBe('error')
    expect(progress.lastError).toBe('Garmin login failed')
  })
})
