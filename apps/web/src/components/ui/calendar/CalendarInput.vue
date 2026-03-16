<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    class?: string;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    class: "",
    modelValue: "",
    placeholder: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <label
    :class="
      cn(
        'flex h-11 w-full items-center gap-3 rounded-2xl border border-border bg-background/90 px-4 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.55)] transition-all duration-300 focus-within:ring-2 focus-within:ring-ring',
        $props.class
      )
    "
  >
    <span class="text-base text-muted-foreground">[ ]</span>
    <input
      :value="modelValue"
      type="date"
      class="w-full border-0 bg-transparent outline-none"
      :placeholder="placeholder"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>
