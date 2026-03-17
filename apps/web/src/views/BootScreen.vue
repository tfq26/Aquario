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
  <section class="boot-screen flex min-h-screen items-center justify-center">
    <div class="boot-card reveal-up w-full max-w-xl rounded-[36px] border border-white/60 px-8 py-14 text-center shadow-[0_30px_80px_rgba(19,62,135,0.12)]">
      <div class="mx-auto flex size-16 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-[0_16px_30px_rgba(19,62,135,0.08)]">
        <Spinner class="size-6" />
      </div>
      <div class="mt-6 space-y-2">
        <h1 class="text-4xl font-semibold tracking-[-0.05em]">Aquario</h1>
        <p class="text-base text-muted-foreground">{{ message }}</p>
      </div>
      <div class="mt-8 grid gap-3 text-left sm:grid-cols-3">
        <div class="rounded-[24px] border border-white/60 bg-white/72 px-4 py-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
          <p class="mt-2 text-sm font-medium">Checking sign-in</p>
        </div>
        <div class="rounded-[24px] border border-white/60 bg-white/72 px-4 py-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Profile</p>
          <p class="mt-2 text-sm font-medium">Loading your details</p>
        </div>
        <div class="rounded-[24px] border border-white/60 bg-white/72 px-4 py-4">
          <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
          <p class="mt-2 text-sm font-medium">Preparing the right view</p>
        </div>
      </div>
    </div>
  </section>
</template>
