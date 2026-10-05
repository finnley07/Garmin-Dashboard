<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GarminActivity } from '../types/garmin'
import { fetchActivityRoute } from '../api/garmin'
import { recentCardioActivities } from '../utils/dashboardAnalytics'
import { useI18n } from '../i18n'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{ activities: GarminActivity[] }>()

const { t } = useI18n()
const options = computed(() => recentCardioActivities(props.activities, 10))
const selectedId = ref<number | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const points = ref<{ lat: number; lng: number }[]>([])
const fetchEnabled = ref(false)

watch(
  options,
  (list) => {
    if (!selectedId.value && list[0]) {
      selectedId.value = list[0].activityId
    }
  },
  { immediate: true },
)

async function loadRoute(id: number) {
  points.value = []
  error.value = null
  loading.value = true
  try {
    const route = await fetchActivityRoute(id)
    points.value = route.points
    if (!route.points.length) error.value = t('analytics.routeEmpty')
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('analytics.routeError')
  } finally {
    loading.value = false
  }
}

function enableFetch() {
  if (fetchEnabled.value) return
  fetchEnabled.value = true
  if (selectedId.value) void loadRoute(selectedId.value)
}

watch(selectedId, (id) => {
  if (!fetchEnabled.value || !id) return
  void loadRoute(id)
})

const svgPath = computed(() => {
  if (points.value.length < 2) return ''
  const lats = points.value.map((p) => p.lat)
  const lngs = points.value.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const pad = 0.0001
  const w = 360
  const h = 180

  return points.value
    .map((point, index) => {
      const x = ((point.lng - minLng) / Math.max(maxLng - minLng, pad)) * w
      const y = h - ((point.lat - minLat) / Math.max(maxLat - minLat, pad)) * h
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <section v-if="options.length" class="route-panel">
    <SectionTitle :title="t('analytics.routePreview')" info-key="routePreview" />
    <label class="field">
      <span>{{ t('analytics.selectActivity') }}</span>
      <select v-model.number="selectedId" @focus="enableFetch" @click="enableFetch">
        <option v-for="activity in options" :key="activity.activityId" :value="activity.activityId">
          {{ activity.activityName }} · {{ activity.startTimeLocal.slice(0, 10) }}
        </option>
      </select>
    </label>
    <div v-if="loading" class="state">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="state muted">{{ error }}</div>
    <svg v-else-if="svgPath" viewBox="0 0 360 180" class="route-svg" role="img">
      <path :d="svgPath" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" />
    </svg>
  </section>
</template>

<style scoped>
.route-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.25rem;
  grid-column: span 6;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;
}

.field span {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.field select {
  padding: 0.55rem 0.65rem;
  background: rgba(8, 12, 22, 0.65);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font: inherit;
}

.route-svg {
  width: 100%;
  height: 180px;
  background: rgba(8, 12, 22, 0.45);
  border-radius: 12px;
}

.state {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.85rem;
}

.state.muted {
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .route-panel { grid-column: 1 / -1; }
}
</style>
