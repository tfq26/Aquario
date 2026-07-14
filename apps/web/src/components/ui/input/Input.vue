<script setup lang="ts">
import { cn } from "@/lib/utils";
import { type Component, computed } from "vue";

interface Props {
  class?: string;
  modelValue?: string | number;
  type?: string;
  placeholder?: string;
  accept?: string;
  id?: string;
  icon?: Component;
  rightIcon?: Component;
  error?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  class: "",
  modelValue: "",
  type: "text",
  placeholder: "",
  accept: "",
  id: undefined,
  icon: undefined,
  rightIcon: undefined,
  error: false
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [event: Event];
}>();

const hasLeftIcon = computed(() => !!props.icon);
const hasRightIcon = computed(() => !!props.rightIcon);
</script>

<template>
  <div class="relative group/input w-full">
    <div
      v-if="hasLeftIcon"
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground/70 transition-colors group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-sky-400"
    >
      <component :is="icon" class="size-4" />
    </div>

    <input
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :accept="accept"
      :class="
        cn(
          'flex h-12 w-full rounded-xl border border-[#133e87]/10 bg-white/95 px-4 py-2 text-base text-[#133e87] shadow-sm transition-all duration-300 placeholder:text-[#608bc1]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-slate-900/90 dark:text-[#f3f3e0] dark:placeholder:text-sky-400/30',
          hasLeftIcon && 'pl-11',
          hasRightIcon && 'pr-11',
          error && 'border-red-500/50 ring-red-500/20',
          $props.class
        )
      "
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @change="emit('change', $event)"
    />

    <div
      v-if="hasRightIcon"
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground/70 transition-colors group-focus-within/input:text-indigo-500 dark:group-focus-within/input:text-sky-400"
    >
      <component :is="rightIcon" class="size-4" />
    </div>
  </div>
</template>
