<script setup lang="ts">
import { Spinner } from "@/components/ui/spinner";

withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message: "Getting your workspace ready."
  }
);
</script>

<template>
  <section class="flex min-h-screen items-center justify-center bg-background">
    <div class="flex flex-col items-center gap-4 reveal-up">
      <div class="flex size-12 items-center justify-center rounded-full border border-white/60 bg-white/70 shadow-sm backdrop-blur-xl dark:glass-dark">
        <Spinner class="size-5" />
      </div>
      <p v-if="message" class="text-sm font-medium text-muted-foreground transition-all duration-300">
        {{ message }}
      </p>
    </div>
  </section>
</template>
