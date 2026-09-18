<script setup lang="ts">
import { ref, inject, type Ref, onMounted, computed } from 'vue'
import StatCard from '~/components/StatCard.vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import OrderModal from '~/components/orders/OrderModal.vue'
import {
  Layers,
  Package,
  Scale,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const balancesData = ref<any>(null)
const demands = ref<any[]>([])
const orders = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)

// Modals
const settlementModalOpen = ref(false)
const orderModalOpen = ref(false)
const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()

async function loadData() {
  loading.value = true
  try {
    const [b, d, o, m] = await Promise.all([
      $fetch('/api/balances'),
      $fetch('/api/demands'),
      $fetch('/api/orders'),
      $fetch('/api/members')
    ])
    balancesData.value = b
    demands.value = d as any[]
    orders.value = o as any[]
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
  return demands.value.filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE')
})

const totalPendingSpools = computed(() => {
  return pendingDemands.value.reduce((sum, d) => sum + d.quantity, 0)
})

function openQuickSettle(fromId: number, toId: number, amount: number) {
  prefillPayer.value = fromId
  prefillReceiver.value = toId
  prefillAmount.value = amount
  settlementModalOpen.value = true
}

async function quickUpdateDemandStatus(id: number, newStatus: string) {
  try {
    await $fetch(`/api/demands/${id}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    loadData()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to update status', e)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header Hero Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#13161c] via-[#161a22] to-[#111317] border border-zinc-800 p-6 sm:p-8 shadow-xl">
      <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-bambu-500/10 border border-bambu-500/30 text-bambu-400 text-xs font-semibold mb-3">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Gestionnaire groupé de filaments Bambu Lab</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Groupement d'achats Bambu Lab
          </h1>
          <p class="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Centralisez les besoins de vos amis, commandez au meilleur tarif avec les remises quantitatives du store Bambu Lab et gardez une transparence totale sur qui doit quoi à qui.
          </p>
        </div>

        <!-- Quick actions -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 transition-all shadow-lg shadow-bambu-500/25 active:scale-95"
            @click="orderModalOpen = true"
          >
            <ShoppingBag class="w-4 h-4" />
            <span>Créer une commande</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all"
            @click="settlementModalOpen = true"
          >
            <Scale class="w-4 h-4 text-bambu-400" />
            <span>Enregistrer un virement</span>
          </button>
        </div>
      </div>

      <!-- Free shipping alert banner if pending spools >= 4 -->
      <div
        v-if="totalPendingSpools >= 4"
        class="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4 text-xs"
      >
        <div class="flex items-center gap-2.5 text-emerald-400">
          <CheckCircle2 class="w-4 h-4 text-bambu-400 flex-shrink-0" />
          <span>
            <strong>Seuil avantageux atteint !</strong> Vous avez <strong>{{ totalPendingSpools }} bobines</strong> en attente. Le seuil de remise quantitative Bambu Lab (>= 4 bobines) est débloqué !
          </span>
        </div>
        <button
          type="button"
          class="text-xs font-semibold text-bambu-400 hover:underline flex items-center gap-1"
          @click="orderModalOpen = true"
        >
          <span>Lancer la commande</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- KPI Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Commandes cumulées"
        :value="balancesData?.summary?.totalOrdersAmount ? `${balancesData.summary.totalOrdersAmount.toFixed(2)} €` : '0.00 €'"
        :subtitle="`${orders.length} commande(s) groupée(s)`"
        :icon="Package"
        icon-color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      />

      <StatCard
        title="Bobines en attente"
        :value="totalPendingSpools"
        :subtitle="`${pendingDemands.length} demande(s) ouverte(s)`"
        :icon="Layers"
        icon-color="bg-amber-500/10 text-amber-400 border-amber-500/20"
        :badge="totalPendingSpools >= 4 ? 'Prêt à commander' : 'En constitution'"
        :badge-color="totalPendingSpools >= 4 ? 'bg-bambu-500/15 text-bambu-400 border-bambu-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'"
      />

      <StatCard
        title="Règlements effectués"
        :value="balancesData?.summary?.totalSettled ? `${balancesData.summary.totalSettled.toFixed(2)} €` : '0.00 €'"
        subtitle="Remboursements entre membres"
        :icon="Scale"
        icon-color="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      />

      <StatCard
        title="Membres du groupe"
        :value="members.length"
        subtitle="Amis participant aux commandes"
        :icon="Users"
        icon-color="bg-purple-500/10 text-purple-400 border-purple-500/20"
      />
    </div>

    <!-- Main Two Columns: Qui doit quoi à qui + Commandes en cours -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Section Gauche: Qui doit quoi à qui (Simplification des dettes) -->
      <div class="lg:col-span-7 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Scale class="w-4 h-4 text-bambu-400" />
            <h2 class="text-base font-bold text-white tracking-tight">
              Qui doit quoi à qui ?
            </h2>
          </div>
          <NuxtLink to="/reglements" class="text-xs text-bambu-400 hover:underline flex items-center gap-1">
            <span>Détail des comptes</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>

        <!-- Card Container -->
        <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-5 shadow-lg shadow-black/20">
          <div v-if="loading" class="py-8 text-center text-zinc-500 text-xs">
            Calcul des soldes en cours...
          </div>

          <div
            v-else-if="!balancesData?.simplifiedDebts || balancesData.simplifiedDebts.length === 0"
            class="py-8 text-center space-y-2"
          >
            <div class="w-10 h-10 mx-auto rounded-full bg-bambu-500/10 border border-bambu-500/30 flex items-center justify-center text-bambu-400">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <p class="text-sm font-semibold text-zinc-200">Tous les comptes sont à jour !</p>
            <p class="text-xs text-zinc-500">Aucune dette en cours entre les membres.</p>
          </div>

          <div v-else class="space-y-3">
            <p class="text-xs text-zinc-400 mb-2">
              Algorithme de simplification actif : {{ balancesData.simplifiedDebts.length }} virement(s) suffisent pour solder la totalité des comptes.
            </p>

            <div
              v-for="(debt, idx) in balancesData.simplifiedDebts"
              :key="idx"
              class="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-zinc-700 transition-all"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xs">
                  {{ debt.fromMemberName.charAt(0).toUpperCase() }}
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-bold text-white">{{ debt.fromMemberName }}</span>
                  <span class="text-zinc-500">doit</span>
                  <span class="font-bold text-sm text-bambu-400">{{ debt.amount.toFixed(2) }} €</span>
                  <span class="text-zinc-500">à</span>
                  <span class="font-bold text-white">{{ debt.toMemberName }}</span>
                </div>
              </div>

              <button
                type="button"
                class="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-bambu-500/15 hover:bg-bambu-500/25 border border-bambu-500/40 text-bambu-400 text-xs font-semibold transition-all"
                @click="openQuickSettle(debt.fromMemberId, debt.toMemberId, debt.amount)"
              >
                <span>Solder</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Besoins en attente récents -->
        <div class="pt-4 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-bambu-400" />
              <h2 class="text-base font-bold text-white tracking-tight">
                Derniers besoins exprimés au fil de l'eau
              </h2>
            </div>
            <NuxtLink to="/besoins" class="text-xs text-bambu-400 hover:underline flex items-center gap-1">
              <span>Voir tout</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>

          <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 divide-y divide-zinc-800/60 overflow-hidden shadow-lg shadow-black/20">
            <div v-if="demands.length === 0" class="p-8 text-center text-xs text-zinc-500">
              Aucun besoin de filament exprimé pour le moment.
            </div>

            <div
              v-for="d in demands.slice(0, 5)"
              :key="d.id"
              class="p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white">{{ d.memberName }}</span>
                  <span class="text-zinc-500 text-xs">•</span>
                  <span class="text-xs font-semibold text-zinc-300">{{ d.quantity }}x</span>
                  <BadgeFilament
                    :type="d.filamentType"
                    :format="d.format"
                    :color-name="d.colorName"
                    :color-hex="d.colorHex"
                    size="sm"
                  />
                </div>
                <div v-if="d.notes" class="text-[11px] text-zinc-400 italic">
                  "{{ d.notes }}"
                </div>
              </div>

              <div class="flex items-center gap-3">
                <StatusBadge :status="d.status" size="sm" />
                <span class="text-xs font-mono font-bold text-zinc-200">
                  {{ (d.quantity * (d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Droite: Dernières commandes groupées -->
      <div class="lg:col-span-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Package class="w-4 h-4 text-bambu-400" />
            <h2 class="text-base font-bold text-white tracking-tight">
              Commandes groupées Bambu Lab
            </h2>
          </div>
          <NuxtLink to="/commandes" class="text-xs text-bambu-400 hover:underline flex items-center gap-1">
            <span>Toutes les commandes</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </NuxtLink>
        </div>

        <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-5 shadow-lg shadow-black/20 space-y-4">
          <div v-if="orders.length === 0" class="py-8 text-center text-zinc-500 text-xs">
            Aucune commande groupée enregistrée.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="o in orders.slice(0, 4)"
              :key="o.id"
              class="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
            >
              <div class="flex items-start justify-between">
                <div>
                  <NuxtLink :to="`/commandes/${o.id}`" class="text-xs font-mono font-bold text-bambu-400 hover:underline">
                    #{{ o.orderNumber }}
                  </NuxtLink>
                  <p class="text-[11px] text-zinc-400 mt-0.5">
                    Payé par <strong class="text-zinc-200">{{ o.buyerName }}</strong> le {{ o.purchaseDate }}
                  </p>
                </div>
                <StatusBadge :status="o.status" type="order" size="sm" />
              </div>

              <div class="flex items-center justify-between text-xs pt-2 border-t border-zinc-800/80">
                <span class="text-zinc-400">
                  {{ o.totalSpools }} bobine(s) ({{ o.itemCount }} type(s))
                </span>
                <span class="font-bold text-sm text-zinc-100">
                  {{ o.totalAmount.toFixed(2) }} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
  </div>
</template>
