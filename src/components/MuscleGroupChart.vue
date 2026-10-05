<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ExerciseSetSummary } from '../types/garmin'
import {
  aggregateMuscleGroups,
  computeRegionHeatmap,
  muscleLabelKey,
  type BodyRegionId,
  type RegionHeat,
} from '../utils/muscleGroups'
import { useI18n } from '../i18n'

const props = defineProps<{ exercises: ExerciseSetSummary[] }>()

const { t } = useI18n()

const hoveredRegion = ref<BodyRegionId | null>(null)

const heatmap = computed(() => computeRegionHeatmap(props.exercises))
const muscleGroups = computed(() => aggregateMuscleGroups(props.exercises))

interface RegionStyle {
  fill: string
  fillOpacity: number
  stroke: string
  strokeWidth: number
  filter?: string
  glow: boolean
}

const INACTIVE: RegionStyle = {
  fill: '#1a2332',
  fillOpacity: 0.85,
  stroke: '#334155',
  strokeWidth: 1,
  glow: false,
}

function primaryStyle(intensity: number): RegionStyle {
  const t = Math.max(0.35, intensity)
  const r = Math.round(120 + t * 115)
  const g = Math.round(18 + t * 10)
  const b = Math.round(24 + t * 12)
  return {
    fill: `rgb(${r}, ${g}, ${b})`,
    fillOpacity: 0.72 + t * 0.28,
    stroke: intensity > 0.55 ? '#fca5a5' : '#f87171',
    strokeWidth: 1.5 + intensity * 1.2,
    filter: intensity > 0.25 ? 'url(#primary-glow)' : undefined,
    glow: intensity > 0.25,
  }
}

function secondaryStyle(intensity: number): RegionStyle {
  const t = Math.max(0.35, intensity)
  const r = Math.round(140 + t * 90)
  const g = Math.round(95 + t * 80)
  const b = Math.round(8 + t * 8)
  return {
    fill: `rgb(${r}, ${g}, ${b})`,
    fillOpacity: 0.68 + t * 0.28,
    stroke: intensity > 0.55 ? '#fde047' : '#facc15',
    strokeWidth: 1.5 + intensity * 1,
    filter: intensity > 0.25 ? 'url(#secondary-glow)' : undefined,
    glow: intensity > 0.25,
  }
}

function styleFor(regionId: BodyRegionId): RegionStyle {
  const heat = heatmap.value.get(regionId)
  if (!heat || heat.role === 'none') return INACTIVE
  if (heat.role === 'primary') return primaryStyle(heat.intensity)
  return secondaryStyle(heat.intensity)
}

function regionClass(regionId: BodyRegionId) {
  const heat = heatmap.value.get(regionId)
  if (!heat || heat.role === 'none') return 'muscle-region'
  return `muscle-region active ${heat.role}`
}

function regionAttrs(regionId: BodyRegionId) {
  const s = styleFor(regionId)
  return {
    fill: s.fill,
    'fill-opacity': s.fillOpacity,
    stroke: s.stroke,
    'stroke-width': s.strokeWidth,
    filter: s.filter,
  }
}

const hoveredHeat = computed(() =>
  hoveredRegion.value ? heatmap.value.get(hoveredRegion.value) : null,
)

const primaryCount = computed(
  () => [...heatmap.value.values()].filter((h) => h.role === 'primary').length,
)
const secondaryCount = computed(
  () => [...heatmap.value.values()].filter((h) => h.role === 'secondary').length,
)

interface RegionDef {
  id: BodyRegionId
  d: string
  label?: string
}

const FRONT_REGIONS: RegionDef[] = [
  { id: 'delt-front-l', d: 'M 34 74 Q 22 78 18 88 Q 16 98 22 108 Q 30 112 38 102 Q 42 90 40 80 Z' },
  { id: 'delt-front-r', d: 'M 86 74 Q 98 78 102 88 Q 104 98 98 108 Q 90 112 82 102 Q 78 90 80 80 Z' },
  { id: 'chest-upper', d: 'M 38 72 Q 60 66 82 72 L 78 98 Q 60 102 42 98 Z' },
  { id: 'chest-lower', d: 'M 42 98 L 78 98 L 74 128 Q 60 134 46 128 Z' },
  { id: 'biceps-l', d: 'M 14 88 Q 8 108 10 132 Q 14 138 22 128 Q 26 110 24 92 Z' },
  { id: 'biceps-r', d: 'M 106 88 Q 112 108 110 132 Q 106 138 98 128 Q 94 110 96 92 Z' },
  { id: 'forearm-l', d: 'M 8 134 Q 4 158 8 182 Q 14 186 20 168 Q 22 148 18 132 Z' },
  { id: 'forearm-r', d: 'M 112 134 Q 116 158 112 182 Q 106 186 100 168 Q 98 148 102 132 Z' },
  { id: 'abs-upper', d: 'M 46 130 L 74 130 L 72 158 Q 60 162 48 158 Z' },
  { id: 'abs-lower', d: 'M 48 158 L 72 158 L 70 188 Q 60 192 50 188 Z' },
  { id: 'oblique-l', d: 'M 38 132 L 46 132 L 44 186 Q 38 188 34 182 Z' },
  { id: 'oblique-r', d: 'M 74 132 L 82 132 L 86 182 Q 82 188 76 186 Z' },
  { id: 'quad-l', d: 'M 40 192 L 54 192 L 52 278 Q 44 284 38 276 Z' },
  { id: 'quad-r', d: 'M 66 192 L 80 192 L 82 278 Q 76 284 68 276 Z' },
  { id: 'calf-front-l', d: 'M 40 282 L 52 282 L 50 338 Q 44 344 38 336 Z' },
  { id: 'calf-front-r', d: 'M 68 282 L 80 282 L 82 338 Q 76 344 70 336 Z' },
]

