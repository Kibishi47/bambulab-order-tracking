<script setup lang="ts">
import { ref, inject, type Ref, onMounted, computed } from 'vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import OrderModal from '~/components/orders/OrderModal.vue'
import DemandModal from '~/components/demands/DemandModal.vue'
import {
  Scale,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Layers,
  Edit2,
  CheckCircle,
  Truck,
  PackageCheck
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const balancesData = ref<any>(null)
const demands = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)

// Modals
const settlementModalOpen = ref(false)
const orderModalOpen = ref(false)
const demandModalOpen = ref(false)
const demandToEdit = ref<any | null>(null)

const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()

async function loadData() {
  loading.value = true
  try {
    const [b, d, m] = await Promise.all([
      $fetch('/api/balances'),
      $fetch('/api/demands'),
      $fetch('/api/members')
    ])
    balancesData.value = b
    demands.value = d as any[]
    members.value = m as any[]
  } catch (e) {
    console.error('Error fetching dashboard data', e)
  } finally {
    loading.value = false
  }
}

watch(refreshKey, () => {
  loadData()
})

onMounted(() => {
  loadData()
})

const pendingDemands = computed(() => {
  return demands.value.filter(d => d.status !== 'DISTRIBUE' && d.status !== 'ANNULE')
})

const totalPendingSpools = computed(() => {
  return demands.value
    .filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE')
    .reduce((sum, d) => sum + d.quantity, 0)
})

function openQuickSettle(fromId: number, toId: number, amount: number) {
  prefillPayer.value = fromId
  prefillReceiver.value = toId
  prefillAmount.value = amount
  settlementModalOpen.value = true
}

function openEditDemand(d: any) {
  demandToEdit.value = d
  demandModalOpen.value = true
}

