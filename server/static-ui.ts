import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Express } from 'express'
import express from 'express'
import { logger } from './logger.js'

const distDir = path.join(process.cwd(), 'dist')

export function hasProductionBuild(): boolean {
  return existsSync(path.join(distDir, 'index.html'))
}

export function configureStaticUi(app: Express): boolean {
  if (!hasProductionBuild()) {
    logger.warn(
      'No production build in dist/. Run "npm run build" or use "npm run dev" for development.',
    )
    return false
  }

  app.use(express.static(distDir, { index: false, maxAge: '1h' }))

  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'))
  })

  logger.info(`Serving dashboard UI from ${distDir}`)
  return true
}