const BACK_REGIONS: RegionDef[] = [
  { id: 'traps', d: 'M 178 68 Q 200 62 222 68 L 216 92 Q 200 98 184 92 Z' },
  { id: 'lats-l', d: 'M 178 92 Q 168 110 164 148 Q 172 152 182 132 Q 186 112 184 96 Z' },
  { id: 'lats-r', d: 'M 222 92 Q 232 110 236 148 Q 228 152 218 132 Q 214 112 216 96 Z' },
  { id: 'lower-back', d: 'M 184 132 L 216 132 L 214 178 Q 200 184 186 178 Z' },
  { id: 'delt-rear-l', d: 'M 162 74 Q 152 82 150 96 Q 156 108 166 100 Q 170 88 168 78 Z' },
  { id: 'delt-rear-r', d: 'M 238 74 Q 248 82 250 96 Q 244 108 234 100 Q 230 88 232 78 Z' },
  { id: 'triceps-l', d: 'M 154 88 Q 148 112 152 138 Q 160 142 168 120 Q 170 100 166 86 Z' },
  { id: 'triceps-r', d: 'M 246 88 Q 252 112 248 138 Q 240 142 232 120 Q 230 100 234 86 Z' },
  { id: 'glutes-l', d: 'M 184 178 Q 194 176 200 180 L 198 212 Q 190 218 182 212 Z' },
  { id: 'glutes-r', d: 'M 200 180 Q 206 176 216 178 L 218 212 Q 210 218 202 212 Z' },
  { id: 'ham-l', d: 'M 184 214 L 196 214 L 194 276 Q 188 282 182 274 Z' },
  { id: 'ham-r', d: 'M 204 214 L 216 214 L 218 276 Q 212 282 206 274 Z' },
  { id: 'calf-back-l', d: 'M 182 280 L 194 280 L 192 338 Q 186 344 180 336 Z' },
  { id: 'calf-back-r', d: 'M 206 280 L 218 280 L 220 338 Q 214 344 208 336 Z' },
]

function onEnter(id: BodyRegionId) {
  hoveredRegion.value = id
}

function onLeave() {
  hoveredRegion.value = null
}

function roleLabel(role: RegionHeat['role']) {
  if (role === 'primary') return t('charts.musclePrimary')
  if (role === 'secondary') return t('charts.muscleSecondary')
  return t('charts.muscleInactive')
}
</script>

