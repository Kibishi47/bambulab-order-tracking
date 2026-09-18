<script setup lang="ts">
import { DEMAND_STATUSES, ORDER_STATUSES } from '~/composables/useFilamentColors'
import type { NeedStatus, OrderStatus } from '~/types'
import { formatNeedStatus, formatOrderStatus } from '~/utils/labels'

const props = defineProps<{
  status: NeedStatus | OrderStatus | string
  type?: 'demand' | 'order'
  size?: 'sm' | 'md'
}>()

const config = computed(() => {
  const list = props.type === 'order' ? ORDER_STATUSES : DEMAND_STATUSES
  const found = list.find(s => s.value === props.status)
  if (found) return found

  const fallbackLabel = props.type === 'order'
    ? formatOrderStatus(props.status)
    : formatNeedStatus(props.status)

  return {
    value: props.status,
    label: fallbackLabel || props.status,
    color: 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap"
    :class="[
      config.color,
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    ]"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
    <span>{{ config.label }}</span>
  </span>
</template>
