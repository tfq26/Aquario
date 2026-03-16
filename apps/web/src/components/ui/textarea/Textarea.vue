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
        'flex w-full overflow-hidden rounded-lg border border-border bg-background/90 px-4 py-5 text-sm text-foreground shadow-[0_1px_0_rgba(255,255,255,0.55)] transition-all duration-300 placeholder:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
