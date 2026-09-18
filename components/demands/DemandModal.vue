<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Check } from 'lucide-vue-next'
import Modal from '~/components/Modal.vue'
import {
  BAMBU_FILAMENT_TYPES,
  BAMBU_COLOR_PALETTE,
  type FilamentTypeConfig,
  type FilamentPreset
} from '~/composables/useFilamentColors'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  initialMemberId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'created'): void
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
const notes = ref('')

watch(() => props.initialMemberId, (newId) => {
  if (newId) memberId.value = newId
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (!memberId.value && props.members.length > 0) {
      memberId.value = props.initialMemberId || props.members[0].id
    }
    updatePrice()
  }
})

function selectType(t: FilamentTypeConfig) {
  selectedType.value = t
  updatePrice()
}

function updatePrice() {
  let basePrice = selectedType.value.defaultPrice
  if (format.value === 'BOBINE') {
    basePrice += 2.0 // Spool usually costs +2€ to +3€ compared to refill
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
        notes: notes.value
      }
    })

    // Reset fields
    notes.value = ''
    quantity.value = 1
    emit('created')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la création du besoin'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    title="Nouveau besoin de filament"
    description="Exprimez un besoin au fil de l'eau pour la prochaine commande Bambu Lab."
    max-width="max-w-2xl"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="submit" class="space-y-5">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Membre demandeur -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Membre demandeur *
        </label>
        <select
          v-model="memberId"
          required
          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500 transition-colors"
        >
          <option value="" disabled>Sélectionnez un membre</option>
          <option v-for="m in members" :key="m.id" :value="m.id">
            {{ m.name }}
          </option>
        </select>
      </div>

      <!-- Type de filament -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Matière / Type de filament *
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="t in BAMBU_FILAMENT_TYPES"
            :key="t.name"
            type="button"
            class="px-3 py-2 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition-all"
            :class="[
              selectedType.name === t.name
                ? 'bg-bambu-500/10 border-bambu-500 text-bambu-400 ring-1 ring-bambu-500/40'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
            ]"
            @click="selectType(t)"
          >
            <span>{{ t.name }}</span>
            <span class="text-[10px] text-zinc-500">{{ t.category }}</span>
          </button>
        </div>
      </div>

      <!-- Format (Recharge vs Bobine complète) -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Conditionnement *
        </label>
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="p-3 text-left rounded-xl border transition-all"
            :class="[
              format === 'RECHARGE'
                ? 'bg-bambu-500/10 border-bambu-500 text-white ring-1 ring-bambu-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            ]"
            @click="format = 'RECHARGE'; updatePrice()"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-zinc-100">Recharge (Refill)</span>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">Éco</span>
            </div>
            <p class="text-[11px] text-zinc-400 mt-1">À monter sur une bobine réutilisable existante.</p>
          </button>

          <button
            type="button"
            class="p-3 text-left rounded-xl border transition-all"
            :class="[
              format === 'BOBINE'
                ? 'bg-bambu-500/10 border-bambu-500 text-white ring-1 ring-bambu-500/50'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            ]"
            @click="format = 'BOBINE'; updatePrice()"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-zinc-100">Avec bobine (Spool)</span>
              <span class="text-[10px] text-zinc-400">+ bobine</span>
            </div>
            <p class="text-[11px] text-zinc-400 mt-1">Fourni directement avec bobine transparente Bambu.</p>
          </button>
        </div>
      </div>

      <!-- Choix de la couleur -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Couleur de la bobine *
          </label>
          <button
            type="button"
            class="text-xs text-bambu-400 hover:underline"
            @click="useCustomColor = !useCustomColor"
          >
            {{ useCustomColor ? 'Choisir dans la palette standard' : 'Saisir une couleur personnalisée' }}
          </button>
        </div>

        <!-- Palette Bambu Lab -->
        <div v-if="!useCustomColor" class="space-y-2">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in BAMBU_COLOR_PALETTE"
              :key="c.name"
              type="button"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
              :class="[
                selectedColor.name === c.name
                  ? 'bg-zinc-800 border-zinc-500 text-white ring-1 ring-bambu-500'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              ]"
              @click="selectPresetColor(c)"
            >
              <span
                class="w-3 h-3 rounded-full border border-zinc-600"
                :style="{ backgroundColor: c.hex }"
              />
              <span>{{ c.name }}</span>
            </button>
          </div>
        </div>

        <!-- Personnalisée -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] text-zinc-400 mb-1">Nom de la teinte (ex: Bleu Glacier)</label>
            <input
              v-model="customColorName"
              type="text"
              required
              placeholder="Nom de la couleur"
              class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
          <div>
            <label class="block text-[11px] text-zinc-400 mb-1">Code Hexadécimal</label>
            <div class="flex items-center gap-2">
              <input
                v-model="customColorHex"
                type="color"
                class="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer p-0"
              />
              <input
                v-model="customColorHex"
                type="text"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-bambu-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Quantité & Prix unitaire estimé -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Quantité (bobines) *
          </label>
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            max="50"
            required
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Prix unitaire estimé (€) *
          </label>
          <input
            v-model.number="estimatedUnitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Sous-total estimé -->
      <div class="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs">
        <span class="text-zinc-400">Total estimé pour ce besoin :</span>
        <span class="font-bold text-sm text-bambu-400">
          {{ (quantity * estimatedUnitPrice).toFixed(2) }} €
        </span>
      </div>

      <!-- Notes / Projet -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
          Notes ou nom du projet (facultatif)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex: Pièces pour boîtier imprimante 3D, cosplay..."
          class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-bambu-500"
        />
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
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
          <Plus class="w-4 h-4" />
          <span>{{ loading ? 'Enregistrement...' : 'Ajouter le besoin' }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
