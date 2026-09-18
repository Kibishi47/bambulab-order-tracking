<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'primary' | 'success'
    loading?: boolean
    maxWidth?: string
  }>(),
  {
    description: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'primary',
    loading: false,
    maxWidth: 'max-w-md'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function close() {
  if (props.loading) return
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  if (props.loading) return
  emit('confirm')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue && !props.loading) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-sm bg-black/40 dark:bg-black/60"
        @click.self="close"
      >
        <div
          class="relative w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl flex flex-col transition-colors overflow-hidden"
          :class="maxWidth"
          role="dialog"
          aria-modal="true"
        >
          <!-- Top Bar with Title & Close Icon -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="[
                  variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                    : (variant === 'success'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-zinc-100 text-bambu-600 dark:bg-zinc-800 dark:text-bambu-400 border border-zinc-200 dark:border-zinc-700')
                ]"
              >
                <AlertTriangle v-if="variant === 'danger'" class="w-5 h-5" />
                <CheckCircle2 v-else-if="variant === 'success'" class="w-5 h-5" />
                <Info v-else class="w-5 h-5" />
              </div>

              <div>
                <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug">
                  {{ title }}
                </h3>
                <p v-if="description" class="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {{ description }}
                </p>
              </div>
            </div>

            <button
              type="button"
              :disabled="loading"
              class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0 disabled:opacity-40"
              @click="close"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Slot for Dynamic Body Content -->
          <div v-if="$slots.default" class="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
            <slot />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              :disabled="loading"
              class="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-50"
              @click="close"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              :disabled="loading"
              class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-sm active:scale-95 transition-all disabled:opacity-50"
              :class="[
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-bambu-500 hover:bg-bambu-600'
              ]"
              @click="handleConfirm"
            >
              <span>{{ loading ? 'Action en cours...' : confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
