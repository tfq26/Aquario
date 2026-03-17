<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useApp } from "@/composables/useApp";

const { auth, state, ui, logout, toggleDarkMode, enterDashboardPage, enterProfilePage } = useApp();
</script>

<template>
  <aside class="apple-dark-card rounded-[32px] border border-white/60 bg-white/74 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
    <div class="mb-6 rounded-[26px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,245,247,0.88))] p-4 dark:glass-dark">
      <p class="text-xs text-muted-foreground">Aquario</p>
      <p class="mt-2 text-xl font-semibold tracking-[-0.03em]">{{ auth.user?.name || state.profile.fullName || "Workspace" }}</p>
      <p class="mt-1 text-sm text-muted-foreground">{{ auth.user?.email || state.profile.headline || "Tailored hiring materials" }}</p>
      <Button variant="outline" class="mt-6 w-full hover:bg-red-500/15 hover:text-red-500" @click="logout">Sign Out</Button>
    </div>

    <nav class="grid gap-2">
      <button 
        type="button" 
        class="sidebar-link" 
        :data-active="ui.currentPage === 'dashboard'" 
        @click="enterDashboardPage"
      >
        Dashboard
      </button>
      <button 
        type="button" 
        class="sidebar-link" 
        :data-active="ui.currentPage === 'profile'" 
        @click="enterProfilePage"
      >
        Profile
      </button>

      <button
        type="button"
        class="sidebar-link mt-4 flex items-center justify-between"
        @click="toggleDarkMode"
      >
        <span>{{ ui.isDark ? 'Light Appearance' : 'Dark Appearance' }}</span>
        <span class="rounded-full border border-current/15 px-2 py-0.5 text-xs font-semibold tracking-[0.08em] uppercase opacity-80">
          {{ ui.isDark ? 'Light' : 'Dark' }}
        </span>
      </button>
    </nav>

    <div class="mt-6 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-sm dark:glass-dark">
      <p class="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Active Context</p>
      <div class="mt-3 grid gap-3">
        <div class="flex items-center gap-3 text-sm text-[#608bc1] dark:text-muted-foreground">
          <span class="text-lg">{{ state.resumeAsset ? '✅' : '❌' }}</span>
          {{ state.resumeAsset ? state.resumeAsset.fileName : "No resume uploaded" }}
        </div>
        <div class="flex items-center gap-3 text-sm text-[#608bc1] dark:text-muted-foreground">
          <span class="text-lg">{{ state.repos.length ? '✅' : '❌' }}</span>
          {{ state.profile.projects.length ? `${state.profile.projects.length} projects synced` : "GitHub not connected" }}
        </div>
      </div>
    </div>
  </aside>
</template>
