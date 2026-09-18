<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Edit2, Trash2, Gift, PauseCircle } from 'lucide-vue-next'
import Modal from '~/components/Modal.vue'
import ConfirmModal from '~/components/ui/ConfirmModal.vue'
import {
  BAMBU_FILAMENT_TYPES,
  DEMAND_STATUSES,
  resolveColorHex
} from '~/composables/useFilamentColors'
import { NeedStatus, FilamentFormat, type FilamentDemandDTO } from '~/types'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  initialMemberId?: number
  demandToEdit?: FilamentDemandDTO | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}>()

const loading = ref(false)
const errorMessage = ref('')

const memberId = ref<number | ''>('')
const isSponsored = ref(false)
const payerMemberId = ref<number | ''>('')
const isPaused = ref(false)
const filamentType = ref('PLA Basic')
const format = ref<FilamentFormat>(FilamentFormat.REFILL)
const colorName = ref('Bambu Green')
const quantity = ref(1)
const estimatedUnitPrice = ref(16.99)
const status = ref<NeedStatus>(NeedStatus.REQUESTED)
const notes = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (props.demandToEdit) {
      // Pre-fill fields for edition
      memberId.value = props.demandToEdit.memberId
      isSponsored.value = !!props.demandToEdit.payerMemberId
      payerMemberId.value = props.demandToEdit.payerMemberId || ''
      isPaused.value = Boolean(props.demandToEdit.isPaused)
      filamentType.value = props.demandToEdit.filamentType || 'PLA Basic'
      format.value = props.demandToEdit.format === FilamentFormat.SPOOL ? FilamentFormat.SPOOL : FilamentFormat.REFILL
      colorName.value = props.demandToEdit.colorName || ''
      quantity.value = props.demandToEdit.quantity || 1
      estimatedUnitPrice.value = props.demandToEdit.estimatedUnitPrice || 16.99
      status.value = props.demandToEdit.status || NeedStatus.REQUESTED
      notes.value = props.demandToEdit.notes || ''
    } else {
      // Reset for creation
      memberId.value = ''
      isSponsored.value = false
      payerMemberId.value = ''
      isPaused.value = false
      filamentType.value = 'PLA Basic'
      format.value = FilamentFormat.REFILL
      colorName.value = 'Bambu Green'
      quantity.value = 1
      estimatedUnitPrice.value = 16.99
      status.value = NeedStatus.REQUESTED
      notes.value = ''
      updateSuggestedPrice()
    }
  }
})

watch(isSponsored, (val) => {
  if (!val) {
    payerMemberId.value = ''
  }
})

function updateSuggestedPrice() {
  const match = BAMBU_FILAMENT_TYPES.find(t => t.name.toLowerCase() === filamentType.value.trim().toLowerCase())
  let basePrice = match ? match.defaultPrice : 16.99
  if (format.value === FilamentFormat.SPOOL) {
    basePrice += 2.0
  }
  estimatedUnitPrice.value = Math.round(basePrice * 100) / 100
}

