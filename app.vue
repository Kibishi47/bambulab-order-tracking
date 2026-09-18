<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import AppHeader from '~/components/AppHeader.vue'
import DemandModal from '~/components/demands/DemandModal.vue'

// Set page title and meta
useHead({
  title: 'BambuShare - Suivi des commandes groupées de filaments 3D',
  meta: [
    { name: 'description', content: 'Application minimaliste de gestion des besoins et commandes groupées de filaments Bambu Lab entre amis avec calcul automatique des remboursements.' }
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
  fetchMembers()
})
</script>

<template>
  <div class="min-h-screen bg-[#0c0d10] text-zinc-100 flex flex-col selection:bg-bambu-500 selection:text-white font-['Plus_Jakarta_Sans',sans-serif]">
    <!-- Top Navigation Header -->
    <AppHeader @open-demand-modal="demandModalOpen = true" />

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>

    <!-- Global Filament Demand Modal -->
    <DemandModal
      v-model="demandModalOpen"
      :members="members"
      @created="triggerGlobalRefresh"
    />

    <!-- Subtle Footer -->
    <footer class="border-t border-zinc-800/60 bg-zinc-950/60 py-6 text-xs text-zinc-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-bambu-500 animate-pulse" />
          <span>BambuShare • Suivi de commandes groupées de filaments 3D</span>
        </div>
        <div class="flex items-center gap-4 text-zinc-400">
          <span>Nuxt 3 + SQLite (Drizzle ORM)</span>
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
  background-color: #0c0d10;
}
</style>
