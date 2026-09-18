<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import StatCard from '~/components/StatCard.vue'
import {
  Scale,
  Plus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  CreditCard,
  History,
  AlertCircle,
  HelpCircle
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const balancesData = ref<any>(null)
const settlements = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)

// Modal
const settlementModalOpen = ref(false)
const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()

async function loadData() {
  loading.value = true
  try {
    const [b, s, m] = await Promise.all([
      $fetch('/api/balances'),
      $fetch('/api/settlements'),
      $fetch('/api/members')
    ])
    balancesData.value = b
    settlements.value = s as any[]
    members.value = m as any[]
  } catch (e) {
    console.error('Error loading balances data', e)
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

function openQuickSettle(fromId: number, toId: number, amount: number) {
  prefillPayer.value = fromId
  prefillReceiver.value = toId
  prefillAmount.value = amount
  settlementModalOpen.value = true
}

async function deleteSettlement(id: number) {
  if (!confirm('Voulez-vous supprimer cet enregistrement de règlement ? Le solde des membres sera recalculé.')) {
    return
  }

  try {
    await $fetch(`/api/settlements/${id}`, { method: 'DELETE' })
    loadData()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to delete settlement', e)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Scale class="w-6 h-6 text-bambu-500" />
          <span>Règlements & Soldes des membres</span>
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Algorithme de simplification des remboursements ("Qui doit quoi à qui") et historique des virements.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-md shadow-bambu-500/20 active:scale-95 transition-all"
        @click="prefillPayer = undefined; prefillReceiver = undefined; prefillAmount = undefined; settlementModalOpen = true"
      >
        <Plus class="w-4 h-4" />
        <span>Enregistrer un remboursement</span>
      </button>
    </div>

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Dettes actives simplifiées"
        :value="balancesData?.simplifiedDebts?.length || 0"
        subtitle="Virements minimaux pour équilibrer"
        :icon="Scale"
        icon-color="bg-amber-500/10 text-amber-400 border-amber-500/20"
      />

      <StatCard
        title="Total des remboursements"
        :value="balancesData?.summary?.totalSettled ? `${balancesData.summary.totalSettled.toFixed(2)} €` : '0.00 €'"
        :subtitle="`${settlements.length} transaction(s) enregistrée(s)`"
        :icon="CreditCard"
        icon-color="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
      />

      <StatCard
        title="Total dépensé sur le store"
        :value="balancesData?.summary?.totalOrdersAmount ? `${balancesData.summary.totalOrdersAmount.toFixed(2)} €` : '0.00 €'"
        subtitle="Commandes Bambu Lab cumulées"
        :icon="History"
        icon-color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      />
    </div>

    <!-- Section 1 : Recommandations "Qui doit quoi à qui" -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Qui doit quoi à qui ?</span>
            <span class="text-xs font-normal text-zinc-400 font-sans">
              (Optimisation mathématique des flux de remboursement)
            </span>
          </h2>
        </div>
      </div>

      <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-6 shadow-lg shadow-black/20">
        <div v-if="loading" class="py-8 text-center text-xs text-zinc-500">
          Calcul des remboursements en cours...
        </div>

        <div
          v-else-if="!balancesData?.simplifiedDebts || balancesData.simplifiedDebts.length === 0"
          class="py-8 text-center space-y-2"
        >
          <div class="w-12 h-12 mx-auto rounded-full bg-bambu-500/10 border border-bambu-500/30 flex items-center justify-center text-bambu-400">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <p class="text-sm font-semibold text-zinc-200">Comptes parfaitement équilibrés !</p>
          <p class="text-xs text-zinc-500">Aucun membre n'a de dette en suspens.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(debt, idx) in balancesData.simplifiedDebts"
            :key="idx"
            class="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between gap-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="text-[11px] uppercase tracking-wider text-rose-400 font-bold">Débiteur</span>
                <p class="text-base font-bold text-white mt-0.5">{{ debt.fromMemberName }}</p>
              </div>

              <div class="text-center px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800">
                <span class="text-[10px] text-zinc-400 uppercase tracking-wider">Doit rembourser</span>
                <p class="text-base font-extrabold font-mono text-bambu-400">{{ debt.amount.toFixed(2) }} €</p>
              </div>

              <div class="text-right">
                <span class="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Créancier</span>
                <p class="text-base font-bold text-white mt-0.5">{{ debt.toMemberName }}</p>
              </div>
            </div>

            <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <span class="text-[11px] text-zinc-400">
                Via Lydia, PayPal ou virement
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 transition-all shadow-sm"
                @click="openQuickSettle(debt.fromMemberId, debt.toMemberId, debt.amount)"
              >
                <span>Solder cette dette</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2 : Tableau détaillé des soldes nets de chaque membre -->
    <div class="space-y-4">
      <h2 class="text-lg font-bold text-white tracking-tight">
        Tableau de synthèse des soldes nets individuels
      </h2>

      <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 overflow-x-auto shadow-lg shadow-black/20">
        <table class="w-full text-left text-xs">
          <thead class="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider border-b border-zinc-800 font-semibold">
            <tr>
              <th class="px-5 py-3">Membre</th>
              <th class="px-5 py-3 text-right">Fonds avancés</th>
              <th class="px-5 py-3 text-right">Filaments consommés</th>
              <th class="px-5 py-3 text-right">Remb. versés</th>
              <th class="px-5 py-3 text-right">Remb. reçus</th>
              <th class="px-5 py-3 text-right font-bold">Solde net</th>
              <th class="px-5 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/60 font-medium">
            <tr
              v-for="m in balancesData?.membersBalances"
              :key="m.memberId"
              class="hover:bg-zinc-900/30 transition-colors"
            >
              <td class="px-5 py-4 font-bold text-white">
                {{ m.memberName }}
              </td>
              <td class="px-5 py-4 text-right font-mono text-zinc-300">
                {{ m.totalAdvanced.toFixed(2) }} €
              </td>
              <td class="px-5 py-4 text-right font-mono text-zinc-300">
                {{ m.totalConsumed.toFixed(2) }} €
              </td>
              <td class="px-5 py-4 text-right font-mono text-zinc-400">
                {{ m.settlementsPaid.toFixed(2) }} €
              </td>
              <td class="px-5 py-4 text-right font-mono text-zinc-400">
                {{ m.settlementsReceived.toFixed(2) }} €
              </td>
              <td class="px-5 py-4 text-right font-mono font-bold text-sm">
                <span
                  :class="[
                    m.netBalance > 0.01 ? 'text-bambu-400' : (m.netBalance < -0.01 ? 'text-rose-400' : 'text-zinc-400')
                  ]"
                >
                  {{ m.netBalance > 0 ? `+${m.netBalance.toFixed(2)}` : m.netBalance.toFixed(2) }} €
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  v-if="m.status === 'CREDITOR'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-bambu-500/15 text-bambu-400 border border-bambu-500/30"
                >
                  Créancier (+{{ m.netBalance.toFixed(2) }} €)
                </span>
                <span
                  v-else-if="m.status === 'DEBTOR'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30"
                >
                  Débiteur ({{ m.netBalance.toFixed(2) }} €)
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700"
                >
                  À jour (0.00 €)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Section 3 : Historique des remboursements -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <History class="w-5 h-5 text-bambu-400" />
          <span>Historique des règlements</span>
        </h2>
        <span class="text-xs text-zinc-400">
          {{ settlements.length }} virement(s) consigné(s)
        </span>
      </div>

      <div class="rounded-xl bg-[#14161a] border border-zinc-800/80 overflow-hidden shadow-lg shadow-black/20">
        <div v-if="settlements.length === 0" class="p-8 text-center text-xs text-zinc-500">
          Aucun règlement enregistré pour le moment.
        </div>

        <div v-else class="divide-y divide-zinc-800/60">
          <div
            v-for="s in settlements"
            :key="s.id"
            class="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2 text-xs flex-wrap">
                <span class="font-bold text-white">{{ s.payerName }}</span>
                <ArrowRight class="w-3 h-3 text-zinc-500" />
                <span class="font-bold text-white">{{ s.receiverName }}</span>
                <span class="text-zinc-600">•</span>
                <span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-semibold text-zinc-300 uppercase">
                  {{ s.paymentMethod }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-[11px] text-zinc-400">
                <span>Effectué le {{ s.settledAt }}</span>
                <span v-if="s.notes" class="italic text-zinc-400">"{{ s.notes }}"</span>
                <span v-if="s.orderNumber" class="text-bambu-400 font-mono">Commande #{{ s.orderNumber }}</span>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <span class="text-sm font-bold font-mono text-zinc-100">
                {{ s.amount.toFixed(2) }} €
              </span>
              <button
                type="button"
                class="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Supprimer ce virement"
                @click="deleteSettlement(s.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settlement Modal -->
    <SettlementModal
      v-model="settlementModalOpen"
      :members="members"
      :prefill-payer-id="prefillPayer"
      :prefill-receiver-id="prefillReceiver"
      :prefill-amount="prefillAmount"
      @created="loadData(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
