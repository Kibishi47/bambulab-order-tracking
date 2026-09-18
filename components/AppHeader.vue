<script setup lang="ts">
import { ref } from 'vue'
import {
  LayoutDashboard,
  Layers,
  Package,
  Scale,
import {
  LayoutDashboard,
  Layers,
  Package,
  Scale,
  Users,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-vue-next'
import { useTheme } from '~/composables/useTheme'

const route = useRoute()
const mobileMenuOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

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
  <header class="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center gap-6">
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center p-1.5 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" class="w-full h-full text-bambu-500">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" fill-opacity="0.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" fill-opacity="0.6" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <span class="text-sm font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                Bambu<span class="text-bambu-500">Share</span>
              </span>
              <span class="block text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
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
                  ? 'bg-zinc-100 text-zinc-900 border border-zinc-300/80 font-semibold dark:bg-zinc-800/80 dark:text-white dark:border-zinc-700/80'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
              ]"
            >
              <component
                :is="item.icon"
                class="w-3.5 h-3.5"
                :class="isActive(item.to) ? 'text-bambu-500' : 'text-zinc-400 dark:text-zinc-500'"
              />
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Right Side: Theme toggle + Mobile Menu Toggle -->
        <div class="flex items-center gap-2.5">
          <!-- Light / Dark Toggle Button -->
          <button
            type="button"
            class="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
            :title="isDark ? 'Passer au mode clair' : 'Passer au mode sombre'"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-zinc-600" />
          </button>

          <!-- Mobile Menu Toggle -->
          <button
            type="button"
            class="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg md:hidden"
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
      class="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121418] px-4 pt-3 pb-5 space-y-2"
    >
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg"
        :class="[
          isActive(item.to)
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
        ]"
        @click="mobileMenuOpen = false"
      >
        <component :is="item.icon" class="w-4 h-4 text-bambu-500" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </header>
</template>
