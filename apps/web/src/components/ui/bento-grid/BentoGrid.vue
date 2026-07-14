<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";

interface Props {
  class?: HTMLAttributes["class"];
}

const props = defineProps<Props>();
</script>

<template>
  <div
    :class="
      cn(
        `mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[10rem] md:grid-cols-4`,
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