function setFormat(newFormat: FilamentFormat) {
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

  if (isSponsored.value && !payerMemberId.value) {
    errorMessage.value = 'Veuillez sélectionner le membre qui prend en charge cet article'
    return
  }

  if (isSponsored.value && payerMemberId.value === memberId.value) {
    errorMessage.value = 'Le payeur doit être différent du membre demandeur'
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
    const finalPayerId = isSponsored.value && payerMemberId.value ? Number(payerMemberId.value) : null

    if (props.demandToEdit) {
      // Edit existing demand
      await $fetch(`/api/demands/${props.demandToEdit.id}`, {
        method: 'PATCH',
        body: {
          memberId: memberId.value,
          payerMemberId: finalPayerId,
          filamentType: trimmedType,
          format: format.value,
          colorName: trimmedColor,
          colorHex: finalColorHex,
          quantity: quantity.value,
          estimatedUnitPrice: estimatedUnitPrice.value,
          status: status.value,
          isPaused: isPaused.value,
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
          payerMemberId: finalPayerId,
          filamentType: trimmedType,
          format: format.value,
          colorName: trimmedColor,
          colorHex: finalColorHex,
          quantity: quantity.value,
          estimatedUnitPrice: estimatedUnitPrice.value,
          isPaused: isPaused.value,
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

const confirmDeleteOpen = ref(false)

function promptDelete() {
  confirmDeleteOpen.value = true
}

async function executeDelete() {
  if (!props.demandToEdit) return

  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/demands/${props.demandToEdit.id}`, { method: 'DELETE' })
    confirmDeleteOpen.value = false
    emit('deleted')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la suppression du besoin'
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

      <!-- Option Prise en charge / Cadeau -->
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <label class="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            v-model="isSponsored"
            type="checkbox"
            class="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-bambu-600 focus:ring-bambu-500 transition-colors"
          />
          <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <Gift class="w-3.5 h-3.5 text-amber-500" />
            <span>Offrir / Prendre en charge pour ce membre</span>
          </div>
        </label>

        <!-- Sélecteur du membre payeur si activé -->
        <div v-if="isSponsored" class="pt-2.5 border-t border-zinc-200/70 dark:border-zinc-800/70 space-y-1.5">
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Payé par : *
          </label>
          <select
            v-model="payerMemberId"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500 transition-colors"
          >
            <option value="" disabled selected>Sélectionner un membre...</option>
            <option
              v-for="m in members"
              :key="m.id"
              :value="m.id"
              :disabled="m.id === memberId"
            >
              {{ m.name }} {{ m.id === memberId ? '(destinataire)' : '' }}
            </option>
          </select>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
            Le coût de la bobine et sa quote-part de frais de port seront imputés à ce membre dans le calcul des soldes.
          </p>
        </div>
      </div>

      <!-- Toggle Gel / Verrouillage d'un besoin -->
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
        <label class="flex items-start gap-3 cursor-pointer select-none">
          <input
            v-model="isPaused"
            type="checkbox"
            class="mt-0.5 w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 focus:ring-amber-500 transition-colors"
          />
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <PauseCircle class="w-3.5 h-3.5 text-amber-500" />
              <span>Mettre en pause (ne pas commander pour l'instant)</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              Le besoin reste visible dans la liste mais ne pourra pas être sélectionné lors d'une commande groupée.
            </p>
          </div>
        </label>
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
              format === FilamentFormat.REFILL
                ? 'bg-bambu-50 border-bambu-500 text-zinc-900 dark:bg-bambu-500/10 dark:border-bambu-500 dark:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400'
            ]"
            @click="setFormat(FilamentFormat.REFILL)"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">REFILL</span>
              <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">Eco</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Refill pack without plastic spool.</p>
          </button>

          <button
            type="button"
            class="p-2.5 text-left rounded-xl border transition-all"
            :class="[
              format === FilamentFormat.SPOOL
                ? 'bg-bambu-50 border-bambu-500 text-zinc-900 dark:bg-bambu-500/10 dark:border-bambu-500 dark:text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-400'
            ]"
            @click="setFormat(FilamentFormat.SPOOL)"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">SPOOL</span>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400">+ spool</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Filament with reusable spool.</p>
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
            Prix unitaire de base (€) *
          </label>
          <input
            v-model.number="estimatedUnitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
          <p class="text-[10px] text-zinc-400 mt-1">Prix catalogue Bambu Lab sans réduction.</p>
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
      <div class="flex items-center justify-between gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <button
            v-if="demandToEdit"
            type="button"
            :disabled="loading"
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
            :disabled="loading"
            class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <component :is="demandToEdit ? Edit2 : Plus" class="w-4 h-4" />
            <span>{{ loading ? 'Enregistrement...' : (demandToEdit ? 'Enregistrer les modifications' : 'Ajouter le besoin') }}</span>
          </button>
        </div>
      </div>
    </form>

    <!-- Modal de confirmation de suppression sans alert/confirm natif -->
    <ConfirmModal
      v-model="confirmDeleteOpen"
      title="Supprimer ce besoin"
      :description="`Êtes-vous sûr de vouloir supprimer définitivement le besoin de ${demandToEdit?.quantity || 1}x ${demandToEdit?.filamentType || ''} (${demandToEdit?.colorName || ''}) ? Cette action est irréversible.`"
      confirm-text="Supprimer définitivement"
      variant="danger"
      :loading="loading"
      @confirm="executeDelete"
    />
  </Modal>
</template>
