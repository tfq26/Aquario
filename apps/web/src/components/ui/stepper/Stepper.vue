<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  steps: readonly string[];
  currentStep: number;
}>();

const emit = defineEmits<{
  select: [index: number];
}>();
</script>

<template>
  <div class="grid gap-3 md:grid-cols-3">
    <button
      v-for="(step, index) in steps"
      :key="step"
      type="button"
      :class="
        cn(
          'group flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-all duration-300',
            index === currentStep
              ? 'border-transparent bg-primary text-primary-foreground dark:bg-sky-800 shadow-[0_14px_34px_rgba(0,113,227,0.22)] dark:shadow-none'
              : index < currentStep
                ? 'border-border bg-white/90 dark:bg-white/10 text-foreground dark:text-sky-100 hover:bg-white dark:hover:bg-white/15'
                : 'border-border bg-white/60 dark:bg-black/40 text-muted-foreground dark:text-muted-foreground/60 hover:bg-white/80 dark:hover:bg-white/10'
          )
        "
      @click="emit('select', index)"
    >
      <span
        :class="
          cn(
            'flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
            index === currentStep
              ? 'bg-white/20 text-white'
              : index < currentStep
                ? 'bg-primary/10 dark:bg-sky-500/10 text-primary dark:text-sky-300'
                : 'bg-muted dark:bg-white/5 text-muted-foreground'
          )
        "
      >
        {{ index + 1 }}
      </span>
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium">{{ step }}</span>
      </span>
    </button>
  </div>
</template>
