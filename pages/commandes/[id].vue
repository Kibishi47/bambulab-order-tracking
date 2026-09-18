<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import SettlementModal from '~/components/settlements/SettlementModal.vue'
import OrderEditModal from '~/components/orders/OrderEditModal.vue'
import OrderCascadeModal from '~/components/orders/OrderCascadeModal.vue'
import { ORDER_STATUSES } from '~/composables/useFilamentColors'
import {
  Package,
  ArrowLeft,
  Calendar,
  Scale,
  CreditCard,
  Layers,
  Truck,
  CheckCheck,
  Edit2
} from 'lucide-vue-next'
import {
  OrderStatus,
  type CascadeAction,
  type FilamentDemandDTO,
  type GroupOrderDTO,
  type MemberDTO
} from '~/types'

const route = useRoute()
const router = useRouter()
const triggerRefresh = inject<() => void>('triggerRefresh')

const orderId = Number(route.params.id)
const order = ref<GroupOrderDTO | null>(null)
const loading = ref(true)
const updatingStatus = ref(false)
const cascadeLoading = ref(false)
const cascadeModalOpen = ref(false)
const cascadeAction = ref<CascadeAction>('RECEIVE')
const orderEditModalOpen = ref(false)

// Settlement modal
const settlementModalOpen = ref(false)
const prefillPayer = ref<number>()
const prefillReceiver = ref<number>()
const prefillAmount = ref<number>()
const members = ref<MemberDTO[]>([])

async function loadOrder() {
  loading.value = true
  try {
    const [o, m] = await Promise.all([
      $fetch<GroupOrderDTO>(`/api/orders/${orderId}`),
      $fetch<MemberDTO[]>('/api/members')
    ])
    order.value = o
    members.value = m
  } catch (e) {
    console.error('Error loading order', e)
    router.push('/commandes')
  } finally {
    loading.value = false
  }
}

const totalOrderSpools = computed(() => {
  return order.value?.demands?.reduce((sum: number, d: FilamentDemandDTO) => sum + d.quantity, 0) || 0
})

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

function promptCascade(action: 'RECEIVE' | 'DISTRIBUTE') {
  cascadeAction.value = action
  cascadeModalOpen.value = true
}

