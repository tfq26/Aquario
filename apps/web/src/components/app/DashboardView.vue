<script setup lang="ts">
import { computed } from "vue";
import { Search, Github, FileText, UserCheck, Database, LayoutDashboard, PlusCircle, UserCircle } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BentoGrid, BentoGridCard } from "@/components/ui/bento-grid";
import { useApp } from "@/composables/useApp";
import DocumentTable from "./DocumentTable.vue";

const { state, ui, controls, enterProfilePage, startGenerateFlow } = useApp();

const generationKinds = [
  { value: "all", label: "All drafts" },
  { value: "tailored-resume", label: "Resume" },
  { value: "cv", label: "CV" },
  { value: "cover-letter", label: "Cover letter" },
  { value: "interview-answers", label: "Interview answers" }
] as const;

const dashboardCards = computed(() => [
  {
    label: "Generated documents",
    value: String(state.generated.length),
    detail: "Across resumes, CVs, cover letters, and interview packs.",
    icon: FileText
  },
  {
    label: "Profile completeness",
    value: `${Math.min(
      100,
      (Number(Boolean(state.profile.fullName)) +
        Number(Boolean(state.profile.summary)) +
        Number(Boolean(state.job.roleTitle)) +
        Number(state.profile.experience.length > 0) +
        Number(state.resumeAsset !== null)) *
        20
    )}%`,
    detail: "A stronger profile produces more grounded drafts.",
    icon: UserCheck
  },
  {
    label: "Context sources",
    value: String(state.profile.projects.length + (state.resumeAsset ? 1 : 0)),
    detail: "Synced GitHub projects plus uploaded resume context.",
    icon: Database
  }
]);
</script>

<template>
  <div class="space-y-8">
    <!-- Bento Grid Section -->
    <BentoGrid class="w-full">
      <BentoGridCard
        v-for="card in dashboardCards"
        :key="card.label"
        :name="card.label"
        :description="card.detail"
        :icon="card.icon"
        href="#"
        cta="View details"
        class="border-none bg-[#cbdceb]/40 backdrop-blur-md dark:bg-black/40"
      >
        <template #background>
          <div class="absolute inset-0 flex items-center justify-center opacity-15 transition-opacity duration-300 group-hover:opacity-20">
            <component :is="card.icon" class="size-20 text-[#133e87] dark:text-sky-300" />
          </div>
          <div class="absolute top-3 right-3 text-xl font-black tracking-tight text-[#133e87] dark:text-[#f3f3e0] opacity-30">
            {{ card.value }}
          </div>
        </template>
      </BentoGridCard>

      <BentoGridCard
        name="Update Profile"
        description="Refine your details to improve the quality of generated documents."
        :icon="UserCircle"
        href="#"
        cta="Edit profile"
        class="border-none bg-[#cbdceb]/40 backdrop-blur-md dark:bg-black/40 md:col-span-1"
        @click="enterProfilePage"
      >
        <template #background>
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </template>
      </BentoGridCard>
    </BentoGrid>

    <!-- Search & Filter Card -->
    <Card class="border-none bg-[#cbdceb]/40 backdrop-blur-md dark:bg-black/40 shadow-sm rounded-xl overflow-hidden">
      <CardContent class="p-6">
        <div class="grid gap-4 xl:grid-cols-[1.2fr_220px_auto_auto]">
          <Input
            v-model="controls.search"
            :icon="Search"
            placeholder="Search generated documents..."
            class="h-12 text-base"
          />
          
          <Select
            v-model="controls.filter"
            :icon="LayoutDashboard"
            placeholder="Filter by type"
            class="h-12"
          >
            <option v-for="option in generationKinds" :key="option.value" :value="option.value">{{ option.label }}</option>
          </Select>
          
          <Button class="h-12 px-8 bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95" @click="startGenerateFlow">
            <PlusCircle class="mr-2 size-4" />
            Generate New
          </Button>
          
          <Button variant="ghost" class="h-12 rounded-xl text-[#133e87] dark:text-sky-300 hover:bg-indigo-500/10 transition-colors" @click="enterProfilePage">
            <UserCircle class="mr-2 size-4" />
            Profile Settings
          </Button>
        </div>
      </CardContent>
    </Card>

    <DocumentTable />
  </div>
</template>
