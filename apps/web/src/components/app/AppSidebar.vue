<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useApp } from "@/composables/useApp";

const { auth, state, ui, logout, toggleDarkMode, enterDashboardPage, enterGeneratePage, enterProfilePage } = useApp();
</script>

<template>
  <aside class="apple-dark-card flex h-full flex-col overflow-y-auto rounded-md border border-white/10 bg-white/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-transparent">
    <p class="text-4xl text-muted-foreground font-bold text-center p-4 uppercase">Aquario</p>
    <div class="mb-6 rounded-xl border border-white/10 bg-white/90 p-6 dark:border-white/5 dark:bg-black/40 shadow-sm transition-all duration-300">
      <div v-if="auth.user?.avatarUrl" class="mx-auto h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900">
        <img :src="auth.user.avatarUrl" :alt="auth.user.name" class="h-full w-full object-cover" />
      </div>
      <div v-else class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-slate-50 text-2xl font-bold text-slate-400 shadow-md ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900">
        {{ (auth.user?.name || state.profile.fullName || "W").charAt(0).toUpperCase() }}
      </div>
      <p class="mt-4 text-center text-xl font-semibold tracking-[-0.03em]">{{ auth.user?.name || state.profile.fullName || "Workspace" }}</p>
      <p class="mt-1 text-center text-sm text-muted-foreground">{{ auth.user?.email || state.profile.headline || "Tailored hiring materials" }}</p>
      <Button variant="outline" class="mt-6 w-full rounded-lg bg-transparent hover:bg-red-500/10 hover:text-red-500 dark:border-white/10" @click="logout">Sign Out</Button>
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
        class="sidebar-link"
        :data-active="ui.currentPage === 'generate'"
        @click="enterGeneratePage"
      >
        Documents
      </button>

      <button
        type="button"
        class="sidebar-link mt-[150%] flex items-end justify-center text-2xl"
        @click="toggleDarkMode"
      >
        {{ ui.isDark ? '☀' : '☾' }}
      </button>
    </nav>
  </aside>
</template>
