<script setup lang="ts">
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-vue-next";
import { type Component } from "vue";

interface Props {
  class?: string;
  modelValue?: string | number;
  icon?: Component;
  placeholder?: string;
  options?: Array<{ value: string | number; label: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  class: "",
  modelValue: "",
  icon: undefined,
  placeholder: "Select an option",
  options: () => []
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();
</script>

<template>
  <div class="relative group/select w-full">
    <div
      v-if="icon"
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground/70 transition-colors group-focus-within/select:text-indigo-500 dark:group-focus-within/select:text-sky-400"
    >
      <component :is="icon" class="size-4" />
    </div>

    <select
      :value="modelValue"
      :class="
        cn(
          'h-12 w-full appearance-none rounded-xl border border-[#133e87]/10 bg-white/95 px-4 py-2 pr-10 text-base font-medium text-[#133e87] shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/5 dark:bg-slate-900/90 dark:text-[#f3f3e0] cursor-pointer',
          icon && 'pl-11',
          $props.class
        )
      "
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled selected>{{ placeholder }}</option>
      <slot>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </slot>
    </select>

    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#133e87]/40 dark:text-sky-300/40">
      <ChevronDown class="size-4" />
    </div>
  </div>
</template>
