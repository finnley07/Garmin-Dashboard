import { describe, expect, it, vi } from 'vitest'

const configState = { language: 'de' as 'de' | 'en' }

vi.mock('./app-config.js', () => ({
  getAppConfig: () => ({ language: configState.language }),
}))

const { tr } = await import('./lang.js')

describe('tr', () => {
  it('returns the German string when the app language is de', () => {
    configState.language = 'de'
    expect(tr('Hallo', 'Hello')).toBe('Hallo')
  })

  it('returns the English string when the app language is en', () => {
    configState.language = 'en'
    expect(tr('Hallo', 'Hello')).toBe('Hello')
  })
})
