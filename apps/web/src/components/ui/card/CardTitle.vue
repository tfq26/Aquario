<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{ class?: string }>();
</script>

<template>
  <h2 :class="cn('text-2xl font-semibold tracking-[-0.03em] text-foreground', $props.class)">
    <slot />
  </h2>
</template>
