<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import DatePicker from '~/components/DatePicker.vue'
import { PAYMENT_METHODS } from '~/composables/useFilamentColors'
import { ArrowRight, Check, Calendar, Euro } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  prefillPayerId?: number
  prefillReceiverId?: number
  prefillAmount?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
}>()

const payerId = ref<number | ''>('')
const receiverId = ref<number | ''>('')
const amount = ref<number | ''>('')
const paymentMethod = ref('WERO')
const settledAt = ref(new Date().toISOString().slice(0, 10))
const notes = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    payerId.value = props.prefillPayerId || ''
    receiverId.value = props.prefillReceiverId || ''
    amount.value = props.prefillAmount || ''
    paymentMethod.value = 'WERO'
  }
})

async function submit() {
  if (!payerId.value || !receiverId.value) {
    errorMessage.value = 'Le payeur et le bénéficiaire sont requis'
    return
  }
  if (payerId.value === receiverId.value) {
    errorMessage.value = 'Le payeur et le bénéficiaire doivent être différents'
    return
  }
  if (!amount.value || Number(amount.value) <= 0) {
    errorMessage.value = 'Le montant doit être supérieur à 0 €'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/settlements', {
      method: 'POST',
      body: {
        payerId: Number(payerId.value),
        receiverId: Number(receiverId.value),
        amount: Number(amount.value),
        paymentMethod: paymentMethod.value,
        settledAt: settledAt.value,
        notes: notes.value.trim() || null
      }
    })

    notes.value = ''
    amount.value = ''
    emit('created')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la saisie du remboursement'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Enregistrer un remboursement"
    description="Consignez un virement ou règlement effectué entre membres pour solder les comptes."
    max-width="max-w-xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="submit" class="space-y-4">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Flux Débiteur -> Créancier -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Qui a payé ? (Débiteur) *
          </label>
          <select
            v-model="payerId"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option value="" disabled selected>Sélectionner un membre...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Qui a reçu ? (Bénéficiaire) *
          </label>
          <select
            v-model="receiverId"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option value="" disabled selected>Sélectionner un membre...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Montant & Moyen de paiement -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Montant remboursé (€) *
          </label>
          <div class="relative">
            <Euro class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              v-model.number="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="33.98"
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Moyen de règlement *
          </label>
          <select
            v-model="paymentMethod"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option v-for="pm in PAYMENT_METHODS" :key="pm.value" :value="pm.value">
              {{ pm.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Date de règlement -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Date du règlement *
        </label>
        <DatePicker
          v-model="settledAt"
          required
          placeholder="Sélectionner la date du règlement"
        />
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Notes / Référence transaction
        </label>
        <input
          v-model="notes"
          type="text"
          placeholder="Ex: Virement Lydia, Ref commande #FR..."
          class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          @click="emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-sm disabled:opacity-50"
        >
          <Check class="w-4 h-4" />
          <span>{{ loading ? 'Enregistrement...' : 'Enregistrer le remboursement' }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
