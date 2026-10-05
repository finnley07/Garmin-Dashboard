import { existsSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const distIndex = path.join(process.cwd(), 'dist', 'index.html')
const forceBuild = process.argv.includes('--force')

/** Newest mtime of a file or of any file nested in a directory (a directory's own mtime ignores nested edits). */
function newestMtime(full) {
  const stat = statSync(full)
  if (!stat.isDirectory()) return stat.mtimeMs
  let newest = stat.mtimeMs
  for (const name of readdirSync(full)) {
    newest = Math.max(newest, newestMtime(path.join(full, name)))
  }
  return newest
}

function sourceIsNewer() {
  if (!existsSync(distIndex)) return true

  const distTime = statSync(distIndex).mtimeMs
  const srcDirs = ['src', 'server', 'index.html', 'vite.config.ts']
  for (const entry of srcDirs) {
    const full = path.join(process.cwd(), entry)
    if (!existsSync(full)) continue
    if (newestMtime(full) > distTime) return true
  }
  return false
}

if (forceBuild || sourceIsNewer()) {
  console.log('[garmin-dash] Building frontend…')
  const result = spawnSync('npm', ['run', 'build-only'], {
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  console.log('[garmin-dash] Build complete.')
}
