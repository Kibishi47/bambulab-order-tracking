<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: Component
  iconColor?: string
  badge?: string
  badgeColor?: string
}>()
</script>

<template>
  <div class="relative overflow-hidden rounded-xl bg-[#14161a] border border-zinc-800/80 p-5 shadow-lg shadow-black/20">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-medium text-zinc-400 tracking-wider uppercase">
          {{ title }}
        </p>
        <p class="mt-2 text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
          {{ value }}
        </p>
        <p v-if="subtitle" class="mt-1 text-xs text-zinc-400">
          {{ subtitle }}
        </p>
      </div>
      <div
        v-if="icon"
        class="p-2.5 rounded-xl border border-zinc-800/80"
        :class="iconColor || 'bg-bambu-500/10 text-bambu-400 border-bambu-500/20'"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>
    <div v-if="badge" class="mt-3">
      <span
        class="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border"
        :class="badgeColor || 'bg-zinc-800/60 text-zinc-300 border-zinc-700'"
      >
        {{ badge }}
      </span>
    </div>
  </div>
</template>
