<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Edit2 } from 'lucide-vue-next'
import Modal from '~/components/Modal.vue'
import {
  BAMBU_FILAMENT_TYPES,
  DEMAND_STATUSES,
  resolveColorHex
} from '~/composables/useFilamentColors'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  initialMemberId?: number
  demandToEdit?: any | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const loading = ref(false)
const errorMessage = ref('')

const memberId = ref<number | ''>('')
const filamentType = ref('PLA Basic')
const format = ref<'RECHARGE' | 'BOBINE'>('RECHARGE')
const colorName = ref('Bambu Green')
const quantity = ref(1)
const estimatedUnitPrice = ref(16.99)
const status = ref('DEMANDE')
const notes = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (props.demandToEdit) {
      // Pre-fill fields for edition
      memberId.value = props.demandToEdit.memberId
      filamentType.value = props.demandToEdit.filamentType || 'PLA Basic'
      format.value = props.demandToEdit.format === 'BOBINE' ? 'BOBINE' : 'RECHARGE'
      colorName.value = props.demandToEdit.colorName || ''
      quantity.value = props.demandToEdit.quantity || 1
      estimatedUnitPrice.value = props.demandToEdit.estimatedUnitPrice || 16.99
      status.value = props.demandToEdit.status || 'DEMANDE'
      notes.value = props.demandToEdit.notes || ''
    } else {
      // Reset for creation
      memberId.value = ''
      filamentType.value = 'PLA Basic'
      format.value = 'RECHARGE'
      colorName.value = 'Bambu Green'
      quantity.value = 1
      estimatedUnitPrice.value = 16.99
      status.value = 'DEMANDE'
      notes.value = ''
      updateSuggestedPrice()
    }
  }
})

function updateSuggestedPrice() {
  const match = BAMBU_FILAMENT_TYPES.find(t => t.name.toLowerCase() === filamentType.value.trim().toLowerCase())
  let basePrice = match ? match.defaultPrice : 16.99
  if (format.value === 'BOBINE') {
    basePrice += 2.0
  }
  estimatedUnitPrice.value = Math.round(basePrice * 100) / 100
}

function setFormat(newFormat: 'RECHARGE' | 'BOBINE') {
  format.value = newFormat
  if (!props.demandToEdit) {
    updateSuggestedPrice()
  }
}

async function submit() {
  if (!memberId.value) {
    errorMessage.value = 'Veuillez sélectionner un membre'
    return
  }

  const trimmedType = filamentType.value.trim()
  if (!trimmedType) {
    errorMessage.value = 'Veuillez spécifier le type de filament'
    return
  }

  const trimmedColor = colorName.value.trim()
  if (!trimmedColor) {
    errorMessage.value = 'Veuillez spécifier la couleur'
    return
  }

  const finalColorHex = resolveColorHex(trimmedColor, props.demandToEdit?.colorHex)

  loading.value = true
  errorMessage.value = ''

  try {
    if (props.demandToEdit) {
      // Edit existing demand
      await $fetch(`/api/demands/${props.demandToEdit.id}`, {
        method: 'PATCH',
        body: {
          memberId: memberId.value,
          filamentType: trimmedType,
          format: format.value,
          colorName: trimmedColor,
          colorHex: finalColorHex,
          quantity: quantity.value,
          estimatedUnitPrice: estimatedUnitPrice.value,
          status: status.value,
          notes: notes.value.trim() || null
        }
      })
      emit('updated')
    } else {
      // Create new demand
      await $fetch('/api/demands', {
        method: 'POST',
        body: {
          memberId: memberId.value,
          filamentType: trimmedType,
          format: format.value,
          colorName: trimmedColor,
          colorHex: finalColorHex,
          quantity: quantity.value,
          estimatedUnitPrice: estimatedUnitPrice.value,
          notes: notes.value.trim() || null
        }
      })
      emit('created')
    }

    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || "Erreur lors de l'enregistrement du besoin"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="demandToEdit ? 'Modifier le besoin' : 'Nouveau besoin de filament'"
    :description="demandToEdit ? 'Modifiez toutes les informations relatives à ce besoin.' : 'Exprimez un besoin au fil de l\'eau pour la prochaine commande Bambu Lab.'"
    max-width="max-w-2xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="submit" class="space-y-4 sm:space-y-5">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Ligne 1 : Demandeur & Statut (si édition) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Membre demandeur *
          </label>
          <select
            v-model="memberId"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500 transition-colors"
          >
            <option value="" disabled selected>Sélectionner un membre...</option>
            <option v-for="m in members" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>

        <div v-if="demandToEdit">
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Statut actuel *
          </label>
          <select
            v-model="status"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500 transition-colors"
          >
            <option v-for="s in DEMAND_STATUSES" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Type de filament -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Type de filament *
        </label>
        <input
          v-model="filamentType"
          type="text"
          required
          placeholder="PLA Basic, PETG HF, TPU 95A..."
          class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-bambu-500 transition-colors"
          @input="!demandToEdit && updateSuggestedPrice()"
        />
      </div>

      <!-- Format (Recharge vs Bobine complète) -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Conditionnement *
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-2.5 text-left rounded-xl border transition-all"
            :class="[
              format === 'RECHARGE'
                ? 'bg-bambu-50 border-bambu-500 text-zinc-900 dark:bg-bambu-500/10 dark:border-bambu-500 dark:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400'
            ]"
            @click="setFormat('RECHARGE')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">Recharge (Refill)</span>
              <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">Éco</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">À glisser sur une bobine réutilisable existante.</p>
          </button>

          <button
            type="button"
            class="p-2.5 text-left rounded-xl border transition-all"
            :class="[
              format === 'BOBINE'
                ? 'bg-bambu-50 border-bambu-500 text-zinc-900 dark:bg-bambu-500/10 dark:border-bambu-500 dark:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400'
            ]"
            @click="setFormat('BOBINE')"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">Avec bobine (Spool)</span>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400">+ bobine</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Fourni directement avec la bobine réutilisable.</p>
          </button>
        </div>
      </div>

      <!-- Couleur -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Couleur *
        </label>
        <input
          v-model="colorName"
          type="text"
          required
          placeholder="Bambu Green, Noir, Blanc Jade..."
          class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-bambu-500 transition-colors"
        />
      </div>

      <!-- Quantité & Prix unitaire estimé -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Quantité (bobines) *
          </label>
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            max="50"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Prix unitaire estimé (€) *
          </label>
          <input
            v-model.number="estimatedUnitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Sous-total estimé -->
      <div class="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
        <span class="text-zinc-600 dark:text-zinc-400">Total pour ce besoin :</span>
        <span class="font-bold text-sm text-bambu-600 dark:text-bambu-400">
          {{ (quantity * estimatedUnitPrice).toFixed(2) }} €
        </span>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Notes ou nom du projet (facultatif)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex: Pièces pour boîtier imprimante 3D, cosplay..."
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
          <component :is="demandToEdit ? Edit2 : Plus" class="w-4 h-4" />
          <span>{{ loading ? 'Enregistrement...' : (demandToEdit ? 'Enregistrer les modifications' : 'Ajouter le besoin') }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
