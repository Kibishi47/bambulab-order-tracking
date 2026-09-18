<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  required?: boolean
}>(), {
  modelValue: '',
  placeholder: 'JJ/MM/AAAA',
  required: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// Current viewed month and year in calendar
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

// Sync calendar view when modelValue changes or on open
watch(() => props.modelValue, (val) => {
  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m] = val.split('-').map(Number)
    currentYear.value = y
    currentMonth.value = m - 1
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (open && props.modelValue && /^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
    const [y, m] = props.modelValue.split('-').map(Number)
    currentYear.value = y
    currentMonth.value = m - 1
  }
})

// Format YYYY-MM-DD to DD/MM/YYYY
const formattedDisplay = computed(() => {
  if (!props.modelValue || !/^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
    return ''
  }
  const [y, m, d] = props.modelValue.split('-')
  return `${d}/${m}/${y}`
})

// Days grid generation
interface CalendarDay {
  date: Date
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const todayStr = new Date().toISOString().slice(0, 10)

  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)

  // In French calendar, Monday is day 0 (Sunday in JS is 0, so convert)
  let firstDayIndex = firstDayOfMonth.getDay() - 1
  if (firstDayIndex === -1) firstDayIndex = 6

  // Previous month trailing days
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const d = new Date(currentYear.value, currentMonth.value - 1, day)
    const dateString = toIsoDate(d)
    days.push({
      date: d,
      dateString,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      isSelected: dateString === props.modelValue
    })
  }

  // Current month days
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const d = new Date(currentYear.value, currentMonth.value, day)
    const dateString = toIsoDate(d)
    days.push({
      date: d,
      dateString,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
      isSelected: dateString === props.modelValue
    })
  }

  // Next month leading days to complete grid to multiple of 7
  const remainingDays = (7 - (days.length % 7)) % 7
  for (let day = 1; day <= remainingDays; day++) {
    const d = new Date(currentYear.value, currentMonth.value + 1, day)
    const dateString = toIsoDate(d)
    days.push({
      date: d,
      dateString,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      isSelected: dateString === props.modelValue
    })
  }

  return days
})

function toIsoDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDay(day: CalendarDay) {
  emit('update:modelValue', day.dateString)
  isOpen.value = false
}

function setToday() {
  const todayStr = new Date().toISOString().slice(0, 10)
  emit('update:modelValue', todayStr)
  isOpen.value = false
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Trigger Button -->
    <button
      type="button"
      class="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-left focus:outline-none focus:border-bambu-500 transition-colors flex items-center justify-between"
      :class="{ 'border-bambu-500 ring-1 ring-bambu-500/20': isOpen }"
      @click="isOpen = !isOpen"
    >
      <div class="absolute left-3 top-2.5 pointer-events-none">
        <CalendarIcon class="w-4 h-4 text-zinc-400" />
      </div>
      <span v-if="formattedDisplay" class="font-medium text-zinc-900 dark:text-zinc-100">
        {{ formattedDisplay }}
      </span>
      <span v-else class="text-zinc-400">
        {{ placeholder }}
      </span>
    </button>

    <!-- Hidden native input for HTML5 required form validation -->
    <input
      type="text"
      :value="modelValue"
      :required="required"
      tabindex="-1"
      class="sr-only"
    />

    <!-- Popover Calendar -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 p-3 space-y-3"
      >
        <!-- Header: Month / Year Navigation -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            class="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            @click="prevMonth"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>

          <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {{ MONTH_NAMES[currentMonth] }} {{ currentYear }}
          </span>

          <button
            type="button"
            class="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            @click="nextMonth"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>

        <!-- Weekdays Row -->
        <div class="grid grid-cols-7 gap-1 text-center">
          <span
            v-for="w in WEEKDAYS"
            :key="w"
            class="text-[10px] font-semibold text-zinc-400 uppercase py-0.5"
          >
            {{ w }}
          </span>
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="d in calendarDays"
            :key="d.dateString"
            type="button"
            class="h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors relative"
            :class="[
              d.isSelected
                ? 'bg-bambu-500 text-white font-bold shadow-sm'
                : d.isCurrentMonth
                  ? 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  : 'text-zinc-300 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              d.isToday && !d.isSelected ? 'border border-bambu-500 text-bambu-600 dark:text-bambu-400' : ''
            ]"
            @click="selectDay(d)"
          >
            {{ d.dayNumber }}
          </button>
        </div>

        <!-- Footer: Today quick action -->
        <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
          <button
            type="button"
            class="text-bambu-600 dark:text-bambu-400 font-semibold hover:underline"
            @click="setToday"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            @click="isOpen = false"
          >
            Fermer
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