async function quickAdvanceStatus(d: any) {
  const nextStatus = getNextStatus(d.status)?.next
  if (!nextStatus) return
  try {
    await $fetch(`/api/demands/${d.id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    loadData()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to advance status', e)
  }
}

function getNextStatus(status: string) {
  switch (status) {
    case 'DEMANDE':
      return { next: 'PRIS_EN_CHARGE', label: 'Prendre en charge', icon: CheckCircle }
    case 'PRIS_EN_CHARGE':
      return { next: 'COMMANDE', label: 'Commandé', icon: ShoppingBag }
    case 'COMMANDE':
      return { next: 'RECU', label: 'Reçu', icon: Truck }
    case 'RECU':
      return { next: 'DISTRIBUE', label: 'Distribué', icon: PackageCheck }
    default:
      return null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Commandes de filaments
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Suivi des besoins et remboursements simplifiés pour le groupe d'impression 3D.
        </p>
      </div>

      <div v-if="totalPendingSpools >= 4" class="flex items-center gap-2.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors"
          @click="orderModalOpen = true"
        >
          <ShoppingBag class="w-4 h-4 text-bambu-600 dark:text-bambu-400" />
          <span>Créer commande ({{ totalPendingSpools }} bobines)</span>
        </button>
      </div>
    </div>

    <!-- Seuil bambu lab alert (sobre) -->
    <div
      v-if="totalPendingSpools >= 4"
      class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-bambu-500" />
        <span>
          <strong>Seuil de remise atteint :</strong> {{ totalPendingSpools }} bobines sont prêtes pour la commande groupée (>= 4 bobines).
        </span>
      </div>
      <button
        type="button"
        class="font-semibold underline hover:opacity-80 flex-shrink-0"
        @click="orderModalOpen = true"
      >
        Passer commande
      </button>
    </div>

    <!-- 1. Récapitulatif compact des soldes ("Qui doit quoi à qui") -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Scale class="w-4 h-4 text-bambu-600 dark:text-bambu-400" />
          <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Qui doit quoi à qui ?
          </h2>
        </div>
        <NuxtLink to="/reglements" class="text-xs text-bambu-600 dark:text-bambu-400 hover:underline flex items-center gap-1">
          <span>Tous les comptes</span>
          <ChevronRight class="w-3 h-3" />
        </NuxtLink>
      </div>

      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
        <div v-if="loading" class="py-4 text-center text-xs text-zinc-400">
          Calcul des soldes...
        </div>

        <div
          v-else-if="!balancesData?.simplifiedDebts || balancesData.simplifiedDebts.length === 0"
          class="py-3 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
        >
          <CheckCircle2 class="w-4 h-4 text-bambu-500" />
          <span>Tous les comptes sont à jour. Aucune dette en cours.</span>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <div
            v-for="(debt, idx) in balancesData.simplifiedDebts"
            :key="idx"
            class="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3"
          >
            <div class="space-y-1 text-xs min-w-0">
              <div class="flex items-center gap-1.5 font-medium flex-wrap">
                <strong class="text-zinc-900 dark:text-white truncate max-w-[120px]">{{ debt.fromMemberName }}</strong>
                <ArrowRight class="w-3 h-3 text-zinc-400 shrink-0" />
                <strong class="text-zinc-900 dark:text-white truncate max-w-[120px]">{{ debt.toMemberName }}</strong>
              </div>
              <p class="font-mono font-bold text-bambu-600 dark:text-bambu-400 text-sm">
                {{ debt.amount.toFixed(2) }} €
              </p>
            </div>

            <button
              type="button"
              class="px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-sm shrink-0"
              @click="openQuickSettle(debt.fromMemberId, debt.toMemberId, debt.amount)"
            >
              Solder
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. Liste des besoins en cours -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-bambu-600 dark:text-bambu-400" />
          <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Besoins en cours ({{ pendingDemands.length }})
          </h2>
        </div>
        <NuxtLink to="/besoins" class="text-xs text-bambu-600 dark:text-bambu-400 hover:underline flex items-center gap-1">
          <span>Voir l'historique complet</span>
          <ChevronRight class="w-3 h-3" />
        </NuxtLink>
      </div>

      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/70">
        <div v-if="loading" class="p-8 text-center text-xs text-zinc-400">
          Chargement des besoins...
        </div>

        <div v-else-if="pendingDemands.length === 0" class="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
          <p>Aucun besoin de filament en cours.</p>
          <button
            type="button"
            class="text-bambu-600 dark:text-bambu-400 font-semibold hover:underline"
            @click="demandToEdit = null; demandModalOpen = true"
          >
            Ajouter une première bobine
          </button>
        </div>

        <div
          v-for="d in pendingDemands"
          :key="d.id"
          class="p-3.5 sm:p-4 flex flex-col gap-2.5 sm:grid sm:grid-cols-[1fr_130px_90px_180px] sm:items-center sm:gap-3 overflow-hidden"
        >
          <!-- Item info -->
          <div class="min-w-0 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-zinc-900 dark:text-white">{{ d.memberName }}</span>
              <span
                v-if="d.payerMemberName"
                class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 whitespace-nowrap"
                :title="`Article offert et pris en charge par ${d.payerMemberName}`"
              >
                <span>🎁</span>
                <span>Offert par <strong>{{ d.payerMemberName }}</strong></span>
              </span>
              <span class="text-zinc-400 text-xs">•</span>
              <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ d.quantity }}x</span>
              <BadgeFilament
                :type="d.filamentType"
                :format="d.format"
                :color-name="d.colorName"
                :color-hex="d.colorHex"
                size="sm"
              />
            </div>
            <div v-if="d.notes" class="text-[11px] text-zinc-500 dark:text-zinc-400 italic truncate" :title="d.notes">
              "{{ d.notes }}"
            </div>
          </div>

          <!-- Ligne statut & montant sur mobile (devient 2 colonnes distinctes sur sm) -->
          <div class="flex items-center justify-between w-full pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 sm:border-0 sm:pt-0 sm:contents">
            <!-- Status badge (Col 2: 130px) -->
            <div class="flex items-center sm:w-[130px] sm:justify-center">
              <StatusBadge :status="d.status" size="sm" class="w-full justify-center" />
            </div>

            <!-- Price (Col 3: 90px) -->
            <div class="text-right sm:w-[90px]">
              <span class="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {{ (d.quantity * (d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
              </span>
            </div>
          </div>

          <!-- Actions (Col 4: 180px) -->
          <div class="flex items-center justify-end gap-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60 sm:border-0 sm:pt-0 sm:w-[180px]">
            <!-- Edit Button (Pencil) -->
            <button
              type="button"
              class="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 flex-shrink-0"
              title="Modifier ce besoin"
              @click="openEditDemand(d)"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>

            <!-- Standardized Quick Next Status Button -->
            <div class="w-[120px] flex items-center justify-center flex-shrink-0">
              <button
                v-if="getNextStatus(d.status)"
                type="button"
                class="w-full inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors truncate active:scale-95"
                :title="getNextStatus(d.status)!.label"
                @click="quickAdvanceStatus(d)"
              >
                <component :is="getNextStatus(d.status)!.icon" class="w-3 h-3 text-bambu-600 dark:text-bambu-400 flex-shrink-0" />
                <span class="truncate">{{ getNextStatus(d.status)!.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Modale Enregistrement Virement -->
    <SettlementModal
      v-model="settlementModalOpen"
      :members="members"
      :prefill-payer-id="prefillPayer"
      :prefill-receiver-id="prefillReceiver"
      :prefill-amount="prefillAmount"
      @created="loadData(); if (triggerRefresh) triggerRefresh()"
    />

    <!-- Modale Création Commande -->
    <OrderModal
      v-model="orderModalOpen"
      :members="members"
      :pending-demands="pendingDemands"
      @created="loadData(); if (triggerRefresh) triggerRefresh()"
    />

    <!-- Modale Création / Édition Besoin -->
    <DemandModal
      v-model="demandModalOpen"
      :members="members"
      :demand-to-edit="demandToEdit"
      @created="loadData(); if (triggerRefresh) triggerRefresh()"
      @updated="loadData(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
