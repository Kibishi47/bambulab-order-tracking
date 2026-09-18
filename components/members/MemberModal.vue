<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '~/components/Modal.vue'
import { User, Mail, Phone, MapPin, Check } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  memberToEdit?: {
    id: number
    name: string
    email?: string | null
    phone?: string | null
    dropoffLocation?: string | null
  } | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'saved'): void
}>()

const name = ref('')
const email = ref('')
const phone = ref('')
const dropoffLocation = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (props.memberToEdit) {
      name.value = props.memberToEdit.name || ''
      email.value = props.memberToEdit.email || ''
      phone.value = props.memberToEdit.phone || ''
      dropoffLocation.value = props.memberToEdit.dropoffLocation || ''
    } else {
      name.value = ''
      email.value = ''
      phone.value = ''
      dropoffLocation.value = ''
    }
  }
})

async function submit() {
  if (!name.value.trim()) {
    errorMessage.value = 'Le prénom/nom est obligatoire'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    if (props.memberToEdit) {
      await $fetch(`/api/members/${props.memberToEdit.id}`, {
        method: 'PUT',
        body: {
          name: name.value.trim(),
          email: email.value.trim() || null,
          phone: phone.value.trim() || null,
          dropoffLocation: dropoffLocation.value.trim() || null
        }
      })
    } else {
      await $fetch('/api/members', {
        method: 'POST',
        body: {
          name: name.value.trim(),
          email: email.value.trim() || null,
          phone: phone.value.trim() || null,
          dropoffLocation: dropoffLocation.value.trim() || null
        }
      })
    }

    emit('saved')
    emit('update:modelValue', false)
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Erreur lors de la sauvegarde du membre'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Modal
    :model-value="modelValue"
    :title="memberToEdit ? 'Modifier le membre' : 'Ajouter un ami / membre'"
    :description="memberToEdit ? 'Mettez à jour les coordonnées du membre.' : 'Ajoutez un nouveau membre pour lui assigner des besoins ou des commandes.'"
    max-width="max-w-lg"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form @submit.prevent="submit" class="space-y-4">
      <div v-if="errorMessage" class="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
        {{ errorMessage }}
      </div>

      <!-- Nom -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Prénom / Nom *
        </label>
        <div class="relative">
          <User class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            v-model="name"
            type="text"
            required
            placeholder="Ex: Thomas, Sophie Martin..."
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Adresse Email
        </label>
        <div class="relative">
          <Mail class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            v-model="email"
            type="email"
            placeholder="thomas@example.com"
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Téléphone -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Téléphone
        </label>
        <div class="relative">
          <Phone class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            v-model="phone"
            type="tel"
            placeholder="06 12 34 56 78"
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

      <!-- Lieu de remise -->
      <div>
        <label class="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
          Lieu de remise / Adresse
        </label>
        <div class="relative">
          <MapPin class="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            v-model="dropoffLocation"
            type="text"
            placeholder="Ex: Bureau Thomas, Makerspace, Chez Lucas..."
            class="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-bambu-500"
          />
        </div>
      </div>

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
          class="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-bambu-500 text-white hover:bg-bambu-600 transition-all shadow-md shadow-bambu-500/20 disabled:opacity-50"
        >
          <Check class="w-4 h-4" />
          <span>{{ loading ? 'Enregistrement...' : (memberToEdit ? 'Mettre à jour' : 'Ajouter le membre') }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>
