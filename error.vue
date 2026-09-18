<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { clearError } from '#app'
import {
  FileQuestion,
  AlertTriangle,
  RotateCcw,
  Home,
  Layers,
  Sun,
  Moon,
  Terminal
} from 'lucide-vue-next'
import { useTheme } from '~/composables/useTheme'

const props = defineProps<{
  error: {
    statusCode?: number | string
    statusMessage?: string
    message?: string
    stack?: string
    data?: any
  }
}>()

const { isDark, toggleTheme, initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const statusCode = computed(() => Number(props.error?.statusCode) || 500)
const is404 = computed(() => statusCode.value === 404)

// Mode dev : import.meta.dev est standard dans Vite / Nuxt 3
const isDev = computed(() => {
  return Boolean(import.meta.dev || (typeof process !== 'undefined' && (process as any).dev))
})

const handleClear = (redirectPath = '/') => {
  clearError({ redirect: redirectPath })
}

const handleRetry = () => {
  if (typeof window !== 'undefined') {
    clearError()
    window.location.reload()
  }
}
</script>

<template>
  <div class="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-bambu-500 selection:text-white transition-colors">
    <!-- Minimal Header -->
    <header class="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button
          type="button"
          class="flex items-center gap-3 text-left group cursor-pointer"
          @click="handleClear('/')"
        >
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
        </button>

        <!-- Theme Toggle -->
        <button
          type="button"
          class="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
          :title="isDark ? 'Passer au mode clair' : 'Passer au mode sombre'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
          <Moon v-else class="w-4 h-4 text-zinc-600" />
        </button>
      </div>
    </header>

    <!-- Error Card Section -->
    <main class="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
      <div class="max-w-md w-full rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm text-center space-y-6">
        <!-- Icon & Status Code Badge -->
        <div class="space-y-3">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform"
            :class="[
              is404
                ? 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300'
                : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
            ]"
          >
            <FileQuestion v-if="is404" class="w-8 h-8" />
            <AlertTriangle v-else class="w-8 h-8" />
          </div>

          <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-bold border"
            :class="[
              is404
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
            ]"
          >
            <span>Code HTTP {{ statusCode }}</span>
          </div>
        </div>

        <!-- Titres & Messages Contextuels -->
        <div class="space-y-2">
          <h1 class="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            {{ is404 ? 'Bobine introuvable' : 'Échec d\'impression' }}
          </h1>
          <p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {{
              is404
                ? 'Le lien demandé n\'existe pas ou la page a été déplacée.'
                : (error?.statusMessage || 'Le serveur a rencontré un imprévu lors du traitement de la requête.')
            }}
          </p>
        </div>

        <!-- Actions Principale et Secondaire -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <!-- 404 : Accueil & Besoins -->
          <template v-if="is404">
            <button
              type="button"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bambu-500 hover:bg-bambu-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
              @click="handleClear('/')"
            >
              <Home class="w-4 h-4" />
              <span>Retour à l'accueil</span>
            </button>
            <button
              type="button"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all"
              @click="handleClear('/besoins')"
            >
              <Layers class="w-4 h-4 text-zinc-500" />
              <span>Liste des besoins</span>
            </button>
          </template>

          <!-- 500 / Autre : Réessayer & Accueil -->
          <template v-else>
            <button
              type="button"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-bambu-500 hover:bg-bambu-600 active:scale-95 text-white text-xs font-semibold shadow-sm transition-all"
              @click="handleRetry"
            >
              <RotateCcw class="w-4 h-4" />
              <span>Réessayer</span>
            </button>
            <button
              type="button"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all"
              @click="handleClear('/')"
            >
              <Home class="w-4 h-4 text-zinc-500" />
              <span>Retour à l'accueil</span>
            </button>
          </template>
        </div>

        <!-- Mode Développement : Stack Trace & Détails d'erreur -->
        <details
          v-if="isDev && (error?.message || error?.stack)"
          class="mt-6 text-left p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 space-y-2 overflow-hidden"
        >
          <summary class="font-bold cursor-pointer select-none flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
            <Terminal class="w-3.5 h-3.5" />
            <span>Détails techniques (Mode développement)</span>
          </summary>
          <div class="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 font-mono text-[11px]">
            <p v-if="error?.message" class="text-rose-600 dark:text-rose-400 font-semibold break-words">
              {{ error.message }}
            </p>
            <pre v-if="error?.stack" class="overflow-x-auto p-2 bg-zinc-200/50 dark:bg-zinc-900/80 rounded text-[10px] text-zinc-600 dark:text-zinc-400 leading-tight">{{ error.stack }}</pre>
          </div>
        </details>
      </div>
    </main>

    <!-- Minimal Footer -->
    <footer class="border-t border-zinc-200 dark:border-zinc-800/60 py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
      <span>BambuShare • Application de suivi de commandes groupées</span>
    </footer>
  </div>
</template>
