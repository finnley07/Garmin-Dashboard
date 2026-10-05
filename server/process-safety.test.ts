import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./garmin-session.js', () => ({
  isPipeError: (error: unknown) => {
    if (!error || typeof error !== 'object') return false
    const err = error as NodeJS.ErrnoException
    const message = String((error as Error).message ?? '').toLowerCase()
    return err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED' || message.includes('broken pipe')
  },
  closeGarminSession: vi.fn(async () => undefined),
}))

const { installBrokenPipeGuard } = await import('./process-safety.js')
const { closeGarminSession } = await import('./garmin-session.js')

describe('installBrokenPipeGuard', () => {
  const originalExit = process.exit

  beforeEach(() => {
    process.removeAllListeners('uncaughtException')
    process.removeAllListeners('unhandledRejection')
    vi.mocked(closeGarminSession).mockClear()
    process.exit = vi.fn() as never
    installBrokenPipeGuard()
  })

  afterEach(() => {
    process.removeAllListeners('uncaughtException')
    process.removeAllListeners('unhandledRejection')
    process.exit = originalExit
  })

  it('swallows an EPIPE uncaught exception and resets the Garmin session', () => {
    const error = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' })

    process.emit('uncaughtException', error)

    expect(process.exit).not.toHaveBeenCalled()
    expect(closeGarminSession).toHaveBeenCalledWith({ force: true })
  })

  it('swallows an EPIPE-style unhandled rejection', () => {
    const error = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' })

    process.emit('unhandledRejection', error, Promise.resolve())

    expect(process.exit).not.toHaveBeenCalled()
    expect(closeGarminSession).toHaveBeenCalledWith({ force: true })
  })

  it('still exits on an unrelated uncaught exception', () => {
    process.emit('uncaughtException', new TypeError('something else entirely'))

    expect(process.exit).toHaveBeenCalledWith(1)
    expect(closeGarminSession).not.toHaveBeenCalled()
  })

  it('does not reset the session for an unrelated unhandled rejection', () => {
    process.emit('unhandledRejection', new Error('unrelated failure'), Promise.resolve())

    expect(closeGarminSession).not.toHaveBeenCalled()
  })
})
