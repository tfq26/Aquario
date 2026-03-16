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
  <div
    :class="
      cn(
        'flex w-full items-stretch overflow-hidden rounded-2xl border border-border bg-background/90 shadow-[0_1px_0_rgba(255,255,255,0.55)]',
        $props.class
      )
    "
  >
    <slot />
  </div>
</template>
