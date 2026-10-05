<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import InfoTooltip from './InfoTooltip.vue'
import { useI18n } from '../i18n'

const props = withDefaults(
  defineProps<{
    title: string
    summary?: string
    infoKey?: string
    defaultOpen?: boolean
    storageKey?: string
  }>(),
  { defaultOpen: false },
)

const { t } = useI18n()
const open = ref(props.defaultOpen)
const wasOpened = ref(props.defaultOpen)

onMounted(() => {
  if (!props.storageKey) return
  const stored = localStorage.getItem(`dash-section-${props.storageKey}`)
  if (stored === '1') {
    open.value = true
    wasOpened.value = true
  } else if (stored === '0') open.value = false
})

function toggle() {
  open.value = !open.value
  if (open.value) wasOpened.value = true
  if (props.storageKey) {
    localStorage.setItem(`dash-section-${props.storageKey}`, open.value ? '1' : '0')
  }
}

function expand() {
  open.value = true
  wasOpened.value = true
  if (props.storageKey) localStorage.setItem(`dash-section-${props.storageKey}`, '1')
}

function collapse() {
  open.value = false
  if (props.storageKey) localStorage.setItem(`dash-section-${props.storageKey}`, '0')
}

defineExpose({ expand, collapse, open })
</script>

<template>
  <section class="collapse-section" :class="{ open }">
    <div class="collapse-header">
      <button
        type="button"
        class="collapse-toggle"
        :aria-expanded="open"
        @click="toggle"
      >
        <span class="collapse-mark" aria-hidden="true" />
        <span class="collapse-title">{{ title }}</span>
        <span v-if="summary" class="collapse-summary">{{ summary }}</span>
        <AppIcon name="chevron-right" class="collapse-chevron" size="sm" />
        <span class="sr-only">{{ open ? t('dashboard.collapse') : t('dashboard.expand') }}</span>
      </button>
      <InfoTooltip v-if="infoKey" :info-key="infoKey" />
    </div>
    <div v-if="wasOpened" v-show="open" class="collapse-body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.collapse-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  transition: border-color var(--transition-fast);
  content-visibility: auto;
  contain-intrinsic-size: auto 72px;
}

.collapse-section.open {
  border-color: var(--border-hover);
}

.collapse-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  padding: 0.85rem 1.1rem;
}

.collapse-toggle {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1;
  min-width: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background var(--transition-fast);
  border-radius: var(--radius-sm);
}

.collapse-header:hover .collapse-toggle {
  background: rgba(255, 255, 255, 0.03);
}

.collapse-mark {
  width: 3px;
  height: 1.1em;
  border-radius: 2px;
  background: var(--accent);
  flex-shrink: 0;
}

.collapse-title {
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text);
}

.collapse-summary {
  flex: 1;
  min-width: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
  font-weight: 500;
}

.collapse-section:not(.open) .collapse-summary {
  color: var(--text-muted);
  opacity: 1;
}

.collapse-chevron {
  color: var(--accent);
  flex-shrink: 0;
  transition: transform var(--transition-smooth);
}

.collapse-section.open .collapse-chevron {
  transform: rotate(90deg);
}

.collapse-body {
  padding: 0 1rem 1rem;
}

.collapse-body :deep(> *) {
  margin-top: 0;
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
