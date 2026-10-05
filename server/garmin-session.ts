import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { getAppConfig } from './app-config.js'
import { logger } from './logger.js'

export type CallToolFn = <T>(
  name: string,
  args?: Record<string, unknown>,
) => Promise<T | null>

const IDLE_CLOSE_MS = () => getAppConfig().garminSessionIdleMinutes * 60 * 1000

let client: Client | null = null
let callFn: CallToolFn | null = null
let connectPromise: Promise<CallToolFn> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let activeOperations = 0
let pendingClose = false
let sessionGeneration = 0
let sessionChain: Promise<unknown> = Promise.resolve()

export function isPipeError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as NodeJS.ErrnoException).code
  const message = String((error as Error).message ?? '').toLowerCase()
  return code === 'EPIPE' || code === 'ERR_STREAM_DESTROYED' || message.includes('broken pipe')
}

function enqueueSessionWork<T>(work: () => Promise<T>): Promise<T> {
  const next = sessionChain.then(work, work)
  sessionChain = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

function cancelIdleClose() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = null
}

function scheduleIdleClose() {
  cancelIdleClose()
  idleTimer = setTimeout(() => {
    void closeGarminSession()
  }, IDLE_CLOSE_MS())
}

async function createConnection(generation: number): Promise<CallToolFn> {
  const email = process.env.GARMIN_EMAIL
  const password = process.env.GARMIN_PASSWORD

  if (!email || !password) {
    throw new Error('Garmin credentials missing. Add them in Settings (gear icon).')
  }

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@nicolasvegam/garmin-connect-mcp'],
    env: {
      ...process.env,
      GARMIN_EMAIL: email,
      GARMIN_PASSWORD: password,
    } as Record<string, string>,
  })

  const newClient = new Client(
    { name: 'garmin-dashboard', version: '1.0.0' },
    { capabilities: {} },
  )

  await newClient.connect(transport)

  if (generation !== sessionGeneration) {
    try {
      await newClient.close()
    } catch {
      // ignore stale connection cleanup
    }
    throw new Error('Garmin session was replaced during connect')
  }

  client = newClient

  const call: CallToolFn = async (name, args) => {
    try {
      const result = await newClient.callTool({ name, arguments: args ?? {} })

      if (result.isError) {
        const content = result.content as Array<{ type: string; text?: string }>
        const errText = content.find((block) => block.type === 'text' && block.text)?.text?.trim()
        logger.warn(`Garmin tool ${name} failed`, errText || 'unknown error')
        return null
      }

      const content = result.content as Array<{ type: string; text?: string }>
      const textBlock = content.find((block) => block.type === 'text' && block.text)
      if (!textBlock?.text) return null

      try {
        return JSON.parse(textBlock.text)
      } catch {
        return null
      }
    } catch (error) {
      if (isPipeError(error)) {
        logger.warn(`Garmin MCP connection lost during ${name}, reconnecting on next request`)
        await closeGarminSessionInternal(true)
      }
      throw error
    }
  }

  callFn = call
  return call
}

async function ensureConnected(): Promise<CallToolFn> {
  if (callFn) return callFn

  if (!connectPromise) {
    const generation = sessionGeneration
    connectPromise = createConnection(generation)
      .catch(async (error) => {
        await closeGarminSessionInternal(true)
        throw error
      })
      .finally(() => {
        connectPromise = null
      })
  }

  return connectPromise
}

async function closeGarminSessionInternal(force: boolean): Promise<void> {
  cancelIdleClose()
  sessionGeneration++

  const activeClient = client
  client = null
  callFn = null
  connectPromise = null

  if (!activeClient) return

  try {
    await activeClient.close()
  } catch (error) {
    if (!force && !isPipeError(error)) {
      logger.warn('Garmin session close failed', error instanceof Error ? error.message : error)
    }
  }
}

export async function closeGarminSession(options?: { force?: boolean }): Promise<void> {
  return enqueueSessionWork(async () => {
    if (!options?.force && activeOperations > 0) {
      pendingClose = true
      return
    }

    pendingClose = false
    await closeGarminSessionInternal(Boolean(options?.force))
  })
}

export async function withGarminSession<T>(
  fn: (call: CallToolFn) => Promise<T>,
): Promise<T> {
  return enqueueSessionWork(async () => {
    activeOperations++
    cancelIdleClose()

    try {
      if (pendingClose) {
        await closeGarminSessionInternal(true)
        pendingClose = false
      }

      const call = await ensureConnected()
      return await fn(call)
    } finally {
      activeOperations--
      if (activeOperations === 0) {
        if (pendingClose) {
          pendingClose = false
          await closeGarminSessionInternal(true)
        } else {
          scheduleIdleClose()
        }
      }
    }
  })
}

process.on('SIGINT', () => void closeGarminSession({ force: true }))
process.on('SIGTERM', () => void closeGarminSession({ force: true }))
