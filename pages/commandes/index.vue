<script setup lang="ts">
import { ref, onMounted, inject, type Ref, computed } from 'vue'
import StatusBadge from '~/components/StatusBadge.vue'
import OrderModal from '~/components/orders/OrderModal.vue'
import OrderCascadeModal from '~/components/orders/OrderCascadeModal.vue'
import {
  Package,
  Plus,
  Calendar,
  ChevronRight,
  Truck,
  CheckCheck
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const orders = ref<any[]>([])
const members = ref<any[]>([])
const demands = ref<any[]>([])
const loading = ref(true)
const orderModalOpen = ref(false)

const cascadeModalOpen = ref(false)
const selectedOrderForCascade = ref<any>(null)
const cascadeAction = ref<'RECEIVE' | 'DISTRIBUTE'>('RECEIVE')
const cascadeLoading = ref(false)

async function loadOrders() {
  loading.value = true
  try {
    const [o, m, d] = await Promise.all([
      $fetch('/api/orders'),
      $fetch('/api/members'),
      $fetch('/api/demands')
    ])
    orders.value = o as any[]
    members.value = m as any[]
    demands.value = d as any[]
  } catch (e) {
    console.error('Error loading orders', e)
  } finally {
    loading.value = false
  }
}

function promptCascade(order: any, action: 'RECEIVE' | 'DISTRIBUTE') {
  selectedOrderForCascade.value = order
  cascadeAction.value = action
  cascadeModalOpen.value = true
}

async function executeCascade() {
  if (!selectedOrderForCascade.value) return
  cascadeLoading.value = true
  try {
    await $fetch(`/api/orders/${selectedOrderForCascade.value.id}/cascade`, {
      method: 'POST',
      body: { action: cascadeAction.value }
    })
    cascadeModalOpen.value = false
    await loadOrders()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to execute cascade action', e)
  } finally {
    cascadeLoading.value = false
  }
}

watch(refreshKey, () => {
  loadOrders()
})

onMounted(() => {
  loadOrders()
})

const pendingDemands = computed(() => {
  return demands.value.filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE')
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Package class="w-6 h-6 text-bambu-500" />
          <span>Commandes groupées</span>
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Historique des paniers d'achats passés sur le store Bambu Lab.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-sm active:scale-95 transition-all"
        @click="orderModalOpen = true"
      >
        <Plus class="w-4 h-4" />
        <span>Nouvelle commande groupée</span>
      </button>
    </div>

    <!-- Orders Cards Grid -->
    <div v-if="loading" class="p-10 text-center text-xs text-zinc-400">
      Chargement des commandes...
    </div>

    <div v-else-if="orders.length === 0" class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-3 shadow-sm">
      <Package class="w-8 h-8 text-zinc-400 mx-auto" />
      <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Aucune commande groupée enregistrée</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bambu-500 text-white text-xs font-semibold shadow-sm"
        @click="orderModalOpen = true"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Créer une commande</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink
        v-for="o in orders"
        :key="o.id"
        :to="`/commandes/${o.id}`"
        class="group block rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition-all space-y-3"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-bold text-zinc-900 dark:text-white group-hover:text-bambu-600 dark:group-hover:text-bambu-400 transition-colors">
                #{{ o.orderNumber }}
              </span>
              <StatusBadge :status="o.status" type="order" size="sm" />
            </div>
            <div class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <Calendar class="w-3.5 h-3.5 text-zinc-400" />
              <span>Acheté le {{ o.purchaseDate }}</span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {{ o.totalAmount.toFixed(2) }} €
            </span>
            <span class="block text-[11px] text-zinc-400">
              {{ o.totalSpools }} bobine(s)
            </span>
          </div>
        </div>

        <div class="pt-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px]">
              {{ o.buyerName ? o.buyerName.charAt(0).toUpperCase() : '?' }}
            </span>
            <span class="text-zinc-600 dark:text-zinc-400 text-[11px]">
              Avancé par <strong class="text-zinc-900 dark:text-zinc-200">{{ o.buyerName }}</strong>
            </span>
          </div>

          <div class="flex items-center justify-between sm:justify-end gap-2">
            <!-- Action rapide en cascade : Marquer comme reçue (avec confirmation transparente) -->
            <button
              v-if="o.status !== 'LIVRE' && o.status !== 'CLOTURE'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900 transition-colors active:scale-95"
              @click.prevent.stop="promptCascade(o, 'RECEIVE')"
            >
              <Truck class="w-3 h-3" />
              <span>Marquer reçue</span>
            </button>

            <!-- Action rapide en cascade : Marquer comme distribuée (avec confirmation transparente) -->
            <button
              v-if="o.status === 'LIVRE'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors active:scale-95"
              @click.prevent.stop="promptCascade(o, 'DISTRIBUTE')"
            >
              <CheckCheck class="w-3 h-3" />
              <span>Marquer distribuée</span>
            </button>

            <span class="text-bambu-600 dark:text-bambu-400 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 text-[11px]">
              <span>Détail</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Order Modal -->
    <OrderModal
      v-model="orderModalOpen"
      :members="members"
      :pending-demands="pendingDemands"
      @created="loadOrders(); if (triggerRefresh) triggerRefresh()"
    />

    <!-- Order Cascade Modal explicatif -->
    <OrderCascadeModal
      v-if="selectedOrderForCascade"
      v-model="cascadeModalOpen"
      :order="selectedOrderForCascade"
      :action="cascadeAction"
      :loading="cascadeLoading"
      @confirm="executeCascade"
    />
  </div>
</template>
