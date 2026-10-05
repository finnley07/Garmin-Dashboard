import { inject, ref, watch, type App, type InjectionKey } from 'vue'
import de from './de'
import en from './en'
import type { Locale, MessageTree } from './types'

const STORAGE_KEY = 'garmin-dash-locale'

const messages: Record<Locale, MessageTree> = { de, en }

const localeRef = ref<Locale>(detectLocale())

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'de' || stored === 'en') return stored
  return 'en'
}

function getNested(tree: MessageTree, path: string): string | undefined {
  const value = path.split('.').reduce<MessageTree | string | undefined>((node, key) => {
    if (typeof node === 'string' || node === undefined) return undefined
    return node[key]
  }, tree)
  return typeof value === 'string' ? value : undefined
}

export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = localeRef.value,
): string {
  let text = getNested(messages[locale], key) ?? getNested(messages.en, key) ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function localeTag(locale: Locale = localeRef.value): string {
  return locale === 'de' ? 'de-DE' : 'en-US'
}

export function setLocale(locale: Locale) {
  localeRef.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

watch(
  localeRef,
  (locale) => {
    document.documentElement.lang = locale
  },
  { immediate: true },
)

export interface I18nContext {
  locale: typeof localeRef
  t: typeof t
  localeTag: typeof localeTag
  setLocale: typeof setLocale
}

const i18nKey: InjectionKey<I18nContext> = Symbol('i18n')

export function useI18n(): I18nContext {
  const ctx = inject(i18nKey)
  if (!ctx) throw new Error('useI18n() called without i18n plugin')
  return ctx
}

export function createI18nPlugin() {
  return {
    install(app: App) {
      app.provide(i18nKey, {
        locale: localeRef,
        t,
        localeTag,
        setLocale,
      })
    },
  }
}
