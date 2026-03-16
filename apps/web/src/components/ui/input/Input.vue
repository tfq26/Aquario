<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    class?: string;
    modelValue?: string;
    type?: string;
    placeholder?: string;
    accept?: string;
  }>(),
  {
    class: "",
    modelValue: "",
    type: "text",
    placeholder: "",
    accept: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [event: Event];
}>();
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :accept="accept"
    :class="
      cn(
        'flex h-11 w-full rounded-2xl border border-border bg-background/90 px-4 py-2 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.55)] transition-all duration-300 placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        $props.class
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @change="emit('change', $event)"
  />
</template>
