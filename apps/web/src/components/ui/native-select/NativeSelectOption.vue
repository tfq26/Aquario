<script setup lang="ts">
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  value?: string | number;
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <option :value="props.value" :class="props.class">
    <slot />
  </option>
</template>
