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
  <span
    :class="
      cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
        $props.class
      )
    "
    aria-hidden="true"
  />
</template>
