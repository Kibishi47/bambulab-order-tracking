<script setup lang="ts">
import { BAMBU_FILAMENT_TYPES } from '~/composables/useFilamentColors'
import { FilamentFormat } from '~/types'
import { formatFilamentFormat } from '~/utils/labels'

const props = defineProps<{
  type: string
  format?: FilamentFormat | string
  colorName?: string
  colorHex?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const typeConfig = computed(() => {
  return BAMBU_FILAMENT_TYPES.find(t => t.name.toLowerCase() === props.type.toLowerCase()) || {
    name: props.type,
    category: 'Autre',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
  }
})

const isLightColor = computed(() => {
  if (!props.colorHex) return false
  const hex = props.colorHex.replace('#', '')
  if (hex.length !== 6) return false
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 190
})
</script>

<template>
  <div class="inline-flex items-center gap-1.5 flex-wrap">
    <!-- Filament Type Badge -->
    <span
      class="inline-flex items-center font-medium rounded-md border tracking-wide"
      :class="[
        typeConfig.badgeClass,
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      ]"
    >
      {{ typeConfig.name }}
    </span>

    <!-- Format Pill (Recharge vs Bobine) -->
    <span
      v-if="format"
      class="inline-flex items-center rounded-md border font-medium text-[11px]"
      :class="[
        format === FilamentFormat.SPOOL
          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800/70 dark:text-zinc-400 dark:border-zinc-700/60',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5'
      ]"
    >
      {{ formatFilamentFormat(format) }}
    </span>

    <!-- Color Swatch & Label -->
    <span
      v-if="colorName"
      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-200"
    >
      <span
        class="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
        :class="{ 'ring-1 ring-zinc-400 dark:ring-zinc-600': isLightColor }"
        :style="{ backgroundColor: colorHex || '#888888' }"
      />
      <span>{{ colorName }}</span>
    </span>
  </div>
</template>
