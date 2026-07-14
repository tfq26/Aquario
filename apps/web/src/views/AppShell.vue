<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/composables/useApp";
import AppSidebar from "@/components/app/AppSidebar.vue";
import DashboardView from "@/components/app/DashboardView.vue";
import ProfileView from "@/components/app/ProfileView.vue";
import GenerationWorkspaceView from "@/components/app/GenerationWorkspaceView.vue";

const { ui } = useApp();
</script>

<template>
  <div class="relative w-full">
    <!-- Sidebar Trigger Zone (Invisible vertical bar on the left) -->
    <div 
      class="fixed bottom-0 left-0 top-0 z-50 w-6" 
      @mouseenter="ui.isSidebarVisible = true"
    />

    <!-- Fixed Sidebar Overlay -->
    <div 
      class="fixed inset-y-0 left-0 z-50 p-6 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
      :class="[
        ui.isSidebarVisible ? 'translate-x-0 opacity-100 transform' : '-translate-x-full opacity-0 pointer-events-none transform'
      ]"
      @mouseleave="ui.isSidebarVisible = false"
    >
      <AppSidebar class="h-full w-[280px]" />
    </div>

    <!-- Main Content -->
    <section class="min-h-screen px-4 py-2 transition-all duration-500 @container xl:px-8" :class="[ui.isSidebarVisible ? 'xl:pl-84' : '']">
      <header class="hero-panel apple-dark-card relative overflow-hidden rounded-md border border-white/10 px-6 py-7 shadow-[0_20px_60px_rgba(19,62,135,0.1)]">
        <div class="ambient-grid" />
        <div class="relative z-10 flex flex-col gap-3">
          <h1 class="text-4xl font-semibold tracking-[-0.05em]">
            {{
              ui.currentPage === "dashboard"
                ? "Your hiring materials workspace."
                : ui.currentPage === "profile"
                  ? "Profile details and context."
                  : "Generate one document at a time."
            }}
          </h1>
          <p class="max-w-3xl text-xs leading-7 text-muted-foreground">
            {{
              ui.currentPage === "dashboard"
                ? "See recent output, search drafts, filter document types, and jump straight into generating or editing details."
                : ui.currentPage === "profile"
                  ? "This is where your candidate details, supporting context, and source materials live."
                  : "Move through a guided document wizard, choose your source, review suggested evidence, and refine the draft at the end."
            }}
          </p>
        </div>
      </header>

      <div class="mt-6 space-y-6 pb-12">
        <DashboardView v-if="ui.currentPage === 'dashboard'" />
        <ProfileView v-else-if="ui.currentPage === 'profile'" />
        <GenerationWorkspaceView v-else />
      </div>
    </section>
  </div>
</template>
