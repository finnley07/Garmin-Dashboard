import { describe, expect, it } from 'vitest'
import { restoreBackupBundle } from './data-backup.js'

describe('restoreBackupBundle', () => {
  it('rejects invalid backup format', async () => {
    await expect(restoreBackupBundle({ version: 2, exportedAt: '', files: {} } as never)).rejects.toThrow(
      'Invalid backup format',
    )
  })

  it('rejects missing files object', async () => {
    await expect(
      restoreBackupBundle({ version: 1, exportedAt: new Date().toISOString(), files: null } as never),
    ).rejects.toThrow('Invalid backup format')
  })
})
