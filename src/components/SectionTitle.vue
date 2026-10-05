<script setup lang="ts">
import InfoTooltip from './InfoTooltip.vue'

withDefaults(
  defineProps<{
    title: string
    infoKey?: string
    tag?: 'h2' | 'h3' | 'h4'
  }>(),
  { tag: 'h3' },
)
</script>

<template>
  <component :is="tag" class="section-title" :class="tag">
    <span class="section-title-text">{{ title }}</span>
    <InfoTooltip v-if="infoKey" :info-key="infoKey" />
  </component>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
  /* Flex items default to min-width: auto, which is the text's unwrapped
     width - used everywhere in the app, so without this a single long title
     forces its whole card/section wider than the viewport on narrow screens. */
  min-width: 0;
}

.section-title-text {
  min-width: 0;
  overflow-wrap: break-word;
}

.section-title.h2,
.section-title.h2 .section-title-text {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.section-title.h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.section-title.h4 {
  margin-bottom: 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
}
</style>
