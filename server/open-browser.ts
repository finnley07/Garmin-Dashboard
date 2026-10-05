import { exec } from 'node:child_process'
import { logger } from './logger.js'

export function tryOpenBrowser(url: string): void {
  if (process.env.GARMIN_DASH_OPEN_BROWSER !== '1') return

  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`

  exec(command, (error) => {
    if (error) {
      logger.warn('Could not open browser automatically', error.message)
    }
  })
}
