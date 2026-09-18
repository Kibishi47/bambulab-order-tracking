<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import DatePicker from '~/components/DatePicker.vue'
import { ShoppingCart, Check, Calendar, Hash, User, Euro, PauseCircle, ChevronDown, Percent, Sparkles } from 'lucide-vue-next'
import { OrderStatus, ShippingSplitMode, type FilamentDemandDTO } from '~/types'
import { computeEffectiveUnitPrice, VOLUME_DISCOUNT_TIERS } from '~/utils/pricing'
import { formatShippingSplitMode } from '~/utils/labels'

const props = defineProps<{
  modelValue: boolean
  members: Array<{ id: number, name: string }>
  pendingDemands: Array<FilamentDemandDTO>
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
const shippingSplitMethod = ref<ShippingSplitMode>(ShippingSplitMode.EQUAL)
const discountPercentage = ref(0)
const itemEligibilityMap = ref<Record<number, boolean>>({})
const notes = ref('')
const selectedDemandIds = ref<number[]>([])
const showPausedSection = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const activePendingDemands = computed(() => {
  return props.pendingDemands.filter(d => !d.isPaused)
})

const pausedDemands = computed(() => {
  return props.pendingDemands.filter(d => !!d.isPaused)
})

function isDemandEligible(demandId: number): boolean {
  return itemEligibilityMap.value[demandId] !== false
}

function toggleDemandEligibility(demandId: number) {
  itemEligibilityMap.value[demandId] = !isDemandEligible(demandId)
  autoCalculateTotal()
}

function setDiscountTier(percentage: number) {
  discountPercentage.value = percentage
  autoCalculateTotal()
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    orderNumber.value = `FR${Math.floor(10000000 + Math.random() * 90000000)}`
    buyerId.value = ''
    shippingFee.value = 0
    shippingSplitMethod.value = ShippingSplitMode.EQUAL
    discountPercentage.value = 0
    itemEligibilityMap.value = {}
    selectedDemandIds.value = activePendingDemands.value.map(d => d.id)
    autoCalculateTotal()
  }
})

const selectedDemandsTotal = computed(() => {
  const selected = activePendingDemands.value.filter(d => selectedDemandIds.value.includes(d.id))
  return selected.reduce((sum, d) => {
    const unitPrice = computeEffectiveUnitPrice(d.estimatedUnitPrice, discountPercentage.value, isDemandEligible(d.id))
    return sum + (d.quantity * unitPrice)
  }, 0)
})

const selectedSpoolsCount = computed(() => {
  return activePendingDemands.value
    .filter(d => selectedDemandIds.value.includes(d.id))
    .reduce((sum, d) => sum + d.quantity, 0)
})

function autoCalculateTotal() {
  const total = selectedDemandsTotal.value + Number(shippingFee.value || 0)
  totalAmount.value = Math.round(total * 100) / 100
}

function toggleSelectAll() {
  if (selectedDemandIds.value.length === activePendingDemands.value.length) {
    selectedDemandIds.value = []
  } else {
    selectedDemandIds.value = activePendingDemands.value.map(d => d.id)
  }
  autoCalculateTotal()
}

const participantsBreakdown = computed(() => {
  const selected = activePendingDemands.value.filter(d => selectedDemandIds.value.includes(d.id))
  const map = new Map<number, { name: string; spools: number; filamentCost: number; totalCost: number }>()

  let totalFilaments = 0
  for (const d of selected) {
    const debtorId = d.payerMemberId || d.memberId
    const debtorName = d.payerMemberId ? (d.payerMemberName || 'Payeur') : (d.memberName || 'Membre')
    const unitPrice = computeEffectiveUnitPrice(d.estimatedUnitPrice, discountPercentage.value, isDemandEligible(d.id))
    const cost = Math.round(d.quantity * unitPrice * 100) / 100
    totalFilaments += cost

    const cur = map.get(debtorId) || { name: debtorName, spools: 0, filamentCost: 0, totalCost: 0 }
    cur.spools += d.quantity
    cur.filamentCost += cost
    map.set(debtorId, cur)
  }

  const shipping = Number(shippingFee.value || 0)
  const count = map.size
  for (const item of map.values()) {
    let share = 0
    if (shipping > 0 && count > 0) {
      if (shippingSplitMethod.value === ShippingSplitMode.PRO_RATA && totalFilaments > 0) {
        share = (item.filamentCost / totalFilaments) * shipping
      } else {
        share = shipping / count
      }
    }
    item.totalCost = Math.round((item.filamentCost + share) * 100) / 100
  }

  return Array.from(map.values())
})

