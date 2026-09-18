<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import { ShoppingCart, Check, Calendar, Hash, User, Euro } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  pendingDemands: Array<{
    id: number
    memberName: string
    filamentType: string
    format: string
    colorName: string
    colorHex: string
    quantity: number
    estimatedUnitPrice: number
  }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
}>()

const orderNumber = ref('')
const buyerId = ref<number | ''>('')
const purchaseDate = ref(new Date().toISOString().slice(0, 10))
const totalAmount = ref<number | ''>('')
const shippingFee = ref(0)
const notes = ref('')
const selectedDemandIds = ref<number[]>([])
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    orderNumber.value = `FR${Math.floor(10000000 + Math.random() * 90000000)}`
    if (!buyerId.value && props.members.length > 0) {
      buyerId.value = props.members[0].id
    }
    // By default select all pending demands
    selectedDemandIds.value = props.pendingDemands.map(d => d.id)
    autoCalculateTotal()
  }
})

const selectedDemandsTotal = computed(() => {
  const selected = props.pendingDemands.filter(d => selectedDemandIds.value.includes(d.id))
  return selected.reduce((sum, d) => sum + (d.quantity * d.estimatedUnitPrice), 0)
})

function autoCalculateTotal() {
  const total = selectedDemandsTotal.value + Number(shippingFee.value || 0)
  totalAmount.value = Math.round(total * 100) / 100
}

function toggleSelectAll() {
  if (selectedDemandIds.value.length === props.pendingDemands.length) {
    selectedDemandIds.value = []
  } else {
    selectedDemandIds.value = props.pendingDemands.map(d => d.id)
  }
}

async function submit() {
  if (!orderNumber.value.trim()) {
    errorMessage.value = 'Le numéro de commande Bambu Lab est requis'
    return
  }
  if (!buyerId.value) {
    errorMessage.value = "Veuillez désigner l'acheteur qui avance les fonds"
    return
  }
  if (totalAmount.value === '' || Number(totalAmount.value) <= 0) {
    errorMessage.value = 'Veuillez saisir le montant total réel payé'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/orders', {
      method: 'POST',
      body: {
        orderNumber: orderNumber.value.trim(),
        buyerId: Number(buyerId.value),
        purchaseDate: purchaseDate.value,
        status: 'COMMANDE',
        totalAmount: Number(totalAmount.value),
        shippingFee: Number(shippingFee.value || 0),
        notes: notes.value.trim() || null,
        demandIds: selectedDemandIds.value
      }
    })

    emit('created')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la création de la commande'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Créer une commande groupée Bambu Lab"
    description="Regroupez les besoins en attente dans une commande réelle passée sur le store."
    max-width="max-w-3xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="submit" class="space-y-5">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Ligne 1 : Numéro de commande & Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            N° Commande Bambu Lab *
          </label>
          <div class="relative">
            <Hash class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              v-model="orderNumber"
              type="text"
              required
              placeholder="Ex: FR12345678"
              class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Date d'achat *
          </label>
          <div class="relative">
            <Calendar class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              v-model="purchaseDate"
              type="date"
              required
              class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>
      </div>

      <!-- Ligne 2 : Acheteur & Montant réel -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
            Acheteur (Avance l'argent) *
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <select
              v-model="buyerId"
              required
              class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
            >
              <option value="" disabled>Choisir l'acheteur</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Montant réel facturé (€) *
            </label>
            <button
              type="button"
              class="text-[11px] text-bambu-400 hover:underline"
              @click="autoCalculateTotal"
            >
              Remplir avec total estimé ({{ selectedDemandsTotal.toFixed(2) }} €)
            </button>
          </div>
          <div class="relative">
            <Euro class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              v-model.number="totalAmount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="119.90"
              class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm font-bold text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>
      </div>

      <!-- Sélection des besoins en attente -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Besoins à inclure dans cette commande ({{ selectedDemandIds.length }}/{{ pendingDemands.length }})
          </label>
          <button
            type="button"
            class="text-xs text-bambu-400 hover:underline"
            @click="toggleSelectAll"
          >
            {{ selectedDemandIds.length === pendingDemands.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>

        <div v-if="pendingDemands.length === 0" class="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-center text-xs text-zinc-400">
          Aucun besoin en attente actuellement. Vous pouvez tout de même créer une commande manuelle.
        </div>

        <div v-else class="max-h-56 overflow-y-auto space-y-2 pr-1">
          <label
            v-for="d in pendingDemands"
            :key="d.id"
            class="flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all text-xs"
            :class="[
              selectedDemandIds.includes(d.id)
                ? 'bg-bambu-500/10 border-bambu-500/60 ring-1 ring-bambu-500/30'
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            ]"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :value="d.id"
                v-model="selectedDemandIds"
                class="w-4 h-4 rounded border-zinc-700 text-bambu-500 focus:ring-bambu-500 bg-zinc-900"
              />
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-white">{{ d.memberName }}</span>
                  <span class="text-zinc-500">•</span>
                  <span class="text-zinc-300 font-medium">{{ d.quantity }}x</span>
                </div>
                <div class="mt-1">
                  <BadgeFilament
                    :type="d.filamentType"
                    :format="d.format"
                    :color-name="d.colorName"
                    :color-hex="d.colorHex"
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div class="text-right">
              <span class="font-bold text-zinc-200">
                {{ (d.quantity * d.estimatedUnitPrice).toFixed(2) }} €
              </span>
              <span class="block text-[10px] text-zinc-500">
                ({{ d.estimatedUnitPrice }} € / u)
              </span>
            </div>
          </label>
        </div>
      </div>

      <!-- Notes / Suivi -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Notes ou lien de suivi colis (facultatif)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex: Livré par DPD le 22/09, remise au bureau..."
          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-bambu-500"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          @click="emit('update:modelValue', false)"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-md shadow-bambu-500/20 disabled:opacity-50"
        >
          <ShoppingCart class="w-4 h-4" />
          <span>{{ loading ? 'Création...' : 'Valider la commande groupée' }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
