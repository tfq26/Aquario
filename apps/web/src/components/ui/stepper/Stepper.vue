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
          'group flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition-all duration-300',
          index === currentStep
            ? 'border-transparent bg-primary text-primary-foreground shadow-[0_14px_34px_rgba(0,113,227,0.22)]'
            : index < currentStep
              ? 'border-border bg-white/90 text-foreground hover:bg-white'
              : 'border-border bg-white/60 text-muted-foreground hover:bg-white/80'
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
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
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
