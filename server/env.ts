import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadAndApplyAppConfigSync } from './app-config.js'
import { logger } from './logger.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = resolve(projectRoot, '.env')

const result = config({ path: envPath })

if (result.error && (result.error as NodeJS.ErrnoException).code !== 'ENOENT') {
  logger.warn(`Could not load .env (${envPath})`, result.error.message)
}

loadAndApplyAppConfigSync()

export const ENV_FILE = envPath
