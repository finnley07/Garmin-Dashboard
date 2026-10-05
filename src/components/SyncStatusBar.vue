<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchSyncProgress } from '../api/garmin'
import type { SyncProgress } from '../types/appConfig'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  syncing?: boolean
  onRetry?: () => void
}>()

const { t } = useI18n()
const progress = ref<SyncProgress | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startPolling(intervalMs: number) {
  stopPolling()
  timer = setInterval(() => {
    void poll()
  }, intervalMs)
}

async function poll() {
  if (document.visibilityState === 'hidden') return

  try {
    progress.value = await fetchSyncProgress()
  } catch {
    return
  }

  if (progress.value?.running) {
    if (!timer) startPolling(1200)
    return
  }

  stopPolling()
}

watch(
  () => props.syncing,
  (syncing) => {
    if (syncing) {
      void poll()
      startPolling(1200)
    }
  },
)

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    stopPolling()
    return
  }
  if (props.syncing || progress.value?.running || progress.value?.lastError) {
    void poll()
    if (progress.value?.running || props.syncing) startPolling(1200)
  }
}

onMounted(() => {
  void poll()
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <div
    v-if="progress && (progress.running || progress.lastError)"
    class="sync-bar"
    :class="{ error: progress.lastError && !progress.running }"
  >
    <template v-if="progress.running">
      <AppIcon name="bolt" size="sm" />
      <div class="sync-main">
        <span>{{ progress.message || t('sync.syncing') }}</span>
        <div class="track"><div class="fill" :style="{ width: `${progress.progress}%` }" /></div>
      </div>
      <span class="pct">{{ progress.progress }}%</span>
    </template>
    <template v-else-if="progress.lastError">
      <AppIcon name="warning" size="sm" />
      <span class="err-text">{{ progress.lastError }}</span>
      <button v-if="onRetry" type="button" class="retry" @click="onRetry">{{ t('sync.retry') }}</button>
    </template>
  </div>
</template>

<style scoped>
.sync-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 clamp(1rem, 2.5vw, 2.5rem) 0.75rem;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border-hover);
  font-size: 0.82rem;
}

.sync-bar.error {
  background: var(--surface);
  border-color: rgba(239, 68, 68, 0.35);
}

.sync-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--accent);
}

.pct {
  font-family: var(--font-mono);
  color: var(--text-muted);
  font-size: 0.75rem;
}

.err-text {
  flex: 1;
  color: #fecaca;
}

.retry {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  font: inherit;
}
</style>
