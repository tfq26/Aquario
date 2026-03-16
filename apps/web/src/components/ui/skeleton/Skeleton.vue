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
        'animate-pulse rounded-2xl bg-[linear-gradient(110deg,rgba(255,255,255,0.7),rgba(237,244,255,0.95),rgba(255,255,255,0.7))] bg-[length:200%_100%]',
        $props.class
      )
    "
  />
</template>
