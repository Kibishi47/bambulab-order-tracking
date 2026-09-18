<script setup lang="ts">
import { ref, onMounted, inject, type Ref, watch } from 'vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import {
  Scale,
  Plus,
  ArrowRight,
  CheckCircle2,
  Edit2,
  CreditCard,
  History
} from 'lucide-vue-next'
import type {
  BalancesResponseDTO,
  MemberDTO,
  SettlementDTO
} from '~/types'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const balancesData = ref<BalancesResponseDTO | null>(null)
const settlements = ref<SettlementDTO[]>([])
const members = ref<MemberDTO[]>([])
const loading = ref(true)

// Modal
const settlementModalOpen = ref(false)
const settlementToEdit = ref<SettlementDTO | null>(null)
const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()

async function loadData() {
  loading.value = true
  try {
    const [b, s, m] = await Promise.all([
      $fetch<BalancesResponseDTO>('/api/balances'),
      $fetch<SettlementDTO[]>('/api/settlements'),
      $fetch<MemberDTO[]>('/api/members')
    ])
    balancesData.value = b
    settlements.value = s
    members.value = m
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
  settlementToEdit.value = null
  prefillPayer.value = fromId
  prefillReceiver.value = toId
  prefillAmount.value = amount
  settlementModalOpen.value = true
}

function openEditSettlement(s: SettlementDTO) {
  settlementToEdit.value = s
  settlementModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Scale class="w-6 h-6 text-bambu-500" />
          <span>Règlements & Soldes</span>
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Compensation des dettes ("Qui doit quoi à qui") et historique des virements.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-sm active:scale-95 transition-all"
        @click="settlementToEdit = null; prefillPayer = undefined; prefillReceiver = undefined; prefillAmount = undefined; settlementModalOpen = true"
      >
        <Plus class="w-4 h-4" />
        <span>Enregistrer un remboursement</span>
      </button>
    </div>

    <!-- Section 1 : Recommandations "Qui doit quoi à qui" -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Qui doit quoi à qui ?
        </h2>
        <span class="text-xs text-zinc-500 dark:text-zinc-400">
          Minimisation des virements nécessaires
        </span>
      </div>

      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
        <div v-if="loading" class="py-6 text-center text-xs text-zinc-400">
          Calcul des remboursements en cours...
        </div>

        <div
          v-else-if="!balancesData?.simplifiedDebts || balancesData.simplifiedDebts.length === 0"
          class="py-6 text-center space-y-1.5"
        >
          <div class="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-bambu-500">
            <CheckCircle2 class="w-5 h-5" />
          </div>
          <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Comptes parfaitement équilibrés</p>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Aucun membre n'a de dette en suspens.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="(debt, idx) in balancesData.simplifiedDebts"
            :key="idx"
            class="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">Débiteur</span>
                <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ debt.fromMemberName }}</p>
              </div>

              <div class="text-center px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span class="text-[9px] text-zinc-500 uppercase tracking-wider block">Montant</span>
                <p class="text-sm font-extrabold font-mono text-bambu-600 dark:text-bambu-400">{{ debt.amount.toFixed(2) }} €</p>
              </div>

              <div class="text-right">
                <span class="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">Créancier</span>
                <p class="text-sm font-bold text-zinc-900 dark:text-white">{{ debt.toMemberName }}</p>
              </div>
            </div>

            <div class="pt-2.5 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
                Wero / Virement / PayPal
              </span>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-sm"
                @click="openQuickSettle(debt.fromMemberId, debt.toMemberId, debt.amount)"
              >
                <span>Solder</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2 : Tableau des soldes individuels -->
    <section class="space-y-3">
      <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        Synthèse des soldes individuels
      </h2>

      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 font-semibold text-[11px]">
            <tr>
              <th class="px-4 py-2.5">Membre</th>
              <th class="px-4 py-2.5 text-right">Fonds avancés</th>
              <th class="px-4 py-2.5 text-right">Filaments consommés</th>
              <th class="px-4 py-2.5 text-right">Remb. versés</th>
              <th class="px-4 py-2.5 text-right">Remb. reçus</th>
              <th class="px-4 py-2.5 text-right font-bold">Solde net</th>
              <th class="px-4 py-2.5 text-center">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-medium">
            <tr
              v-for="m in balancesData?.membersBalances"
              :key="m.memberId"
            >
              <td class="px-4 py-3 font-bold text-zinc-900 dark:text-white">
                {{ m.memberName }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                {{ m.totalAdvanced.toFixed(2) }} €
              </td>
              <td class="px-4 py-3 text-right font-mono text-zinc-700 dark:text-zinc-300">
                {{ m.totalConsumed.toFixed(2) }} €
              </td>
              <td class="px-4 py-3 text-right font-mono text-zinc-500 dark:text-zinc-400">
                {{ m.settlementsPaid.toFixed(2) }} €
              </td>
              <td class="px-4 py-3 text-right font-mono text-zinc-500 dark:text-zinc-400">
                {{ m.settlementsReceived.toFixed(2) }} €
              </td>
              <td class="px-4 py-3 text-right font-mono font-bold text-xs">
                <span
                  :class="[
                    m.netBalance > 0.01 ? 'text-bambu-600 dark:text-bambu-400' : (m.netBalance < -0.01 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500')
                  ]"
                >
                  {{ m.netBalance > 0 ? `+${m.netBalance.toFixed(2)}` : m.netBalance.toFixed(2) }} €
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  v-if="m.status === 'CREDITOR'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30"
                >
                  Créancier (+{{ m.netBalance.toFixed(2) }} €)
                </span>
                <span
                  v-else-if="m.status === 'DEBTOR'"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30"
                >
                  Débiteur ({{ m.netBalance.toFixed(2) }} €)
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                >
                  À jour
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Section 3 : Historique des remboursements -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          <History class="w-4 h-4 text-bambu-500" />
          <span>Historique des règlements ({{ settlements.length }})</span>
        </h2>
      </div>

      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div v-if="settlements.length === 0" class="p-8 text-center text-xs text-zinc-500">
          Aucun règlement enregistré pour le moment.
        </div>

        <div v-else class="divide-y divide-zinc-200 dark:divide-zinc-800/70">
          <div
            v-for="s in settlements"
            :key="s.id"
            class="p-3 sm:p-4 flex items-center justify-between gap-3"
          >
            <div class="space-y-0.5">
              <div class="flex items-center gap-2 text-xs flex-wrap">
                <span class="font-bold text-zinc-900 dark:text-white">{{ s.payerName }}</span>
                <ArrowRight class="w-3 h-3 text-zinc-400" />
                <span class="font-bold text-zinc-900 dark:text-white">{{ s.receiverName }}</span>
                <span class="text-zinc-300 dark:text-zinc-600">•</span>
                <span class="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
                  {{ s.paymentMethod }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>Le {{ s.settledAt }}</span>
                <span v-if="s.notes" class="italic">"{{ s.notes }}"</span>
                <span v-if="s.orderNumber" class="text-bambu-600 dark:text-bambu-400 font-mono">#{{ s.orderNumber }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {{ s.amount.toFixed(2) }} €
              </span>
              <button
                type="button"
                class="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Consulter ou supprimer ce virement"
                @click="openEditSettlement(s)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Settlement Modal -->
    <SettlementModal
      v-model="settlementModalOpen"
      :members="members"
      :settlement-to-edit="settlementToEdit"
      :prefill-payer-id="prefillPayer"
      :prefill-receiver-id="prefillReceiver"
      :prefill-amount="prefillAmount"
      @created="loadData(); if (triggerRefresh) triggerRefresh()"
      @updated="loadData(); if (triggerRefresh) triggerRefresh()"
      @deleted="loadData(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
