<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    checked?: boolean;
    class?: string;
  }>(),
  {
    checked: false,
    class: ""
  }
);

const emit = defineEmits<{
  "update:checked": [value: boolean];
}>();

const classes = computed(() =>
  cn(
    "flex size-5 items-center justify-center rounded-md border border-border bg-background text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    props.checked ? "border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_rgba(19,62,135,0.18)]" : "bg-background/90",
    props.class
  )
);
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="checked"
    :class="classes"
    @click="emit('update:checked', !checked)"
  >
    <span class="text-xs font-semibold">{{ checked ? "✓" : "" }}</span>
  </button>
</template>