async function submit() {
  if (!buyerId.value) {
    errorMessage.value = 'Veuillez sélectionner un membre'
    return
  }
  if (!orderNumber.value.trim()) {
    errorMessage.value = 'Le numéro de commande Bambu Lab est requis'
    return
  }
  if (totalAmount.value === '' || Number(totalAmount.value) <= 0) {
    errorMessage.value = 'Veuillez saisir le montant total réel payé'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const ineligibleDemandIds = selectedDemandIds.value.filter(id => !isDemandEligible(id))

    await $fetch('/api/orders', {
      method: 'POST',
      body: {
        orderNumber: orderNumber.value.trim(),
        buyerId: Number(buyerId.value),
        purchaseDate: purchaseDate.value,
        status: OrderStatus.ORDERED,
        totalAmount: Number(totalAmount.value),
        shippingFee: Number(shippingFee.value || 0),
        shippingSplitMethod: shippingSplitMethod.value,
        discountPercentage: Number(discountPercentage.value || 0),
        ineligibleDemandIds,
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
    <form @submit.prevent="submit" class="space-y-4 sm:space-y-5">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Ligne 1 : Numéro de commande & Date -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder="Ex: FR12345678"
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Date d'achat *
          </label>
          <DatePicker
            v-model="purchaseDate"
            required
            placeholder="Sélectionner la date d'achat"
          />
        </div>
      </div>

      <!-- Ligne 2 : Acheteur & Montant réel -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Acheteur (Avance l'argent) *
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <select
              v-model="buyerId"
              required
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            >
              <option value="" disabled selected>Sélectionner un membre...</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.name }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Montant réel facturé (€) *
            </label>
            <button
              type="button"
              class="text-[11px] text-bambu-600 dark:text-bambu-400 hover:underline"
              @click="autoCalculateTotal"
            >
              Remplir estimé ({{ selectedDemandsTotal.toFixed(2) }} €)
            </button>
          </div>
          <div class="relative">
            <Euro class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              v-model.number="totalAmount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="119.90"
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
            />
          </div>
        </div>
      </div>

      <!-- Ligne 3 : Frais de port & Mode de répartition -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80">
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
              class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
              @input="autoCalculateTotal"
            />
          </div>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Par défaut 0,00 € (franco de port dès 55 €).
          </p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
            Mode de répartition
          </label>
          <select
            v-model="shippingSplitMethod"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option :value="ShippingSplitMode.EQUAL">{{ formatShippingSplitMode(ShippingSplitMode.EQUAL) }}</option>
            <option :value="ShippingSplitMode.PRO_RATA">{{ formatShippingSplitMode(ShippingSplitMode.PRO_RATA) }}</option>
          </select>
          <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            {{ shippingSplitMethod === ShippingSplitMode.EQUAL ? 'Frais divisés équitablement entre les participants.' : 'Frais répartis au pro-rata de la valeur des filaments commandés.' }}
          </p>
        </div>
      </div>

      <!-- Ligne 4 : Remise par paliers Bambu Lab -->
      <div class="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-1.5">
            <Percent class="w-4 h-4 text-bambu-500" />
            <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Remise par paliers Bambu Lab
            </label>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-zinc-500 dark:text-zinc-400 text-[11px]">Taux personnalisé :</span>
            <div class="relative w-20">
              <input
                v-model.number="discountPercentage"
                type="number"
                min="0"
                max="100"
                step="1"
                class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-right text-xs font-bold text-bambu-600 dark:text-bambu-400 focus:outline-none focus:border-bambu-500"
                @input="autoCalculateTotal"
              />
              <span class="absolute right-2 top-1 text-xs text-zinc-400 pointer-events-none">%</span>
            </div>
          </div>
        </div>

        <!-- Boutons de présets rapides -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          <button
            v-for="tier in VOLUME_DISCOUNT_TIERS"
            :key="tier.percentage"
            type="button"
            class="px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-center flex flex-col items-center justify-center cursor-pointer active:scale-95"
            :class="[
              discountPercentage === tier.percentage
                ? 'bg-bambu-500 text-white border-bambu-500 shadow-sm font-bold'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-bambu-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            ]"
            @click="setDiscountTier(tier.percentage)"
          >
            <span class="text-xs">{{ tier.label }}</span>
            <span class="text-[10px] opacity-80">{{ tier.description }}</span>
          </button>
        </div>
      </div>

      <!-- Sélection des besoins en attente -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Besoins prêts à commander ({{ selectedDemandIds.length }}/{{ activePendingDemands.length }} besoin(s) • {{ selectedSpoolsCount }} bobine(s))
          </label>
          <button
            v-if="activePendingDemands.length > 0"
            type="button"
            class="text-xs text-bambu-600 dark:text-bambu-400 hover:underline"
            @click="toggleSelectAll"
          >
            {{ selectedDemandIds.length === activePendingDemands.length ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </button>
        </div>

        <div v-if="activePendingDemands.length === 0" class="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
          Aucun besoin actif en attente actuellement. Vous pouvez tout de même créer une commande manuelle.
        </div>

        <div v-else class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          <div
            v-for="d in activePendingDemands"
            :key="d.id"
            class="flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs gap-3"
            :class="[
              selectedDemandIds.includes(d.id)
                ? 'bg-bambu-50/50 border-bambu-400 dark:bg-bambu-500/10 dark:border-bambu-500/50'
                : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-800'
            ]"
          >
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <input
                type="checkbox"
                :value="d.id"
                v-model="selectedDemandIds"
                @change="autoCalculateTotal"
                class="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-bambu-500 focus:ring-bambu-500 cursor-pointer"
              />
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-semibold text-zinc-900 dark:text-white">{{ d.memberName }}</span>
                  <span v-if="d.payerMemberName" class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    (🎁 payé par {{ d.payerMemberName }})
                  </span>
                  <span class="text-zinc-400">•</span>
                  <span class="text-zinc-700 dark:text-zinc-300 font-medium">{{ d.quantity }}x</span>
                </div>
                <div class="mt-0.5">
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

            <!-- Éligibilité & Prix -->
            <div class="flex items-center gap-2.5 flex-shrink-0">
              <!-- Toggle éligibilité à la réduction -->
              <button
                v-if="selectedDemandIds.includes(d.id)"
                type="button"
                class="px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer"
                :class="[
                  isDemandEligible(d.id)
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 line-through'
                ]"
                :title="isDemandEligible(d.id) ? 'Cliquez pour exclure de la remise' : 'Cliquez pour inclure dans la remise'"
                @click.stop.prevent="toggleDemandEligibility(d.id)"
              >
                {{ isDemandEligible(d.id) ? 'Éligible remise' : 'Hors remise' }}
              </button>

              <div class="text-right w-24">
                <div v-if="discountPercentage > 0 && selectedDemandIds.includes(d.id) && isDemandEligible(d.id)" class="flex flex-col items-end">
                  <span class="text-[10px] text-zinc-400 line-through font-mono">
                    {{ (d.quantity * d.estimatedUnitPrice).toFixed(2) }} €
                  </span>
                  <span class="font-bold font-mono text-bambu-600 dark:text-bambu-400">
                    {{ (d.quantity * computeEffectiveUnitPrice(d.estimatedUnitPrice, discountPercentage, true)).toFixed(2) }} €
                  </span>
                  <span class="text-[9px] text-zinc-400 font-mono">
                    ({{ computeEffectiveUnitPrice(d.estimatedUnitPrice, discountPercentage, true).toFixed(2) }} €/u)
                  </span>
                </div>
                <div v-else>
                  <span class="font-bold font-mono text-zinc-900 dark:text-zinc-200">
                    {{ (d.quantity * d.estimatedUnitPrice).toFixed(2) }} €
                  </span>
                  <span v-if="discountPercentage > 0 && selectedDemandIds.includes(d.id)" class="block text-[9px] text-amber-600 dark:text-amber-400 font-medium">
                    Plein tarif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Récapitulatif par participant -->
        <div v-if="participantsBreakdown.length > 0" class="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 space-y-2">
          <span class="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
            Récapitulatif par participant (produits remisés + quote-part port)
          </span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div
              v-for="p in participantsBreakdown"
              :key="p.name"
              class="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            >
              <span class="font-medium text-zinc-800 dark:text-zinc-200">{{ p.name }} ({{ p.spools }} bobine{{ p.spools > 1 ? 's' : '' }})</span>
              <span class="font-bold font-mono text-bambu-600 dark:text-bambu-400">{{ p.totalCost.toFixed(2) }} €</span>
            </div>
          </div>
        </div>

        <!-- Section repliable des besoins en pause -->
        <div v-if="pausedDemands.length > 0" class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <button
            type="button"
            class="flex items-center justify-between w-full text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            @click="showPausedSection = !showPausedSection"
          >
            <span class="flex items-center gap-1.5">
              <PauseCircle class="w-3.5 h-3.5 text-amber-500" />
              <span>Besoins en pause ({{ pausedDemands.length }})</span>
              <span class="text-[10px] font-normal text-zinc-400">— non sélectionnables</span>
            </span>
            <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': showPausedSection }" />
          </button>

          <div v-if="showPausedSection" class="space-y-1.5 pt-1">
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
              Ces besoins sont temporairement gelés par leurs demandeurs (pas de budget pour l'instant) et sont exclus de la commande.
            </p>
            <div
              v-for="d in pausedDemands"
              :key="d.id"
              class="flex items-center justify-between p-2.5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 opacity-60 text-xs cursor-not-allowed select-none"
            >
              <div class="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  disabled
                  class="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-400 cursor-not-allowed"
                />
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ d.memberName }}</span>
                    <span class="text-zinc-400">•</span>
                    <span class="text-zinc-500">{{ d.quantity }}x</span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-medium">
                      Gelé
                    </span>
                  </div>
                  <div class="mt-0.5">
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
                <span class="font-bold font-mono text-zinc-400">
                  {{ (d.quantity * d.estimatedUnitPrice).toFixed(2) }} €
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div>
        <label class="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
          Notes ou lien de suivi colis (facultatif)
        </label>
        <textarea
          v-model="notes"
          rows="2"
          placeholder="Ex: Livré par DPD le 22/09, remise au bureau..."
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
          <ShoppingCart class="w-4 h-4" />
          <span>{{ loading ? 'Création...' : 'Valider la commande groupée' }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
