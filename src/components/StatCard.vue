<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import InfoTooltip from './InfoTooltip.vue'
import type { AppIconName } from '../utils/icons'

defineProps<{
  label: string
  value: string
  icon: AppIconName
  infoKey?: string
  accent?: string
  glow?: string
}>()
</script>

<template>
  <div class="stat-card">
    <div class="stat-icon">
      <AppIcon :name="icon" size="lg" />
    </div>
    <div class="stat-content">
      <span class="stat-label">
        {{ label }}
        <InfoTooltip v-if="infoKey" :info-key="infoKey" />
      </span>
      <span class="stat-value">{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
}

.stat-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--border);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.stat-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
</style>
