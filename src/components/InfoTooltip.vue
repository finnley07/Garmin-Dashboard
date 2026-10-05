<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  infoKey: string
}>()

const { t } = useI18n()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const popupStyle = ref<Record<string, string>>({})
const placement = ref<'above' | 'below'>('above')

const text = () => {
  const key = `info.${props.infoKey}`
  const value = t(key)
  return value === key ? '' : value
}

async function updatePosition() {
  if (!open.value || !root.value) return

  const trigger = root.value.querySelector('.info-btn') as HTMLElement | null
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const maxWidth = Math.min(320, window.innerWidth - 24)
  const half = maxWidth / 2
  const centerX = Math.max(12 + half, Math.min(window.innerWidth - 12 - half, rect.left + rect.width / 2))

  const spaceAbove = rect.top
  const spaceBelow = window.innerHeight - rect.bottom
  const showBelow = spaceAbove < 140 && spaceBelow > spaceAbove

  placement.value = showBelow ? 'below' : 'above'

  popupStyle.value = {
    position: 'fixed',
    zIndex: '10000',
    top: showBelow ? `${rect.bottom + 10}px` : `${rect.top - 10}px`,
    left: `${centerX}px`,
    transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    maxWidth: `${maxWidth}px`,
  }
}

async function show() {
  if (!text()) return
  open.value = true
  await nextTick()
  updatePosition()
}

function hide() {
  open.value = false
}

async function toggle(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (!text()) return
  open.value = !open.value
  if (open.value) {
    await nextTick()
    updatePosition()
  }
}

function stopParentActivation(event: Event) {
  event.preventDefault()
  event.stopPropagation()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    void toggle(event)
  }
  if (event.key === 'Escape') hide()
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value || !root.value) return
  if (!root.value.contains(event.target as Node)) {
    open.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) void nextTick().then(updatePosition)
})

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <span
    v-if="text()"
    ref="root"
    class="info-tooltip-wrap"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <span
      class="info-btn"
      role="button"
      tabindex="0"
      :aria-label="t('info.learnMore')"
      :aria-expanded="open"
      @click="toggle"
      @mousedown="stopParentActivation"
      @pointerdown="stopParentActivation"
      @keydown="onTriggerKeydown"
    >
      <AppIcon name="info" size="xs" />
    </span>

    <Teleport to="body">
      <div
        v-if="open"
        class="info-popup"
        :class="placement"
        :style="popupStyle"
        role="tooltip"
      >
        {{ text() }}
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.info-tooltip-wrap {
  display: inline-flex;
  align-items: center;
  position: relative;
  vertical-align: middle;
  flex-shrink: 0;
}

.info-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  cursor: help;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.info-btn:hover,
.info-btn:focus-visible,
.info-tooltip-wrap:hover .info-btn {
  background: var(--surface-elevated);
  border-color: var(--border-hover);
  outline: none;
}

.info-btn:focus-visible {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
}
</style>
