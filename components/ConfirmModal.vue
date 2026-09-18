<script setup lang="ts">
import ConfirmModal from './ui/ConfirmModal.vue'

defineProps<{
  modelValue: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'success'
  loading?: boolean
  maxWidth?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <ConfirmModal
    v-bind="$props"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
  </ConfirmModal>
</template>
