<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, today, type DateValue, parseDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { ref, watch, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue?: string
  class?: string
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium',
})

// Internal state as DateValue for compatibility with the Calendar component
const internalDate = ref<DateValue | undefined>()

// Sync from prop (assuming string formatted as YYYY-MM-DD)
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    try {
      const datePart = newVal.split('T')[0]
      internalDate.value = parseDate(datePart)
    } catch (e) {
      internalDate.value = undefined
    }
  } else {
    internalDate.value = undefined
  }
}, { immediate: true })

// Sync to prop
watch(internalDate, (newDate) => {
  const dateString = newDate?.toString()
  if (dateString !== props.modelValue) {
    emits('update:modelValue', dateString)
  }
})

const defaultPlaceholder = today(getLocalTimeZone())

const displayValue = computed(() => {
  if (!internalDate.value) return "Pick a date"
  return df.format(internalDate.value.toDate(getLocalTimeZone()))
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal rounded-xl h-11 bg-white/90 border-border text-[#133e87]',
          !internalDate && 'text-muted-foreground',
          props.class,
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ displayValue }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0 border-white/60 bg-[#cbdceb]/95 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden" align="start">
      <Calendar
        v-model="internalDate"
        :initial-focus="true"
        :default-placeholder="defaultPlaceholder"
        layout="month-and-year"
      />
    </PopoverContent>
  </Popover>
</template>
