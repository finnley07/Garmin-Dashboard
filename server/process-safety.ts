import { closeGarminSession, isPipeError } from './garmin-session.js'
import { logger } from './logger.js'

/**
 * The bundled Garmin MCP server (spawned via `npx @nicolasvegam/garmin-connect-mcp`)
 * occasionally tries to write a response after we have already torn down its
 * stdio pipes – an idle-timeout close, a forced session reset from a config
 * save, or a race during "sync again" where a new session starts while the old
 * one is still shutting down. That failure surfaces as an EPIPE deep inside the
 * MCP SDK's own transport code, in a dependency we do not control. Node treats
 * an unhandled EventEmitter 'error' as fatal by default, which takes the whole
 * dashboard server down for something that is harmless and already
 * recoverable – the next sync just opens a fresh child process.
 *
 * Only broken-pipe style I/O errors are swallowed here, and the (now clearly
 * stale) Garmin session is reset so the next request starts clean instead of
 * reusing a connection whose child process may already be gone. Everything
 * else still crashes the process exactly like Node's own default handling –
 * blanket-suppressing uncaught exceptions would hide real bugs.
 */
export function installBrokenPipeGuard(): void {
  const handleBrokenPipe = (source: string, error: unknown): boolean => {
    if (!isPipeError(error)) return false

    logger.warn(
      `Ignoring a broken pipe from a child process (${source}) - resetting the Garmin session`,
      error instanceof Error ? error.message : error,
    )
    void closeGarminSession({ force: true }).catch(() => {})
    return true
  }

  process.on('uncaughtException', (error) => {
    if (handleBrokenPipe('uncaughtException', error)) return
    logger.error('Uncaught exception', error)
    process.exit(1)
  })

  process.on('unhandledRejection', (reason) => {
    if (handleBrokenPipe('unhandledRejection', reason)) return
    logger.error('Unhandled promise rejection', reason)
  })
}
