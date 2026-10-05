<script setup lang="ts">
import { saveAppConfig } from '../api/garmin'
import { useI18n } from '../i18n'
import type { Locale } from '../i18n/types'

const { locale, t, setLocale } = useI18n()

const options: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
]

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value as Locale
  setLocale(value)
  void saveAppConfig({ language: value }).catch(() => {
    // offline or API unavailable – localStorage still updated via setLocale
  })
}
</script>

<template>
  <label class="lang-select">
    <span class="sr-only">{{ t('language.label') }}</span>
    <select :value="locale" :aria-label="t('language.label')" @change="onChange">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.lang-select select {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 0.5rem 0.65rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
