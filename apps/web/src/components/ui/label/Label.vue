<script setup lang="ts">
import { cn } from "@/lib/utils";

withDefaults(
  defineProps<{
    class?: string;
  }>(),
  {
    class: ""
  }
);
</script>

<template>
  <label :class="cn('text-sm font-medium tracking-[-0.01em] text-foreground', $props.class)">
    <slot />
  </label>
</template>
