<script setup lang="ts">
import { computed } from 'vue'
import type { Recommendation } from '../types/garmin'
import { useI18n } from '../i18n'
import AppIcon from './AppIcon.vue'
import InfoTooltip from './InfoTooltip.vue'
import SectionTitle from './SectionTitle.vue'

const props = defineProps<{
  recommendations: Recommendation[]
  source: 'claude' | 'local'
  usage?: import('../types/appConfig').ClaudeUsage | null
  maxItems?: number
  compact?: boolean
  /** True while a manually triggered re-analysis is in flight. */
  checking?: boolean
}>()

const emit = defineEmits<{ reanalyze: [] }>()

const { t } = useI18n()

/**
 * Model, tokens, price and duration of the last Claude call – so the cost of the
 * analysis is readable instead of guesswork.
 */
const usageLine = computed(() => {
  const usage = props.usage
  if (props.source !== 'claude' || !usage) return null

  const parts: string[] = []
  if (usage.model) parts.push(usage.model)
  if (usage.inputTokens !== null && usage.outputTokens !== null) {
    parts.push(`${usage.inputTokens} → ${usage.outputTokens} ${t('recommendations.tokens')}`)
  }
  if (usage.costUsd !== null) parts.push(`$${usage.costUsd.toFixed(4)}`)
  if (usage.durationMs !== null) parts.push(`${(usage.durationMs / 1000).toFixed(1)} s`)
  if (usage.effort) parts.push(`effort ${usage.effort}`)
  if (usage.localAdded && usage.localAdded > 0) {
    parts.push(t('recommendations.localAdded', { count: usage.localAdded }))
  }

  return parts.length > 0 ? parts.join(' · ') : null
})

const priorityOrder: Record<Recommendation['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const displayedRecommendations = computed(() => {
  const sorted = [...props.recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )
  if (props.maxItems && props.maxItems > 0) {
    return sorted.slice(0, props.maxItems)
  }
  return sorted
})

const priorityColors: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
}

function categoryLabel(category: string) {
  const key = `recommendations.category.${category}`
  const label = t(key)
  return label === key ? category : label
}

function priorityLabel(priority: string) {
  const key = `recommendations.priority.${priority}`
  const label = t(key)
  return label === key ? priority : label
}
</script>

<template>
  <div class="recommendations-card">
    <div class="recommendations-header">
      <div class="header-copy">
        <SectionTitle :title="t('recommendations.title')" info-key="recommendations" tag="h3" />
        <p class="subtitle">{{ compact ? t('recommendations.subtitleCompact') : t('recommendations.subtitle') }}</p>
      </div>
      <div class="source-block">
        <span class="source-badge" :class="source">
          <AppIcon :name="source === 'claude' ? 'sparkles' : 'chart-column'" size="sm" />
          {{ source === 'claude' ? t('recommendations.sourceClaude') : t('recommendations.sourceLocal') }}
        </span>
        <span v-if="usageLine" class="usage-line">{{ usageLine }}</span>
        <button
          type="button"
          class="reanalyze-btn"
          :disabled="checking"
          :title="t('recommendations.reanalyzeHint')"
          @click="emit('reanalyze')"
        >
          <AppIcon name="refresh" size="sm" :class="{ spin: checking }" />
          {{ checking ? t('recommendations.reanalyzing') : t('recommendations.reanalyze') }}
        </button>
      </div>
    </div>

    <div v-if="displayedRecommendations.length" class="recommendations-grid">
      <article
        v-for="(rec, index) in displayedRecommendations"
        :key="index"
        class="recommendation"
        :class="{ compact }"
        :style="{ borderLeftColor: priorityColors[rec.priority] }"
      >
        <div class="rec-meta">
          <span class="rec-category">{{ categoryLabel(rec.category) }}</span>
          <span class="rec-priority" :style="{ color: priorityColors[rec.priority] }">
            {{ priorityLabel(rec.priority) }}
          </span>
        </div>
        <h4>{{ rec.title }}</h4>
        <p>{{ rec.description }}</p>
      </article>
    </div>
    <p v-else class="empty">{{ t('recommendations.empty') }}</p>

    <p v-if="!compact" class="profile-hint">{{ t('recommendations.hint') }}</p>
    <p v-else-if="recommendations.length > (maxItems ?? 0)" class="profile-hint compact-more">
      {{ t('recommendations.moreInDetails', { count: recommendations.length - (maxItems ?? 0) }) }}
    </p>
  </div>
</template>

<style scoped>
.recommendations-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1.25rem 1.3rem;
}

.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-copy {
  /* Flex items default to a min-width equal to their unwrapped content, which
     forces the row wider than the viewport before the text ever gets a chance
     to wrap. min-width: 0 lets the subtitle actually wrap on narrow screens. */
  min-width: 0;
  flex: 1 1 16rem;
}

.header-copy :deep(.section-title.h3) {
  margin-bottom: 0.35rem;
  font-size: 1.1rem;
}

.subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
  max-width: 42rem;
}

.profile-hint {
  margin: 1rem 0 0;
  font-size: 0.72rem;
  color: var(--text-muted);
  opacity: 0.85;
}

.source-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}

.usage-line {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  text-align: right;
  max-width: 100%;
  overflow-wrap: break-word;
}

@media (max-width: 480px) {
  .source-block {
    align-items: flex-start;
    width: 100%;
  }

  .usage-line {
    text-align: left;
  }
}

.reanalyze-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-pill);
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.reanalyze-btn:hover:not(:disabled) {
  border-color: var(--border-hover);
}

.reanalyze-btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.reanalyze-btn :deep(.spin) {
  animation: reanalyze-spin 0.9s linear infinite;
}

@keyframes reanalyze-spin {
  to {
    transform: rotate(360deg);
  }
}

.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  font-weight: 600;
  flex-shrink: 0;
}

.source-badge.claude {
  background: var(--accent-soft);
  border: 1px solid var(--border-hover);
  color: var(--accent-hover);
}

.source-badge.local {
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 0.75rem;
}

.recommendation {
  padding: 1rem 1.05rem;
  background: var(--surface-elevated);
  border-radius: var(--radius-sm);
  border-left: 3px solid;
}

.rec-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.rec-category {
  color: var(--accent);
}

.rec-priority {
  font-weight: 600;
}

.recommendation h4 {
  margin: 0 0 0.45rem;
  font-size: 0.95rem;
  line-height: 1.3;
}

.recommendation.compact {
  padding: 0.85rem 0.95rem;
}

.recommendation.compact h4 {
  font-size: 0.9rem;
}

.recommendation.compact p {
  font-size: 0.82rem;
  line-height: 1.45;
}

.profile-hint.compact-more {
  color: var(--accent);
  opacity: 1;
}

.recommendation p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.55;
}

.empty {
  margin: 0;
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}
</style>
