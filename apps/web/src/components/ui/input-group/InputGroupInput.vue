<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    class?: string;
    modelValue?: string;
    type?: string;
    placeholder?: string;
  }>(),
  {
    class: "",
    modelValue: "",
    type: "text",
    placeholder: ""
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    :class="
      cn(
        'min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/90',
        $props.class
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
