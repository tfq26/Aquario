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
  <div :class="cn('flex items-center border-r border-border bg-muted/60 px-3 text-sm text-muted-foreground last:border-r-0', $props.class)">
    <slot />
  </div>
</template>
