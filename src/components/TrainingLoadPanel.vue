<script setup lang="ts">
import { computed } from 'vue'
import { parseExtendedWellness, hasPerformanceData } from '../utils/wellness'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'
import InfoTooltip from './InfoTooltip.vue'

const props = defineProps<{
  trainingStatus: Record<string, unknown> | null
  trainingReadiness: Record<string, unknown> | null | unknown[]
  vo2max: Record<string, unknown> | null | unknown[]
}>()

const { t } = useI18n()

const wellness = computed(() =>
  parseExtendedWellness({
    trainingStatus: props.trainingStatus,
    trainingReadiness: props.trainingReadiness,
    vo2max: props.vo2max,
  }),
)

const show = computed(() => hasPerformanceData(wellness.value))

const acwrPercent = computed(() => {
  const ratio = wellness.value.acwrRatio
  if (ratio === null) return 0
  return Math.min(100, Math.round(ratio * 50))
})

const acwrColor = computed(() => {
  const ratio = wellness.value.acwrRatio ?? 1
  if (ratio > 1.3) return '#ef4444'
  if (ratio > 1.1) return '#f59e0b'
  if (ratio < 0.8) return '#6366f1'
  return '#22c55e'
})
</script>

<template>
  <section v-if="show" class="load-panel">
    <SectionTitle :title="t('performance.loadTitle')" info-key="trainingLoad" />

    <div v-if="wellness.acwrRatio !== null" class="acwr-block">
      <div class="acwr-head">
        <span class="acwr-label">
          ACWR
          <InfoTooltip info-key="acwr" />
        </span>
        <strong :style="{ color: acwrColor }">{{ wellness.acwrRatio.toFixed(2) }}</strong>
        <span v-if="wellness.acwrStatus" class="status">{{ wellness.acwrStatus }}</span>
      </div>
      <div class="acwr-track">
        <div
          class="acwr-fill"
          :style="{ width: `${acwrPercent}%`, background: acwrColor }"
        />
        <div class="acwr-optimal" />
      </div>
      <div class="acwr-meta">
        <span v-if="wellness.acuteLoad" class="meta-item">
          {{ t('performance.acute') }}: {{ Math.round(wellness.acuteLoad) }}
          <InfoTooltip info-key="acuteLoad" />
        </span>
        <span v-if="wellness.chronicLoad" class="meta-item">
          {{ t('performance.chronic') }}: {{ Math.round(wellness.chronicLoad) }}
          <InfoTooltip info-key="chronicLoad" />
        </span>
      </div>
    </div>

    <div v-if="wellness.loadBalance.length" class="balance">
      <SectionTitle :title="t('performance.loadBalance')" info-key="loadBalance" tag="h4" />
      <ul>
        <li v-for="item in wellness.loadBalance" :key="item.key">
          <div class="balance-head">
            <span>{{ item.label }}</span>
            <span>{{ Math.round(item.current) }} / {{ Math.round(item.targetMin) }}+</span>
          </div>
          <div class="balance-track">
            <div
              class="balance-fill"
              :class="{ low: item.current < item.targetMin }"
              :style="{
                width: `${Math.min(100, item.targetMin ? (item.current / item.targetMin) * 100 : 0)}%`,
              }"
            />
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.load-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  height: 100%;
}

.load-panel h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
}

.acwr-block {
  margin-bottom: 1rem;
}

.acwr-head {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-bottom: 0.4rem;
}

.acwr-label {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.acwr-head strong {
  font-size: 1.5rem;
}

.status {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.acwr-track {
  position: relative;
  height: 10px;
  background: var(--surface-elevated);
  border-radius: 999px;
  overflow: hidden;
}

.acwr-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.acwr-optimal {
  position: absolute;
  left: 40%;
  width: 20%;
  top: 0;
  bottom: 0;
  background: rgba(34, 197, 94, 0.12);
  pointer-events: none;
}

.acwr-meta {
  display: flex;
  gap: 1rem;
  margin-top: 0.4rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.balance h4 {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.balance ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.balance-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.balance-track {
  height: 6px;
  background: var(--surface-elevated);
  border-radius: 999px;
  overflow: hidden;
}

.balance-fill {
  height: 100%;
  background: linear-gradient(90deg, #0077b6, #00b4d8);
  border-radius: 999px;
}

.balance-fill.low {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
</style>