async function executeCascade() {
  cascadeLoading.value = true
  try {
    await $fetch(`/api/orders/${orderId}/cascade`, {
      method: 'POST',
      body: { action: cascadeAction.value }
    })
    cascadeModalOpen.value = false
    await loadOrder()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Failed to execute cascade action', e)
  } finally {
    cascadeLoading.value = false
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
    <!-- Back button & Top bar with Contextual Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <NuxtLink
        to="/commandes"
        class="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>Retour aux commandes</span>
      </NuxtLink>

      <div class="flex items-center gap-2 flex-wrap">
        <!-- Action rapide : Marquer comme reçue (cascade avec modal explicatif) -->
        <button
          v-if="order && order.status !== OrderStatus.RECEIVED && order.status !== OrderStatus.DISTRIBUTED"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
          @click="promptCascade('RECEIVE')"
        >
          <Truck class="w-3.5 h-3.5" />
          <span>Marquer comme reçue</span>
        </button>

        <!-- Action rapide : Marquer comme distribuée (cascade avec modal explicatif) -->
        <button
          v-if="order && order.status === OrderStatus.RECEIVED"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
          @click="promptCascade('DISTRIBUTE')"
        >
          <CheckCheck class="w-3.5 h-3.5" />
          <span>Marquer comme distribuée</span>
        </button>

        <!-- Bouton Édition manuelle complète (la suppression sécurisée s'y trouve) -->
        <button
          v-if="order"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold shadow-sm transition-colors"
          @click="orderEditModalOpen = true"
        >
          <Edit2 class="w-3.5 h-3.5" />
          <span>Modifier la commande</span>
        </button>
      </div>
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
            <span class="text-[10px] text-zinc-400">
              Port : {{ order.shippingFee.toFixed(2) }} € ({{ order.shippingSplitMethod }})
              <span v-if="order.discountPercentage && order.discountPercentage > 0" class="text-bambu-600 dark:text-bambu-400 font-semibold">
                • Remise : -{{ order.discountPercentage }}%
              </span>
            </span>
          </div>

          <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Acheteur</span>
            <p class="text-base font-bold text-bambu-600 dark:text-bambu-400 mt-0.5">{{ order.buyerName }}</p>
            <span class="text-[10px] text-zinc-500">{{ order.buyerEmail || 'Pas d\'email' }}</span>
          </div>

          <div class="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80">
            <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Volume</span>
            <p class="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
              {{ totalOrderSpools }} bobine(s)
            </p>
            <span class="text-[10px] text-zinc-400">{{ order.demands?.length || 0 }} besoin(s)</span>
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
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ b.memberName }}</span>
                <span
                  v-if="b.memberId === order.buyerId"
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bambu-100 text-bambu-800 dark:bg-bambu-500/20 dark:text-bambu-300"
                >
                  Acheteur
                </span>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">
                {{ b.spoolsCount }} bobine(s) • {{ b.itemsCount }} besoin(s)
              </p>
            </div>

            <div class="flex items-center gap-4 sm:gap-6 justify-between sm:justify-end">
              <div class="text-left sm:text-right">
                <span class="text-[10px] text-zinc-400 block uppercase">Filaments</span>
                <span class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ b.filamentCost.toFixed(2) }} €
                </span>
              </div>

              <div class="text-left sm:text-right">
                <span class="text-[10px] text-zinc-400 block uppercase">Port</span>
                <span class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ b.shippingShare.toFixed(2) }} €
                </span>
              </div>

              <div class="text-right">
                <span class="text-[10px] text-zinc-400 block uppercase">Total dû</span>
                <span class="text-sm font-mono font-bold text-bambu-600 dark:text-bambu-400">
                  {{ b.totalCost.toFixed(2) }} €
                </span>
              </div>

              <button
                v-if="b.memberId !== order.buyerId"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 text-xs font-semibold transition-colors active:scale-95"
                @click="openSettleForMember(b.memberId, b.totalCost)"
              >
                <CreditCard class="w-3.5 h-3.5" />
                <span>Rembourser</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Besoins inclus dans ce panier -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <Layers class="w-4 h-4 text-bambu-500" />
          <h2 class="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Besoins inclus ({{ order.demands?.length || 0 }} besoin(s) • {{ totalOrderSpools }} bobine(s))
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
                <span
                  v-if="d.payerMemberName"
                  class="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 whitespace-nowrap"
                  :title="`Article offert et pris en charge par ${d.payerMemberName}`"
                >
                  <span>🎁</span>
                  <span>Offert par <strong>{{ d.payerMemberName }}</strong></span>
                </span>
                <span
                  v-if="order.discountPercentage && order.discountPercentage > 0 && d.isDiscountEligible === false"
                  class="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                >
                  Hors remise
                </span>
                <span class="text-zinc-300 dark:text-zinc-600">•</span>
                <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">{{ d.quantity }} bobine(s)</span>
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
              <div v-if="order.discountPercentage && order.discountPercentage > 0 && d.isDiscountEligible !== false && (d.effectiveUnitPrice ?? d.actualUnitPrice) !== d.estimatedUnitPrice" class="flex flex-col items-end">
                <span class="text-[10px] text-zinc-400 line-through font-mono">
                  {{ (d.quantity * d.estimatedUnitPrice).toFixed(2) }} €
                </span>
                <span class="text-xs font-bold font-mono text-bambu-600 dark:text-bambu-400">
                  {{ (d.quantity * (d.effectiveUnitPrice ?? d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
                </span>
                <span class="text-[9px] text-zinc-400 font-mono">
                  ({{ (d.effectiveUnitPrice ?? d.actualUnitPrice ?? d.estimatedUnitPrice).toFixed(2) }} €/u)
                </span>
              </div>
              <div v-else>
                <span class="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-200">
                  {{ (d.quantity * (d.effectiveUnitPrice ?? d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
                </span>
              </div>
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

    <!-- Order Edit Modal -->
    <OrderEditModal
      v-if="order"
      v-model="orderEditModalOpen"
      :order="order"
      :members="members"
      @updated="loadOrder(); if (triggerRefresh) triggerRefresh()"
      @deleted="if (triggerRefresh) triggerRefresh(); router.push('/commandes')"
    />

    <!-- Order Cascade Modal explicatif -->
    <OrderCascadeModal
      v-if="order"
      v-model="cascadeModalOpen"
      :order="order"
      :action="cascadeAction"
      :loading="cascadeLoading"
      @confirm="executeCascade"
    />
  </div>
</template>
