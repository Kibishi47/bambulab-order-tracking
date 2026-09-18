<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import { ORDER_STATUSES } from '~/composables/useFilamentColors'
import {
  Package,
  ArrowLeft,
  Calendar,
  Trash2,
  Scale,
  CreditCard,
  Layers
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const triggerRefresh = inject<() => void>('triggerRefresh')

const orderId = Number(route.params.id)
const order = ref<any>(null)
const loading = ref(true)
const updatingStatus = ref(false)

// Settlement modal
const settlementModalOpen = ref(false)
const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()
const members = ref<any[]>([])

async function loadOrder() {
  loading.value = true
  try {
    const [o, m] = await Promise.all([
      $fetch(`/api/orders/${orderId}`),
      $fetch('/api/members')
    ])
    order.value = o
    members.value = m as any[]
  } catch (e) {
    console.error('Error loading order', e)
    router.push('/commandes')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})

async function onStatusChange(newStatus: string) {
  updatingStatus.value = true
  try {
    await $fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    await loadOrder()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to update order status', e)
  } finally {
    updatingStatus.value = false
  }
}

async function deleteOrder() {
  if (!confirm('Voulez-vous supprimer cette commande ? Les besoins associés seront déliés et replacés en statut "DEMANDE".')) {
    return
  }

  try {
    await $fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
    if (triggerRefresh) triggerRefresh()
    router.push('/commandes')
  } catch (e) {
    console.error('Failed to delete order', e)
  }
}

function openSettleForMember(memberId: number, amount: number) {
  prefillPayer.value = memberId
  prefillReceiver.value = order.value.buyerId
  prefillAmount.value = amount
  settlementModalOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button & Top bar -->
    <div class="flex items-center justify-between gap-4">
      <NuxtLink
        to="/commandes"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Retour aux commandes</span>
      </NuxtLink>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors"
        @click="deleteOrder"
      >
        <Trash2 class="w-3.5 h-3.5" />
        <span>Supprimer la commande</span>
      </button>
    </div>

    <div v-if="loading" class="p-10 text-center text-xs text-zinc-400">
      Chargement du détail de la commande...
    </div>

    <div v-else-if="order" class="space-y-6">
      <!-- Order Summary Card -->
      <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-xl font-mono font-bold text-zinc-900 dark:text-white tracking-tight">
                Commande #{{ order.orderNumber }}
              </h1>
              <StatusBadge :status="order.status" type="order" />
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
              <Calendar class="w-3.5 h-3.5 text-zinc-400" />
              <span>Achetée le {{ order.purchaseDate }}</span>
            </p>
          </div>

          <!-- Status Dropdown Quick Change -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">Statut :</span>
            <select
              :value="order.status"
              :disabled="updatingStatus"
              class="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-bambu-500 transition-colors"
              @change="onStatusChange(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="s in ORDER_STATUSES" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Montant total</span>
            <p class="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">{{ order.totalAmount.toFixed(2) }} €</p>
            <span class="text-[10px] text-zinc-400">Port inclus : {{ order.shippingFee.toFixed(2) }} €</span>
          </div>

          <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Acheteur</span>
            <p class="text-base font-bold text-bambu-600 dark:text-bambu-400 mt-0.5">{{ order.buyerName }}</p>
            <span class="text-[10px] text-zinc-500">{{ order.buyerEmail || 'Pas d\'email' }}</span>
          </div>

          <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Volume</span>
            <p class="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
              {{ order.demands?.reduce((sum: number, d: any) => sum + d.quantity, 0) || 0 }} bobines
            </p>
            <span class="text-[10px] text-zinc-400">{{ order.demands?.length || 0 }} article(s)</span>
          </div>
        </div>

        <div v-if="order.notes" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
          <strong class="text-zinc-800 dark:text-zinc-200">Notes :</strong> {{ order.notes }}
        </div>
      </div>

      <!-- Ventilation des coûts par membre -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Scale class="w-4 h-4 text-bambu-500" />
            <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Ventilation des coûts par membre
            </h2>
          </div>
          <span class="text-xs text-zinc-500">
            Fonds dus à <strong>{{ order.buyerName }}</strong>
          </span>
        </div>

        <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800/70 overflow-hidden shadow-sm">
          <div
            v-for="b in order.breakdown"
            :key="b.memberId"
            class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs">
                {{ b.memberName.charAt(0).toUpperCase() }}
              </span>
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-zinc-900 dark:text-white">{{ b.memberName }}</span>
                  <span v-if="b.memberId === order.buyerId" class="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                    Acheteur
                  </span>
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {{ b.spoolsCount }} bobine(s)
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 self-end sm:self-center">
              <div class="text-right">
                <span class="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                  {{ b.totalCost.toFixed(2) }} €
                </span>
                <span v-if="b.memberId === order.buyerId" class="block text-[10px] text-zinc-400">
                  (Sa part)
                </span>
                <span v-else class="block text-[10px] text-amber-600 dark:text-amber-400">
                  À rembourser
                </span>
              </div>

              <button
                v-if="b.memberId !== order.buyerId"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-bambu-500 text-white hover:bg-bambu-600 transition-all shadow-sm"
                @click="openSettleForMember(b.memberId, b.totalCost)"
              >
                <CreditCard class="w-3 h-3" />
                <span>Rembourser</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Articles inclus dans ce panier -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-bambu-500" />
          <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Articles inclus ({{ order.demands?.length || 0 }})
          </h2>
        </div>

        <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800/70 overflow-hidden shadow-sm">
          <div
            v-for="d in order.demands"
            :key="d.id"
            class="p-3.5 flex items-center justify-between gap-3"
          >
            <div class="space-y-0.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-zinc-900 dark:text-white">{{ d.memberName }}</span>
                <span class="text-zinc-300 dark:text-zinc-600">•</span>
                <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{{ d.quantity }}x</span>
                <BadgeFilament
                  :type="d.filamentType"
                  :format="d.format"
                  :color-name="d.colorName"
                  :color-hex="d.colorHex"
                  size="sm"
                />
              </div>
              <p v-if="d.notes" class="text-[11px] text-zinc-500 dark:text-zinc-400 italic">"{{ d.notes }}"</p>
            </div>

            <div class="text-right">
              <span class="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-200">
                {{ (d.quantity * (d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
              </span>
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
      @created="loadOrder(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
