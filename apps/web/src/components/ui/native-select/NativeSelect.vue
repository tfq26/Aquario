<script setup lang="ts">
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-vue-next";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div class="relative flex items-center">
    <select
      :class="
        cn(
          'flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          props.class
        )
      "
      v-bind="$attrs"
    >
      <slot />
    </select>
    <ChevronDown
      data-slot="native-select-icon"
      class="pointer-events-none absolute right-3 h-4 w-4 opacity-50"
    />
  </div>
</template>
