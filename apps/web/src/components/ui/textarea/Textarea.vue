<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: string;
    modelValue?: string;
    rows?: number;
    placeholder?: string;
    autoResize?: boolean;
  }>(),
  {
    class: "",
    modelValue: "",
    rows: 4,
    placeholder: "",
    autoResize: true
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

function resize() {
  if (!props.autoResize || !textareaRef.value) return;
  textareaRef.value.style.height = "auto";
  textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
}

onMounted(() => {
  if (props.autoResize) {
    resize();
  }
});

watch(
  () => props.modelValue,
  () => {
    if (props.autoResize) {
      nextTick(resize);
    }
  }
);
</script>

<template>
  <textarea
    ref="textareaRef"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :class="
      cn(
        'flex min-h-[80px] w-full rounded-xl border border-[#133e87]/10 bg-white/95 px-4 py-3 text-base text-[#133e87] shadow-sm transition-all duration-300 placeholder:text-[#608bc1]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-slate-900/90 dark:text-[#f3f3e0] dark:placeholder:text-sky-400/30',
        $props.class
      )
    "
    @input="
      (e) => {
        emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
        resize();
      }
    "
    />
</template>
