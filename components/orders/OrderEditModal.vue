<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import ConfirmModal from '~/components/ui/ConfirmModal.vue'
import DatePicker from '~/components/DatePicker.vue'
import { ORDER_STATUSES } from '~/composables/useFilamentColors'
import { OrderStatus, ShippingSplitMode, type GroupOrderDTO } from '~/types'
import { Edit2, Trash2, Calendar, Hash, User, Euro, Truck, Percent } from 'lucide-vue-next'
import { VOLUME_DISCOUNT_TIERS } from '~/utils/pricing'
import { formatShippingSplitMode } from '~/utils/labels'

const props = defineProps<{
  modelValue: boolean
  order: GroupOrderDTO | null
  members: Array<{ id: number, name: string }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'updated'): void
  (e: 'deleted'): void
}>()

const orderNumber = ref('')
const buyerId = ref<number | ''>('')
const purchaseDate = ref('')
const status = ref<OrderStatus>(OrderStatus.ORDERED)
const totalAmount = ref<number | ''>('')
const shippingFee = ref<number | ''>(0)
const shippingSplitMethod = ref<ShippingSplitMode>(ShippingSplitMode.EQUAL)
const discountPercentage = ref(0)
const notes = ref('')

const loading = ref(false)
const deleting = ref(false)
const errorMessage = ref('')

function setDiscountTier(percentage: number) {
  discountPercentage.value = percentage
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.order) {
    errorMessage.value = ''
    orderNumber.value = props.order.orderNumber || ''
    buyerId.value = props.order.buyerId || ''
    purchaseDate.value = props.order.purchaseDate || new Date().toISOString().slice(0, 10)
    status.value = props.order.status || OrderStatus.ORDERED
    totalAmount.value = props.order.totalAmount !== undefined ? props.order.totalAmount : ''
    shippingFee.value = props.order.shippingFee !== undefined ? props.order.shippingFee : 0
    shippingSplitMethod.value = props.order.shippingSplitMethod === ShippingSplitMode.PRO_RATA ? ShippingSplitMode.PRO_RATA : ShippingSplitMode.EQUAL
    discountPercentage.value = props.order.discountPercentage !== undefined ? props.order.discountPercentage : 0
    notes.value = props.order.notes || ''
  }
})

async function submit() {
  if (!orderNumber.value.trim()) {
    errorMessage.value = 'Le numéro de commande est obligatoire'
    return
  }
  if (!buyerId.value) {
    errorMessage.value = 'Veuillez sélectionner un acheteur'
    return
  }
  if (totalAmount.value === '' || Number(totalAmount.value) < 0) {
    errorMessage.value = 'Le montant total doit être valide'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/orders/${props.order.id}`, {
      method: 'PUT',
      body: {
        orderNumber: orderNumber.value.trim(),
        buyerId: Number(buyerId.value),
        purchaseDate: purchaseDate.value,
        status: status.value,
        totalAmount: Number(totalAmount.value),
        shippingFee: Number(shippingFee.value || 0),
        shippingSplitMethod: shippingSplitMethod.value,
        discountPercentage: Number(discountPercentage.value || 0),
        notes: notes.value.trim() || null
      }
    })

    emit('updated')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la mise à jour de la commande'
  } finally {
    loading.value = false
  }
}

const confirmDeleteOpen = ref(false)

function promptDelete() {
  confirmDeleteOpen.value = true
}

async function executeDelete() {
  deleting.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/orders/${props.order.id}`, {
      method: 'DELETE'
    })

    confirmDeleteOpen.value = false
    emit('deleted')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la suppression de la commande'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Modifier la commande"
    :description="`Mise à jour des informations pour la commande #${order?.orderNumber || ''}`"
    max-width="max-w-xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form v-if="order" @submit.prevent="submit" class="space-y-4">
      <div v-if="errorMessage" class="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg">
        {{ errorMessage }}
      </div>

      <!-- Numéro de commande & Acheteur -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            N° Commande Bambu Lab *
          </label>
          <div class="relative">
            <Hash class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              v-model="orderNumber"
              type="text"
              required
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Acheteur (qui a avancé les fonds) *
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <select
              v-model="buyerId"
              required
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            >
              <option value="" disabled>Sélectionner un membre</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Date d'achat & Statut -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Date d'achat *
          </label>
          <DatePicker v-model="purchaseDate" required />
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Statut
          </label>
          <select
            v-model="status"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option v-for="s in ORDER_STATUSES" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Frais de port & Répartition -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Frais de port (€)
          </label>
          <div class="relative">
            <Euro class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              v-model.number="shippingFee"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Répartition des frais
          </label>
          <select
            v-model="shippingSplitMethod"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option :value="ShippingSplitMode.EQUAL">{{ formatShippingSplitMode(ShippingSplitMode.EQUAL) }}</option>
            <option :value="ShippingSplitMode.PRO_RATA">{{ formatShippingSplitMode(ShippingSplitMode.PRO_RATA) }}</option>
          </select>
        </div>
      </div>

      <!-- Remise par paliers Bambu Lab -->
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-1.5">
            <Percent class="w-3.5 h-3.5 text-bambu-500" />
            <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Remise globale (%)
            </label>
          </div>
          <div class="relative w-20">
            <input
              v-model.number="discountPercentage"
              type="number"
              min="0"
              max="100"
              step="1"
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-right text-xs font-bold text-bambu-600 dark:text-bambu-400 focus:outline-none focus:border-bambu-500"
            />
            <span class="absolute right-2 top-1 text-xs text-zinc-400 pointer-events-none">%</span>
          </div>
        </div>

        <div class="grid grid-cols-5 gap-1">
          <button
            v-for="tier in VOLUME_DISCOUNT_TIERS"
            :key="tier.percentage"
            type="button"
            class="px-1.5 py-1 rounded border text-[11px] font-medium transition-all text-center cursor-pointer"
            :class="[
              discountPercentage === tier.percentage
                ? 'bg-bambu-500 text-white border-bambu-500 font-bold'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-bambu-400'
            ]"
            @click="setDiscountTier(tier.percentage)"
          >
            <span>{{ tier.label }}</span>
          </button>
        </div>
      </div>

      <!-- Montant total réel payé -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Montant réel payé sur le store Bambu Lab (€) *
        </label>
        <div class="relative">
          <Euro class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            v-model.number="totalAmount"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Notes de suivi, transporteur, informations de remise
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex: Suivi DHL 123456789, colis arrivé, déposé à l'atelier..."
          class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
        />
      </div>

      <!-- Boutons d'actions -->
      <div class="flex items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <button
            type="button"
            :disabled="deleting || loading"
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
            @click="promptDelete"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            @click="emit('update:modelValue', false)"
          >
            Annuler
          </button>

          <button
            type="submit"
            :disabled="loading || deleting"
            class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <Edit2 class="w-4 h-4" />
            <span>{{ loading ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Modal de confirmation de suppression -->
    <ConfirmModal
      v-model="confirmDeleteOpen"
      title="Supprimer cette commande"
      :description="`Êtes-vous sûr de vouloir supprimer la commande #${order?.orderNumber || ''} ? Les besoins associés redeviendront automatiquement en attente de commande.`"
      confirm-text="Supprimer la commande"
      variant="danger"
      :loading="deleting"
      @confirm="executeDelete"
    />
  </Modal>
</template>
