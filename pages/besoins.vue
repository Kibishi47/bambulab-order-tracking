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

      <div v-if="pendingForOrder.length > 0" class="flex items-center gap-2.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors"
          @click="orderModalOpen = true"
        >
          <ShoppingBag class="w-4 h-4 text-bambu-600 dark:text-bambu-400" />
          <span>Créer commande ({{ totalPendingSpools }} bobines)</span>
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

    <!-- Action Bar directly above table/list -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
      <div>
        <h2 class="text-base font-bold text-zinc-900 dark:text-white">
          Liste des besoins
        </h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
          {{ filteredDemands.length }} besoin(s) répertorié(s) • {{ totalPendingSpools }} en attente de commande
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-sm active:scale-95 transition-all self-start sm:self-auto"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" />
        <span>Nouveau besoin</span>
      </button>
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
        <!-- Desktop Column Headers -->
        <div class="hidden lg:grid lg:grid-cols-[1fr_130px_110px_190px] items-center gap-4 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          <span>Besoin & Filament</span>
          <span class="text-center">Statut</span>
          <span class="text-right">Montant</span>
          <span class="text-right">Actions</span>
        </div>

        <div
          v-for="d in filteredDemands"
          :key="d.id"
          class="p-4 flex flex-col gap-3 lg:grid lg:grid-cols-[1fr_130px_110px_190px] lg:items-center lg:gap-4 overflow-hidden"
        >
          <!-- Colonne 1 : Infos membre, filament et commande -->
          <div class="min-w-0 space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{{ d.memberName }}</span>
              <span class="text-zinc-300 dark:text-zinc-600">•</span>
              <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                {{ d.quantity }} bobine(s)
              </span>
              <BadgeFilament
                :type="d.filamentType"
                :format="d.format"
                :color-name="d.colorName"
                :color-hex="d.colorHex"
              />
            </div>

            <div class="flex items-center gap-2 sm:gap-3 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
              <span v-if="d.notes" class="italic text-zinc-700 dark:text-zinc-300 truncate max-w-xs sm:max-w-md" :title="d.notes">
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

          <!-- Ligne statut & montant sur mobile (devient 2 colonnes CSS grid distinctes sur lg) -->
          <div class="flex items-center justify-between w-full pt-2 border-t border-zinc-100 dark:border-zinc-800/60 lg:border-0 lg:pt-0 lg:contents">
            <!-- Colonne 2 : Badge de statut (largeur fixe 130px sur grand écran) -->
            <div class="flex items-center lg:w-[130px] lg:justify-center">
              <StatusBadge :status="d.status" class="w-full justify-center" />
            </div>

            <!-- Colonne 3 : Montant total & prix unitaire (largeur fixe 110px sur grand écran, text-right) -->
            <div class="text-right lg:w-[110px]">
              <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono block">
                {{ (d.quantity * (d.actualUnitPrice ?? d.estimatedUnitPrice)).toFixed(2) }} €
              </span>
              <span class="block text-[10px] text-zinc-400 font-mono">
                {{ (d.actualUnitPrice ?? d.estimatedUnitPrice).toFixed(2) }} € / u
              </span>
            </div>
          </div>

          <!-- Colonne 4 : Zone d'actions (largeur fixe 190px sur grand écran) -->
          <div class="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 lg:border-0 lg:pt-0 lg:w-[190px]">
            <!-- Edit Action (Pencil) -->
            <button
              type="button"
              class="p-2 sm:p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 flex-shrink-0"
              title="Modifier ce besoin"
              @click="openEditModal(d)"
            >
              <Edit2 class="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>

            <!-- Standardized Next Status Button (largeur fixe 120px) -->
            <div class="w-[120px] flex items-center justify-center flex-shrink-0">
              <button
                v-if="getNextStatus(d.status)"
                type="button"
                class="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:py-1 text-xs sm:text-[11px] font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors truncate active:scale-95"
                :title="getNextStatus(d.status)!.label"
                @click="updateStatus(d.id, getNextStatus(d.status)!.next)"
              >
                <component :is="getNextStatus(d.status)!.icon" class="w-3.5 h-3.5 sm:w-3 sm:h-3 text-bambu-600 dark:text-bambu-400 flex-shrink-0" />
                <span class="truncate">{{ getNextStatus(d.status)!.label }}</span>
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
      @deleted="loadDemands(); if (triggerRefresh) triggerRefresh()"
    />

    <OrderModal
      v-model="orderModalOpen"
      :members="members"
      :pending-demands="pendingForOrder"
      @created="loadDemands(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
