<script setup lang="ts">
import { Spinner } from "@/components/ui/spinner";

defineProps<{
  title?: string;
  message?: string;
}>();
</script>

<template>
  <div class="grid min-h-[320px] place-items-center rounded-[28px] border border-white/60 bg-[#cbdceb]/60 p-8 text-center backdrop-blur-md">
    <div class="space-y-4">
      <div class="flex justify-center">
        <Spinner class="size-8 text-[#133e87]" />
      </div>
      <div class="space-y-2">
        <h2 class="text-xl font-semibold tracking-[-0.03em] text-[#133e87]">
          {{ title || "Loading" }}
        </h2>
        <p class="max-w-sm text-sm leading-6 text-[#608bc1]">
          {{ message || "Getting everything ready for you." }}
        </p>
      </div>
    </div>
  </div>
</template>
