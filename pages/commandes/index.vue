<script setup lang="ts">
import { ref, onMounted, inject, type Ref, computed } from 'vue'
import StatusBadge from '~/components/StatusBadge.vue'
import OrderModal from '~/components/orders/OrderModal.vue'
import {
  Package,
  Plus,
  Calendar,
  User,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const orders = ref<any[]>([])
const members = ref<any[]>([])
const demands = ref<any[]>([])
const loading = ref(true)
const orderModalOpen = ref(false)

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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Package class="w-6 h-6 text-bambu-500" />
          <span>Commandes groupées Bambu Lab</span>
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Historique des paniers commandés sur le store officiel, répartition des coûts et statut de livraison.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-md shadow-bambu-500/20 active:scale-95 transition-all"
        @click="orderModalOpen = true"
      >
        <Plus class="w-4 h-4" />
        <span>Nouvelle commande groupée</span>
      </button>
    </div>

    <!-- Orders Cards Grid -->
    <div v-if="loading" class="p-12 text-center text-xs text-zinc-500">
      Chargement des commandes groupées...
    </div>

    <div v-else-if="orders.length === 0" class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-12 text-center space-y-3">
      <Package class="w-8 h-8 text-zinc-600 mx-auto" />
      <p class="text-sm font-semibold text-zinc-300">Aucune commande groupée passée</p>
      <p class="text-xs text-zinc-500 max-w-sm mx-auto">
        Regroupez les besoins en attente dans une commande pour désigner l'acheteur et ventiler les coûts.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bambu-500 text-white text-xs font-semibold"
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
        class="group block rounded-xl bg-[#14161a] border border-zinc-800/80 p-5 shadow-lg shadow-black/20 hover:border-bambu-500/60 transition-all space-y-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-bold text-white group-hover:text-bambu-400 transition-colors">
                #{{ o.orderNumber }}
              </span>
              <StatusBadge :status="o.status" type="order" size="sm" />
            </div>
            <div class="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <Calendar class="w-3.5 h-3.5 text-zinc-500" />
              <span>Acheté le {{ o.purchaseDate }}</span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-lg font-bold font-mono text-zinc-100">
              {{ o.totalAmount.toFixed(2) }} €
            </span>
            <span class="block text-[11px] text-zinc-500">
              {{ o.totalSpools }} bobine(s)
            </span>
          </div>
        </div>

        <div class="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[11px] text-bambu-400">
              {{ o.buyerName ? o.buyerName.charAt(0).toUpperCase() : '?' }}
            </span>
            <span class="text-zinc-300 font-medium">
              Payé par <strong class="text-white">{{ o.buyerName }}</strong>
            </span>
          </div>

          <span class="text-bambu-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            <span>Détail</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </span>
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
  </div>
</template>
