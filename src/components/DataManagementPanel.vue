<script setup lang="ts">
import { ref } from 'vue'
import type { DashboardData } from '../types/garmin'
import type { BackupBundle } from '../types/appConfig'
import { downloadBackup, importActivities, restoreBackup } from '../api/garmin'
import { exportActivitiesCsv, exportWeeklyStatsCsv, exportDashboardJson, parseActivitiesCsv } from '../utils/exportCsv'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{ data: DashboardData | null }>()
const emit = defineEmits<{ restored: [] }>()

const { t } = useI18n()
const restoring = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

async function backup() {
  error.value = null
  message.value = null
  try {
    const bundle = await downloadBackup()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `garmin-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    message.value = t('data.backupDone')
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('data.backupError')
  }
}

async function onRestoreFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  restoring.value = true
  error.value = null
  message.value = null
  try {
    const text = await file.text()
    const bundle = JSON.parse(text) as BackupBundle
    const result = await restoreBackup(bundle)
    message.value = result.message
    emit('restored')
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('data.restoreError')
  } finally {
    restoring.value = false
    input.value = ''
  }
}

async function onImportCsv(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  restoring.value = true
  error.value = null
  message.value = null
  try {
    const imported = parseActivitiesCsv(await file.text())
    if (!imported.length) {
      error.value = t('data.importEmpty')
      return
    }
    await importActivities(imported)
    message.value = t('data.importDone', { count: imported.length })
    emit('restored')
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('data.importError')
  } finally {
    restoring.value = false
    input.value = ''
  }
}

function exportCsvActivities() {
  if (!props.data) return
  exportActivitiesCsv(props.data.activities)
}

function exportCsvWeekly() {
  if (!props.data) return
  exportWeeklyStatsCsv(props.data.activities)
}

function exportJson() {
  if (!props.data) return
  exportDashboardJson(props.data)
}
</script>

<template>
  <section class="data-panel">
    <SectionTitle :title="t('data.title')" info-key="dataExport" />
    <p class="hint">{{ t('data.hint') }}</p>

    <div class="actions">
      <button type="button" class="btn" :disabled="!data" @click="exportCsvActivities">
        {{ t('data.exportActivitiesCsv') }}
      </button>
      <button type="button" class="btn" :disabled="!data" @click="exportCsvWeekly">
        {{ t('data.exportWeeklyCsv') }}
      </button>
      <button type="button" class="btn" :disabled="!data" @click="exportJson">
        {{ t('data.exportJson') }}
      </button>
      <button type="button" class="btn primary" @click="backup">{{ t('data.backup') }}</button>
    </div>

    <div class="file-actions">
      <label class="file-btn">
        {{ restoring ? t('data.restoring') : t('data.restore') }}
        <input type="file" accept="application/json,.json" hidden @change="onRestoreFile" />
      </label>
      <label class="file-btn">
        {{ t('data.importCsv') }}
        <input type="file" accept=".csv,text/csv" hidden @change="onImportCsv" />
      </label>
    </div>

    <p v-if="message" class="msg ok">{{ message }}</p>
    <p v-if="error" class="msg err">{{ error }}</p>
  </section>
</template>

<style scoped>
.data-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: 1 / -1;
}

.hint {
  margin: -0.35rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.actions,
.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.file-actions {
  margin-top: 0.65rem;
}

.btn,
.file-btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.85rem;
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  background: transparent;
  color: var(--text);
}

.btn.primary,
.file-btn {
  background: rgba(34, 211, 238, 0.1);
  border-color: rgba(34, 211, 238, 0.25);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.msg {
  margin: 0.75rem 0 0;
  font-size: 0.82rem;
}

.msg.ok { color: #a7f3d0; }
.msg.err { color: #fecaca; }
</style>
