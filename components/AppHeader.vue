<script setup lang="ts">
import { ref } from 'vue'
import {
  LayoutDashboard,
  Layers,
  Package,
  Scale,
  Users,
  PlusCircle,
  Menu,
  X
} from 'lucide-vue-next'

const route = useRoute()
const mobileMenuOpen = ref(false)

const emit = defineEmits<{
  (e: 'open-demand-modal'): void
}>()

const navItems = [
  { label: 'Tableau de bord', to: '/', icon: LayoutDashboard },
  { label: 'Besoins', to: '/besoins', icon: Layers },
  { label: 'Commandes', to: '/commandes', icon: Package },
  { label: 'Règlements & Soldes', to: '/reglements', icon: Scale },
  { label: 'Membres', to: '/membres', icon: Users }
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shadow-md shadow-black/40 group-hover:border-bambu-500/50 transition-colors">
              <!-- Bambu styled spool symbol -->
              <svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-bambu-500">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" fill-opacity="0.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fill-opacity="0.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Bambu<span class="text-bambu-500">Share</span>
                <span class="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-bambu-500/10 text-bambu-400 border border-bambu-500/30">Hub</span>
              </span>
              <span class="block text-[11px] text-zinc-400 font-medium leading-none">
                Commandes groupées
              </span>
            </div>
          </NuxtLink>

          <!-- Desktop Nav Links -->
          <nav class="hidden md:flex items-center gap-1 ml-4">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
              :class="[
                isActive(item.to)
                  ? 'bg-zinc-800/80 text-white border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              ]"
            >
              <component :is="item.icon" class="w-3.5 h-3.5" :class="isActive(item.to) ? 'text-bambu-400' : 'text-zinc-400'" />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Right Side: Fast Action Button -->
        <div class="hidden sm:flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-md shadow-bambu-500/20"
            @click="emit('open-demand-modal')"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Nouveau besoin</span>
          </button>
        </div>

        <!-- Mobile Menu Toggle -->
        <div class="flex items-center gap-2 md:hidden">
          <button
            type="button"
            class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <Menu v-if="!mobileMenuOpen" class="w-5 h-5" />
            <X v-else class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-t border-zinc-800 bg-[#121418] px-4 pt-3 pb-5 space-y-2"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg"
        :class="[
          isActive(item.to)
            ? 'bg-zinc-800 text-white border border-zinc-700'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
        ]"
        @click="mobileMenuOpen = false"
      >
        <component :is="item.icon" class="w-4 h-4 text-bambu-400" />
        <span>{{ item.label }}</span>
      </NuxtLink>

      <div class="pt-3 border-t border-zinc-800">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 transition-all shadow-md shadow-bambu-500/20"
          @click="emit('open-demand-modal'); mobileMenuOpen = false"
        >
          <PlusCircle class="w-4 h-4" />
          <span>Ajouter un besoin de filament</span>
        </button>
      </div>
    </div>
  </header>
</template>
