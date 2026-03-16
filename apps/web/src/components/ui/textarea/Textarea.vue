<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    class?: string;
    modelValue?: string;
    rows?: number;
    placeholder?: string;
  }>(),
  {
    class: "",
    modelValue: "",
    rows: 4,
    placeholder: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <textarea
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :class="
      cn(
        'flex min-h-[120px] w-full rounded-3xl border border-border bg-background/90 px-4 py-3 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.55)] transition-all duration-300 placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        $props.class
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
