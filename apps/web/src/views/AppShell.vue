<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/composables/useApp";
import AppSidebar from "@/components/app/AppSidebar.vue";
import DashboardView from "@/components/app/DashboardView.vue";
import ProfileView from "@/components/app/ProfileView.vue";

const { ui } = useApp();
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[250px_1fr]">
    <AppSidebar />

    <section class="space-y-6">
      <header class="hero-panel apple-dark-card relative overflow-hidden rounded-[32px] border border-white/60 px-6 py-7 shadow-[0_20px_60px_rgba(19,62,135,0.1)]">
        <div class="ambient-grid" />
        <div class="relative z-10 flex flex-col gap-3">
          <Badge variant="secondary" class="premium-badge w-fit">{{ ui.currentPage === "dashboard" ? "Dashboard" : "Profile" }}</Badge>
          <h1 class="text-4xl font-semibold tracking-[-0.05em]">
            {{ ui.currentPage === "dashboard" ? "Your hiring materials workspace." : "Profile details and context." }}
          </h1>
          <p class="max-w-3xl text-base leading-7 text-muted-foreground">
            {{
              ui.currentPage === "dashboard"
                ? "See recent output, search drafts, filter document types, and jump straight into generating or editing details."
                : "This is where your candidate details, supporting context, and source materials live."
            }}
          </p>
        </div>
      </header>

      <DashboardView v-if="ui.currentPage === 'dashboard'" />
      <ProfileView v-else />

      <div v-if="ui.notice || ui.error" class="apple-dark-card rounded-[28px] border border-white/60 bg-white/76 px-5 py-4">
        <p v-if="ui.notice" class="text-sm font-medium">{{ ui.notice }}</p>
        <p v-if="ui.error" class="text-sm text-primary">{{ ui.error }}</p>
      </div>
    </section>
  </div>
</template>
