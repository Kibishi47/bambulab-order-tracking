<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Check, Edit2 } from 'lucide-vue-next'
import Modal from '~/components/Modal.vue'
import {
  BAMBU_FILAMENT_TYPES,
  BAMBU_COLOR_PALETTE,
  DEMAND_STATUSES,
  type FilamentTypeConfig,
  type FilamentPreset
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
const selectedType = ref<FilamentTypeConfig>(BAMBU_FILAMENT_TYPES[0])
const format = ref<'RECHARGE' | 'BOBINE'>('RECHARGE')
const selectedColor = ref<FilamentPreset>(BAMBU_COLOR_PALETTE[0])
const customColorName = ref('')
const customColorHex = ref('#00AE42')
const useCustomColor = ref(false)
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
      const foundType = BAMBU_FILAMENT_TYPES.find(t => t.name.toLowerCase() === props.demandToEdit.filamentType?.toLowerCase())
      selectedType.value = foundType || {
        name: props.demandToEdit.filamentType || 'Autre',
        category: 'Personnalisé',
        badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700',
        defaultPrice: props.demandToEdit.estimatedUnitPrice || 16.99
      }
      format.value = props.demandToEdit.format === 'BOBINE' ? 'BOBINE' : 'RECHARGE'
      quantity.value = props.demandToEdit.quantity || 1
      estimatedUnitPrice.value = props.demandToEdit.estimatedUnitPrice || 16.99
      status.value = props.demandToEdit.status || 'DEMANDE'
      notes.value = props.demandToEdit.notes || ''

      const foundColor = BAMBU_COLOR_PALETTE.find(c => c.name.toLowerCase() === props.demandToEdit.colorName?.toLowerCase())
      if (foundColor) {
        useCustomColor.value = false
        selectedColor.value = foundColor
      } else {
        useCustomColor.value = true
        customColorName.value = props.demandToEdit.colorName || ''
        customColorHex.value = props.demandToEdit.colorHex || '#00AE42'
      }
    } else {
      // Reset for creation
      if (!memberId.value && props.members.length > 0) {
        memberId.value = props.initialMemberId || props.members[0].id
      }
      selectedType.value = BAMBU_FILAMENT_TYPES[0]
      format.value = 'RECHARGE'
      selectedColor.value = BAMBU_COLOR_PALETTE[0]
      useCustomColor.value = false
      customColorName.value = ''
      customColorHex.value = '#00AE42'
      quantity.value = 1
      status.value = 'DEMANDE'
      notes.value = ''
      updatePrice()
    }
  }
})

function selectType(t: FilamentTypeConfig) {
  selectedType.value = t
  if (!props.demandToEdit) {
    updatePrice()
  }
}

function updatePrice() {
  let basePrice = selectedType.value.defaultPrice
  if (format.value === 'BOBINE') {
    basePrice += 2.0
  }
  estimatedUnitPrice.value = Math.round(basePrice * 100) / 100
}

function selectPresetColor(c: FilamentPreset) {
  useCustomColor.value = false
  selectedColor.value = c
}

async function submit() {
  if (!memberId.value) {
    errorMessage.value = 'Veuillez sélectionner un membre'
    return
  }

  const finalColorName = useCustomColor.value ? customColorName.value.trim() : selectedColor.value.name
  const finalColorHex = useCustomColor.value ? customColorHex.value.trim() : selectedColor.value.hex

  if (!finalColorName) {
    errorMessage.value = 'Veuillez spécifier le nom de la couleur'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    if (props.demandToEdit) {
      // Edit existing demand
      await $fetch(`/api/demands/${props.demandToEdit.id}`, {
        method: 'PATCH',
        body: {
          memberId: memberId.value,
          filamentType: selectedType.value.name,
          format: format.value,
          colorName: finalColorName,
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
          filamentType: selectedType.value.name,
          format: format.value,
          colorName: finalColorName,
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
            <option value="" disabled>Sélectionnez un membre</option>
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
          Matière / Type de filament *
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <button
            v-for="t in BAMBU_FILAMENT_TYPES"
            :key="t.name"
            type="button"
            class="px-2.5 py-1.5 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition-all"
            :class="[
              selectedType.name === t.name
                ? 'bg-bambu-50 border-bambu-500 text-bambu-700 dark:bg-bambu-500/15 dark:border-bambu-500 dark:text-bambu-400 font-semibold'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
            ]"
            @click="selectType(t)"
          >
            <span>{{ t.name }}</span>
            <span class="text-[10px] opacity-70">{{ t.category }}</span>
          </button>
        </div>
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
            @click="format = 'RECHARGE'; updatePrice()"
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
            @click="format = 'BOBINE'; updatePrice()"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold">Avec bobine (Spool)</span>
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400">+ bobine</span>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">Fourni directement avec la bobine réutilisable.</p>
          </button>
        </div>
      </div>

      <!-- Choix de la couleur -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Couleur de la bobine *
          </label>
          <button
            type="button"
            class="text-xs text-bambu-600 dark:text-bambu-400 hover:underline"
            @click="useCustomColor = !useCustomColor"
          >
            {{ useCustomColor ? 'Palette standard Bambu' : 'Saisir une couleur personnalisée' }}
          </button>
        </div>

        <!-- Palette Bambu Lab -->
        <div v-if="!useCustomColor" class="flex flex-wrap gap-1.5">
          <button
            v-for="c in BAMBU_COLOR_PALETTE"
            :key="c.name"
            type="button"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all"
            :class="[
              selectedColor.name === c.name
                ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-white font-semibold'
                : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
            ]"
            @click="selectPresetColor(c)"
          >
            <span
              class="w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-600"
              :style="{ backgroundColor: c.hex }"
            />
            <span>{{ c.name }}</span>
          </button>
        </div>

        <!-- Personnalisée -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Nom de la teinte</label>
            <input
              v-model="customColorName"
              type="text"
              required
              placeholder="Ex: Bleu Glacier, Rose Bonbon..."
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
          <div>
            <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">Code Hexadécimal</label>
            <div class="flex items-center gap-2">
              <input
                v-model="customColorHex"
                type="color"
                class="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent cursor-pointer p-0"
              />
              <input
                v-model="customColorHex"
                type="text"
                class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
              />
            </div>
          </div>
        </div>
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
