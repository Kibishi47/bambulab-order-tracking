<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import AppHeader from '~/components/AppHeader.vue'
import DemandModal from '~/components/demands/DemandModal.vue'
import { useTheme } from '~/composables/useTheme'

const { initTheme } = useTheme()

// Set page head with anti-flicker theme script
useHead({
  title: 'BambuShare - Suivi des commandes groupées de filaments 3D',
  meta: [
    { name: 'description', content: 'Application minimaliste de gestion des besoins et commandes groupées de filaments Bambu Lab entre amis avec calcul automatique des remboursements.' }
  ],
  script: [
    {
      children: `
        (function() {
          try {
            var theme = localStorage.getItem('theme');
            var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (theme === 'dark' || (!theme && supportDark)) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (e) {}
        })();
      `,
      tagPosition: 'head'
    }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap' }
  ]
})

const demandModalOpen = ref(false)
const members = ref<any[]>([])

async function fetchMembers() {
  try {
    members.value = await $fetch('/api/members')
  } catch (e) {
    console.error('Failed to load members', e)
  }
}

// Global provide for refresh events
const refreshKey = ref(0)
function triggerGlobalRefresh() {
  refreshKey.value++
  fetchMembers()
}
provide('triggerRefresh', triggerGlobalRefresh)
provide('refreshKey', refreshKey)

onMounted(() => {
  initTheme()
  fetchMembers()
})
</script>

<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col selection:bg-bambu-500 selection:text-white font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-150">
    <!-- Top Navigation Header with Light/Dark toggle -->
    <AppHeader @open-demand-modal="demandModalOpen = true" />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <NuxtPage />
    </main>

    <!-- Global Filament Demand Modal -->
    <DemandModal
      v-model="demandModalOpen"
      :members="members"
      @created="triggerGlobalRefresh"
    />

    <!-- Minimalist Footer -->
    <footer class="border-t border-zinc-200 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/60 py-6 text-xs text-zinc-500 dark:text-zinc-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bambu-500" />
          <span>BambuShare • Suivi de commandes groupées</span>
        </div>
        <div class="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
          <span>Nuxt 3 • SQLite</span>
          <span>•</span>
          <span>Docker Ready</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
