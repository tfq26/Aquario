<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <div
    :class="
      cn(
        'rounded-[28px] border border-white/70 bg-card/95 text-card-foreground shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-500',
        $props.class
      )
    "
  >
    <slot />
  </div>
</template>
