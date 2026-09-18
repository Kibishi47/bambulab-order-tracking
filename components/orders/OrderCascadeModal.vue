<script setup lang="ts">
import { computed } from 'vue'
import ConfirmModal from '~/components/ui/ConfirmModal.vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import { Truck, CheckCheck, AlertCircle, ArrowRight } from 'lucide-vue-next'
import { NeedStatus, OrderStatus, type GroupOrderDTO, type CascadeAction, type FilamentDemandDTO } from '~/types'
import { formatNeedStatus, formatOrderStatus } from '~/utils/labels'

const props = defineProps<{
  modelValue: boolean
  order: GroupOrderDTO
  action: CascadeAction
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm'): void
}>()

const isReceive = computed(() => props.action === 'RECEIVE')

const requiredPreviousStatus = computed<NeedStatus>(() => isReceive.value ? NeedStatus.ORDERED : NeedStatus.RECEIVED)
const targetDemandStatus = computed<NeedStatus>(() => isReceive.value ? NeedStatus.RECEIVED : NeedStatus.DISTRIBUTED)
const targetOrderStatusLabel = computed(() => isReceive.value ? formatOrderStatus(OrderStatus.RECEIVED) : formatOrderStatus(OrderStatus.DISTRIBUTED))

const demands = computed<FilamentDemandDTO[]>(() => props.order?.demands || [])

// Eligible demands that will transition
const eligibleDemands = computed(() => {
  return demands.value.filter(d => d.status === requiredPreviousStatus.value)
})

// Ignored demands that will remain untouched
const ignoredDemands = computed(() => {
  return demands.value.filter(d => d.status !== requiredPreviousStatus.value)
})

const eligibleSpoolsCount = computed(() => {
  return eligibleDemands.value.reduce((sum, d) => sum + (d.quantity || 1), 0)
})

const title = computed(() => {
  return isReceive.value
    ? 'Confirmer la réception de la commande'
    : 'Confirmer la distribution de la commande'
})

const confirmButtonText = computed(() => {
  return isReceive.value ? 'Valider la réception' : 'Valider la distribution'
})
</script>

<template>
  <ConfirmModal
    :model-value="modelValue"
    :title="title"
    :confirm-text="confirmButtonText"
    cancel-text="Annuler"
    variant="primary"
    :loading="loading"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
  >
    <div v-if="order" class="space-y-4">
      <!-- Bloc d'impact principal -->
      <div class="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-zinc-500 dark:text-zinc-400">Commande concernée :</span>
          <span class="font-mono font-bold text-zinc-900 dark:text-white">#{{ order.orderNumber }}</span>
        </div>

        <div class="flex items-center gap-2 text-xs pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <span class="text-zinc-600 dark:text-zinc-300">Nouveau statut de la commande :</span>
          <span class="font-bold text-bambu-600 dark:text-bambu-400 font-mono">
            {{ targetOrderStatusLabel }}
          </span>
        </div>
      </div>

      <!-- Explication et décompte précis -->
      <div class="space-y-2">
        <!-- Impactés -->
        <div class="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
          <div class="w-2 h-2 rounded-full bg-bambu-500 mt-1.5 flex-shrink-0" />
          <p>
            <strong class="text-zinc-900 dark:text-white font-bold">{{ eligibleDemands.length }} besoin(s)</strong>
            ({{ eligibleSpoolsCount }} bobines) actuellement au statut
            <em class="font-semibold text-zinc-800 dark:text-zinc-200">« {{ formatNeedStatus(requiredPreviousStatus) }} »</em>
            passeront automatiquement au statut
            <strong class="text-bambu-600 dark:text-bambu-400 font-bold">« {{ formatNeedStatus(targetDemandStatus) }} »</strong>.
          </p>
        </div>

        <!-- Garde-fous si des besoins sont ignorés -->
        <div v-if="ignoredDemands.length > 0" class="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Garde-fou :</strong> {{ ignoredDemands.length }} besoin(s) ne sont pas au statut
            « {{ formatNeedStatus(requiredPreviousStatus) }} » (annulés ou déjà traités) et
            <strong>resteront strictement inchangés</strong>.
          </p>
        </div>
      </div>

      <!-- Aperçu visuel des besoins modifiés -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold">
          <span>Articles mis à jour ({{ eligibleDemands.length }})</span>
          <span v-if="eligibleDemands.length === 0" class="text-rose-500">Aucun article éligible</span>
        </div>

        <div v-if="eligibleDemands.length > 0" class="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 p-1">
          <div
            v-for="d in eligibleDemands"
            :key="d.id"
            class="p-2 flex items-center justify-between gap-2 text-xs"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-bold text-zinc-900 dark:text-white truncate max-w-[110px]">{{ d.memberName }}</span>
              <span class="text-zinc-300 dark:text-zinc-700">•</span>
              <span class="font-mono font-bold text-zinc-700 dark:text-zinc-300">{{ d.quantity }}x</span>
              <BadgeFilament
                :type="d.filamentType"
                :format="d.format"
                :color-name="d.colorName"
                :color-hex="d.colorHex"
                size="sm"
              />
            </div>

            <div class="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
              <span class="text-zinc-400">{{ formatNeedStatus(d.status) }}</span>
              <ArrowRight class="w-3 h-3 text-bambu-500" />
              <span class="font-bold text-bambu-600 dark:text-bambu-400">{{ formatNeedStatus(targetDemandStatus) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ConfirmModal>
</template>
