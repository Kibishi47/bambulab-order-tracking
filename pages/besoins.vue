<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import BadgeFilament from '~/components/BadgeFilament.vue'
import StatusBadge from '~/components/StatusBadge.vue'
import DemandModal from '~/components/demands/DemandModal.vue'
import OrderModal from '~/components/orders/OrderModal.vue'
import {
  BAMBU_FILAMENT_TYPES,
  DEMAND_STATUSES
} from '~/composables/useFilamentColors'
import {
  Layers,
  Plus,
  Search,
  CheckCircle,
  Truck,
  PackageCheck,
  ShoppingBag,
  Trash2,
  XCircle,
  Edit2
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const demands = ref<any[]>([])
const members = ref<any[]>([])
const loading = ref(true)

// Filters
const filterStatus = ref<string>('')
const filterMember = ref<string>('')
const filterType = ref<string>('')
const searchQuery = ref<string>('')

// Modals
const demandModalOpen = ref(false)
const demandToEdit = ref<any | null>(null)
const orderModalOpen = ref(false)

async function loadDemands() {
  loading.value = true
  try {
    const [d, m] = await Promise.all([
      $fetch('/api/demands'),
      $fetch('/api/members')
    ])
    demands.value = d as any[]
    members.value = m as any[]
  } catch (e) {
    console.error('Error fetching demands', e)
  } finally {
    loading.value = false
  }
}

watch(refreshKey, () => {
  loadDemands()
})

onMounted(() => {
  loadDemands()
})

const filteredDemands = computed(() => {
  return demands.value.filter(d => {
    if (filterStatus.value && d.status !== filterStatus.value) return false
    if (filterMember.value && d.memberId !== Number(filterMember.value)) return false
    if (filterType.value && d.filamentType !== filterType.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      const matchesColor = d.colorName.toLowerCase().includes(q)
      const matchesMember = d.memberName?.toLowerCase().includes(q)
      const matchesNotes = d.notes?.toLowerCase().includes(q)
      const matchesType = d.filamentType.toLowerCase().includes(q)
      if (!matchesColor && !matchesMember && !matchesNotes && !matchesType) return false
    }
    return true
  })
})

const pendingForOrder = computed(() => {
  return demands.value.filter(d => d.status === 'DEMANDE' || d.status === 'PRIS_EN_CHARGE')
})

const totalPendingSpools = computed(() => {
  return pendingForOrder.value.reduce((sum, d) => sum + d.quantity, 0)
})

const totalFilteredCost = computed(() => {
  return filteredDemands.value.reduce((sum, d) => {
    const price = d.actualUnitPrice ?? d.estimatedUnitPrice
    return sum + (d.quantity * price)
  }, 0)
})

function openCreateModal() {
  demandToEdit.value = null
  demandModalOpen.value = true
}

function openEditModal(d: any) {
  demandToEdit.value = d
  demandModalOpen.value = true
}

async function updateStatus(id: number, nextStatus: string) {
  try {
    await $fetch(`/api/demands/${id}`, {
      method: 'PATCH',
      body: { status: nextStatus }
    })
    loadDemands()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Error updating status', e)
  }
}

async function deleteDemand(id: number) {
  if (!confirm('Voulez-vous vraiment supprimer ce besoin de filament ?')) return
  try {
    await $fetch(`/api/demands/${id}`, { method: 'DELETE' })
    loadDemands()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Error deleting demand', e)
  }
}

function getNextStatus(status: string) {
  switch (status) {
    case 'DEMANDE':
      return { next: 'PRIS_EN_CHARGE', label: 'Prendre en charge', icon: CheckCircle }
    case 'PRIS_EN_CHARGE':
      return { next: 'COMMANDE', label: 'Marquer commandé', icon: ShoppingBag }
    case 'COMMANDE':
      return { next: 'RECU', label: 'Reçu', icon: Truck }
    case 'RECU':
      return { next: 'DISTRIBUE', label: 'Distribué', icon: PackageCheck }
    default:
      return null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Layers class="w-6 h-6 text-bambu-500" />
          <span>Besoins en filaments</span>
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Suivi au fil de l'eau des bobines souhaitées avec cycle de vie et édition complète.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          v-if="pendingForOrder.length > 0"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors"
          @click="orderModalOpen = true"
        >
          <ShoppingBag class="w-4 h-4 text-bambu-600 dark:text-bambu-400" />
          <span>Créer commande ({{ totalPendingSpools }} bobines)</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-sm active:scale-95 transition-all"
          @click="openCreateModal"
        >
          <Plus class="w-4 h-4" />
          <span>Ajouter un besoin</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-3">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search query -->
        <div class="relative">
          <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher (couleur, membre, projet...)"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-bambu-500"
          />
        </div>

        <!-- Filter Statut -->
        <div>
          <select
            v-model="filterStatus"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option value="">Tous les statuts</option>
            <option v-for="s in DEMAND_STATUSES" :key="s.value" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>

        <!-- Filter Membre -->
        <div>
          <select
            v-model="filterMember"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option value="">Tous les membres</option>
            <option v-for="m in members" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>

        <!-- Filter Matière -->
        <div>
          <select
            v-model="filterType"
            class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-bambu-500"
          >
            <option value="">Toutes les matières</option>
            <option v-for="t in BAMBU_FILAMENT_TYPES" :key="t.name" :value="t.name">
              {{ t.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Quick summary of filtered results -->
      <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <span>
          <strong>{{ filteredDemands.length }}</strong> besoin(s) affiché(s) • Total estimé : <strong>{{ totalFilteredCost.toFixed(2) }} €</strong>
        </span>
        <button
          v-if="filterStatus || filterMember || filterType || searchQuery"
          type="button"
          class="text-bambu-600 dark:text-bambu-400 hover:underline"
          @click="filterStatus = ''; filterMember = ''; filterType = ''; searchQuery = ''"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>

    <!-- Demands List -->
    <div class="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div v-if="loading" class="p-10 text-center text-xs text-zinc-400">
        Chargement des besoins...
      </div>

      <div v-else-if="filteredDemands.length === 0" class="p-10 text-center space-y-3">
        <Layers class="w-8 h-8 text-zinc-400 mx-auto" />
        <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Aucun besoin ne correspond aux critères</p>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bambu-500 text-white text-xs font-semibold shadow-sm"
          @click="openCreateModal"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Créer un besoin</span>
        </button>
      </div>

      <div v-else class="divide-y divide-zinc-200 dark:divide-zinc-800/70">
        <div
          v-for="d in filteredDemands"
          :key="d.id"
          class="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-950/40 transition-colors"
        >
          <!-- Left info -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-zinc-900 dark:text-white">{{ d.memberName }}</span>
              <span class="text-zinc-300 dark:text-zinc-600">•</span>
              <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {{ d.quantity }} bobine(s)
              </span>
              <BadgeFilament
                :type="d.filamentType"
                :format="d.format"
                :color-name="d.colorName"
                :color-hex="d.colorHex"
              />
            </div>

            <div class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span v-if="d.notes" class="italic text-zinc-700 dark:text-zinc-300">
                "{{ d.notes }}"
              </span>
              <span v-if="d.orderNumber" class="font-mono text-bambu-600 dark:text-bambu-400 font-semibold">
                Commande: #{{ d.orderNumber }}
              </span>
              <span class="text-[11px] text-zinc-400">
                Créé le {{ d.createdAt.slice(0, 10) }}
              </span>
            </div>
          </div>

          <!-- Right actions & status -->
          <div class="flex items-center gap-2.5 self-end lg:self-center flex-wrap">
            <StatusBadge :status="d.status" />

            <div class="text-right min-w-[75px]">
              <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                {{ (d.quantity * (d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
              </span>
              <span class="block text-[10px] text-zinc-400">
                {{ (d.actualUnitPrice ?? d.estimatedUnitPrice).toFixed(2) }} € / u
              </span>
            </div>

            <!-- Action buttons: Modifier (crayon) + Avancer statut + Annuler + Supprimer -->
            <div class="flex items-center gap-1 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <!-- Edit Action (Pencil) -->
              <button
                type="button"
                class="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                title="Modifier ce besoin"
                @click="openEditModal(d)"
              >
                <Edit2 class="w-3.5 h-3.5" />
              </button>

              <!-- Quick Next Status Button -->
              <button
                v-if="getNextStatus(d.status)"
                type="button"
                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                :title="getNextStatus(d.status)!.label"
                @click="updateStatus(d.id, getNextStatus(d.status)!.next)"
              >
                <component :is="getNextStatus(d.status)!.icon" class="w-3 h-3 text-bambu-600 dark:text-bambu-400" />
                <span class="hidden sm:inline text-[11px]">{{ getNextStatus(d.status)!.label }}</span>
              </button>

              <!-- Cancel button -->
              <button
                v-if="d.status !== 'ANNULE' && d.status !== 'DISTRIBUE'"
                type="button"
                class="p-1.5 text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Annuler ce besoin"
                @click="updateStatus(d.id, 'ANNULE')"
              >
                <XCircle class="w-4 h-4" />
              </button>

              <!-- Delete button -->
              <button
                type="button"
                class="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Supprimer définitivement"
                @click="deleteDemand(d.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <DemandModal
      v-model="demandModalOpen"
      :members="members"
      :demand-to-edit="demandToEdit"
      @created="loadDemands(); if (triggerRefresh) triggerRefresh()"
      @updated="loadDemands(); if (triggerRefresh) triggerRefresh()"
    />

    <OrderModal
      v-model="orderModalOpen"
      :members="members"
      :pending-demands="pendingForOrder"
      @created="loadDemands(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
