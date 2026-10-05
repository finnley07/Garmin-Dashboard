<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { resolveIcon, type AppIconName } from '../utils/icons'

const props = withDefaults(
  defineProps<{
    name?: AppIconName
    icon?: IconDefinition
    size?: 'xs' | 'sm' | 'lg' | 'xl' | '1x' | '2x'
    fixedWidth?: boolean
  }>(),
  {
    size: '1x',
    fixedWidth: false,
  },
)

const resolvedIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.name) return resolveIcon(props.name)
  return undefined
})
</script>

<template>
  <FontAwesomeIcon
    v-if="resolvedIcon"
    :icon="resolvedIcon"
    :size="size"
    :fixed-width="fixedWidth"
    class="app-icon"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: -0.125em;
}
</style>
