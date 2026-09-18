<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import MemberModal from '~/components/members/MemberModal.vue'
import {
  Users,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Layers,
  ShoppingBag
} from 'lucide-vue-next'

const triggerRefresh = inject<() => void>('triggerRefresh')
const refreshKey = inject<Ref<number>>('refreshKey', ref(0))

const members = ref<any[]>([])
const balances = ref<any[]>([])
const loading = ref(true)

// Modal state
const memberModalOpen = ref(false)
const memberToEdit = ref<any>(null)

async function loadMembers() {
  loading.value = true
  try {
    const [m, b] = await Promise.all([
      $fetch('/api/members'),
      $fetch('/api/balances')
    ])
    members.value = m as any[]
    balances.value = (b as any).membersBalances || []
  } catch (e) {
    console.error('Error loading members', e)
  } finally {
    loading.value = false
  }
}

watch(refreshKey, () => {
  loadMembers()
})

onMounted(() => {
  loadMembers()
})

function openCreateModal() {
  memberToEdit.value = null
  memberModalOpen.value = true
}

function openEditModal(m: any) {
  memberToEdit.value = m
  memberModalOpen.value = true
}

async function deleteMember(id: number, name: string) {
  if (!confirm(`Supprimer définitivement le membre "${name}" ? Ses besoins et commandes associées seront affectés.`)) {
    return
  }

  try {
    await $fetch(`/api/members/${id}`, { method: 'DELETE' })
    loadMembers()
    if (triggerRefresh) triggerRefresh()
  } catch (e) {
    console.error('Error deleting member', e)
  }
}

function getMemberBalance(memberId: number) {
  const found = balances.value.find(b => b.memberId === memberId)
  return found?.netBalance || 0
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Users class="w-6 h-6 text-bambu-500" />
          <span>Annuaire des membres</span>
        </h1>
        <p class="text-xs text-zinc-400 mt-1">
          Gérez le groupe d'amis participant aux commandes groupées de filaments 3D.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 shadow-md shadow-bambu-500/20 active:scale-95 transition-all"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" />
        <span>Ajouter un membre</span>
      </button>
    </div>

    <!-- Members Grid -->
    <div v-if="loading" class="p-12 text-center text-xs text-zinc-500">
      Chargement de l'annuaire des membres...
    </div>

    <div v-else-if="members.length === 0" class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-12 text-center space-y-3">
      <Users class="w-8 h-8 text-zinc-600 mx-auto" />
      <p class="text-sm font-semibold text-zinc-300">Aucun membre enregistré</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bambu-500 text-white text-xs font-semibold"
        @click="openCreateModal"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Créer le premier membre</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="m in members"
        :key="m.id"
        class="rounded-xl bg-[#14161a] border border-zinc-800/80 p-5 shadow-lg shadow-black/20 hover:border-zinc-700/80 transition-all flex flex-col justify-between gap-5"
      >
        <div class="space-y-4">
          <!-- Top info & Avatar -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-bambu-400">
                {{ m.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <h3 class="text-base font-bold text-white tracking-tight">
                  {{ m.name }}
                </h3>
                <span class="text-[11px] text-zinc-500">
                  Membre depuis le {{ m.createdAt ? m.createdAt.slice(0, 10) : 'N/A' }}
                </span>
              </div>
            </div>

            <!-- Net Balance Badge -->
            <span
              class="px-2.5 py-1 rounded-full text-xs font-mono font-bold border"
              :class="[
                getMemberBalance(m.id) > 0.01
                  ? 'bg-bambu-500/15 text-bambu-400 border-bambu-500/30'
                  : (getMemberBalance(m.id) < -0.01 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700')
              ]"
            >
              {{ getMemberBalance(m.id) > 0 ? `+${getMemberBalance(m.id).toFixed(2)}` : getMemberBalance(m.id).toFixed(2) }} €
            </span>
          </div>

          <!-- Contact details -->
          <div class="space-y-2 text-xs text-zinc-300">
            <div v-if="m.email" class="flex items-center gap-2">
              <Mail class="w-3.5 h-3.5 text-zinc-500" />
              <a :href="`mailto:${m.email}`" class="hover:text-bambu-400 transition-colors truncate">
                {{ m.email }}
              </a>
            </div>

            <div v-if="m.phone" class="flex items-center gap-2">
              <Phone class="w-3.5 h-3.5 text-zinc-500" />
              <a :href="`tel:${m.phone}`" class="hover:text-bambu-400 transition-colors">
                {{ m.phone }}
              </a>
            </div>

            <div v-if="m.dropoffLocation" class="flex items-center gap-2 text-zinc-400">
              <MapPin class="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <span class="truncate">{{ m.dropoffLocation }}</span>
            </div>
          </div>
        </div>

        <!-- Stats & Actions Footer -->
        <div class="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <div class="flex items-center gap-3 text-zinc-400">
            <span class="flex items-center gap-1">
              <Layers class="w-3 h-3 text-zinc-500" />
              <strong>{{ m.demandsCount || 0 }}</strong> besoin(s)
            </span>
            <span>•</span>
            <span class="flex items-center gap-1">
              <ShoppingBag class="w-3 h-3 text-zinc-500" />
              <strong>{{ m.ordersBoughtCount || 0 }}</strong> achat(s)
            </span>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Modifier ce membre"
              @click="openEditModal(m)"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Supprimer ce membre"
              @click="deleteMember(m.id, m.name)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Member Modal -->
    <MemberModal
      v-model="memberModalOpen"
      :member-to-edit="memberToEdit"
      @saved="loadMembers(); if (triggerRefresh) triggerRefresh()"
    />
  </div>
</template>