<template>
  <div class="body-map-card">
    <div class="card-header">
      <h3>{{ t('charts.muscleGroups') }}</h3>
      <div class="role-legend">
        <span class="legend-chip primary">
          <i /> {{ t('charts.musclePrimary') }} ({{ primaryCount }})
        </span>
        <span class="legend-chip secondary">
          <i /> {{ t('charts.muscleSecondary') }} ({{ secondaryCount }})
        </span>
      </div>
    </div>

    <div class="body-map-wrap">
      <svg viewBox="0 0 280 380" class="body-svg" :aria-label="t('charts.muscleGroupsAria')">
        <defs>
          <linearGradient id="body-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0f1419" />
            <stop offset="100%" stop-color="#151d28" />
          </linearGradient>
          <filter id="primary-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="secondary-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="muscle-fiber" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
          </pattern>
        </defs>

        <rect x="0" y="0" width="280" height="380" fill="url(#body-bg)" rx="12" />

        <!-- Front -->
        <text x="60" y="22" class="view-label">{{ t('charts.bodyFront') }}</text>
        <ellipse cx="60" cy="44" rx="17" ry="19" class="body-base" />
        <rect x="53" y="62" width="14" height="10" rx="3" class="body-base" />

        <g class="muscle-layer">
          <path
            v-for="region in FRONT_REGIONS"
            :key="region.id"
            :d="region.d"
            :class="regionClass(region.id)"
            v-bind="regionAttrs(region.id)"
            @mouseenter="onEnter(region.id)"
            @mouseleave="onLeave"
          />
        </g>

        <path
          d="M 36 64 Q 60 58 84 64 L 80 190 Q 60 198 40 190 Z M 38 190 L 82 190 L 84 340 Q 60 348 36 340 Z"
          class="body-outline"
        />
        <line x1="60" y1="130" x2="60" y2="188" class="midline" />
        <line x1="46" y1="136" x2="74" y2="136" class="detail-line" />
        <line x1="48" y1="158" x2="72" y2="158" class="detail-line" />
        <line x1="50" y1="178" x2="70" y2="178" class="detail-line" />

        <!-- Back -->
        <text x="200" y="22" class="view-label">{{ t('charts.bodyBack') }}</text>
        <ellipse cx="200" cy="44" rx="17" ry="19" class="body-base" />
        <rect x="193" y="62" width="14" height="10" rx="3" class="body-base" />

        <g class="muscle-layer">
          <path
            v-for="region in BACK_REGIONS"
            :key="region.id"
            :d="region.d"
            :class="regionClass(region.id)"
            v-bind="regionAttrs(region.id)"
            @mouseenter="onEnter(region.id)"
            @mouseleave="onLeave"
          />
        </g>

        <path
          d="M 176 64 Q 200 58 224 64 L 220 190 Q 200 198 180 190 Z M 182 190 L 218 190 L 220 340 Q 200 348 180 340 Z"
          class="body-outline"
        />
        <line x1="200" y1="92" x2="200" y2="178" class="midline" />
        <path d="M 184 132 Q 200 128 216 132" class="detail-line" fill="none" />
      </svg>

      <Transition name="fade">
        <div v-if="hoveredHeat && hoveredHeat.role !== 'none'" class="tooltip">
          <span class="tooltip-role" :class="hoveredHeat.role">{{ roleLabel(hoveredHeat.role) }}</span>
          <strong>{{ hoveredHeat.muscles.map((m) => t(muscleLabelKey(m))).join(' · ') }}</strong>
          <span>{{ hoveredHeat.sets }} {{ t('detail.sets') }} · {{ (hoveredHeat.volume / 1000).toFixed(1) }} kg</span>
        </div>
      </Transition>
    </div>

    <ul v-if="muscleGroups.length" class="legend">
      <li v-for="group in muscleGroups.slice(0, 10)" :key="group.name">
        <span
          class="legend-bar"
          :style="{
            width: `${Math.max(12, (group.volume / (muscleGroups[0]?.volume || 1)) * 100)}%`,
          }"
        />
        <span class="legend-name">{{ t(muscleLabelKey(group.name)) }}</span>
        <span class="legend-meta">
          {{ Math.round(group.sets) }}S · {{ (group.volume / 1000).toFixed(0) }}kg
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.body-map-card {
  background: linear-gradient(165deg, #1a2332 0%, #141c27 100%);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1rem 1rem 0.85rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}

.body-map-card h3 {
  margin: 0;
  font-size: 0.95rem;
}

.role-legend {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.legend-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.legend-chip i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-chip.primary {
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.1);
}

.legend-chip.primary i {
  background: #ef4444;
  box-shadow: 0 0 6px #ef4444;
}

.legend-chip.secondary {
  color: #fde047;
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(234, 179, 8, 0.1);
}

.legend-chip.secondary i {
  background: #eab308;
  box-shadow: 0 0 6px #eab308;
}

.body-map-wrap {
  position: relative;
  display: flex;
  justify-content: center;
}

.body-svg {
  width: 100%;
  max-width: 340px;
  height: auto;
}

.view-label {
  fill: #64748b;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-anchor: middle;
}

.body-base {
  fill: #121a24;
  stroke: #2d3f56;
  stroke-width: 1;
}

.body-outline {
  fill: none;
  stroke: #475569;
  stroke-width: 1.3;
  pointer-events: none;
}

.midline,
.detail-line {
  stroke: rgba(255, 255, 255, 0.06);
  stroke-width: 0.8;
  pointer-events: none;
}

.muscle-region {
  cursor: pointer;
  transition: filter 0.18s ease, stroke-width 0.18s ease, fill-opacity 0.18s ease;
}

.muscle-region.active.primary:hover {
  filter: brightness(1.15) drop-shadow(0 0 6px rgba(239, 68, 68, 0.6));
}

.muscle-region.active.secondary:hover {
  filter: brightness(1.12) drop-shadow(0 0 6px rgba(234, 179, 8, 0.55));
}

.muscle-region:hover {
  stroke-width: 2.5 !important;
}

.tooltip {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  background: rgba(10, 14, 20, 0.94);
  border-radius: 10px;
  padding: 0.55rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.72rem;
  pointer-events: none;
  min-width: 120px;
  backdrop-filter: blur(8px);
}

.tooltip-role {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.tooltip-role.primary {
  color: #f87171;
}

.tooltip-role.secondary {
  color: #facc15;
}

.tooltip strong {
  color: var(--text);
  font-size: 0.8rem;
}

.tooltip span:last-child {
  color: var(--text-muted);
}

.legend {
  list-style: none;
  margin: 0.85rem 0 0;
  padding: 0.65rem 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.legend li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.legend-bar {
  grid-column: 1 / -1;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ef4444, #f87171);
  max-width: 100%;
}

.legend-name {
  color: var(--text);
  font-weight: 500;
}

.legend-meta {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
