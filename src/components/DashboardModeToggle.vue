<script setup lang="ts">
import { useI18n } from '../i18n'

defineProps<{
  showDetails: boolean
}>()

const emit = defineEmits<{
  'update:showDetails': [value: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="mode-bar">
    <p class="mode-copy">{{ showDetails ? t('dashboard.mode.detailsHint') : t('dashboard.mode.summaryHint') }}</p>
    <div class="mode-toggle" role="group" :aria-label="t('dashboard.mode.label')">
      <button
        type="button"
        class="mode-option"
        :class="{ active: !showDetails }"
        @click="emit('update:showDetails', false)"
      >
        {{ t('dashboard.mode.summary') }}
      </button>
      <button
        type="button"
        class="mode-switch"
        role="switch"
        :aria-checked="showDetails"
        :aria-label="t('dashboard.mode.toggle')"
        @click="emit('update:showDetails', !showDetails)"
      >
        <span class="mode-knob" :class="{ on: showDetails }" />
      </button>
      <button
        type="button"
        class="mode-option"
        :class="{ active: showDetails }"
        @click="emit('update:showDetails', true)"
      >
        {{ t('dashboard.mode.details') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.mode-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.85rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.mode-copy {
  margin: 0;
  flex: 1;
  min-width: min(100%, 220px);
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.mode-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
}

.mode-option {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0.25rem 0.15rem;
  transition: color 0.15s ease;
}

.mode-option.active {
  color: var(--accent);
}

.mode-option:hover {
  color: var(--text);
}

.mode-switch {
  position: relative;
  width: 46px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-elevated);
  cursor: pointer;
  padding: 0;
  transition: border-color 0.15s ease;
}

.mode-switch:hover {
  border-color: var(--border-hover);
}

.mode-switch:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.35);
  outline-offset: 2px;
}

.mode-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: transform 0.2s ease, background 0.2s ease;
}

.mode-knob.on {
  transform: translateX(20px);
  background: var(--accent);
}
</style>
