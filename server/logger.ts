type LogLevel = 'info' | 'warn' | 'error'

function write(level: LogLevel, message: string, ...details: unknown[]) {
  const line = `[garmin-dash] ${message}`
  if (level === 'info') console.log(line, ...details)
  else if (level === 'warn') console.warn(line, ...details)
  else console.error(line, ...details)
}

export const logger = {
  info: (message: string, ...details: unknown[]) => write('info', message, ...details),
  warn: (message: string, ...details: unknown[]) => write('warn', message, ...details),
  error: (message: string, ...details: unknown[]) => write('error', message, ...details),
}
