<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useApp } from "@/composables/useApp";
import DocumentTable from "./DocumentTable.vue";
import GenerationPanel from "./GenerationPanel.vue";

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
    detail: "Across resumes, CVs, cover letters, and interview packs."
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
    detail: "A stronger profile produces more grounded drafts."
  },
  {
    label: "Context sources",
    value: String(state.profile.projects.length + (state.resumeAsset ? 1 : 0)),
    detail: "Synced GitHub projects plus uploaded resume context."
  }
]);
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 lg:grid-cols-3">
      <Card v-for="card in dashboardCards" :key="card.label" class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
        <CardContent class="pt-6">
          <p class="text-sm font-medium text-[#133e87]/80">{{ card.label }}</p>
          <p class="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#133e87]">{{ card.value }}</p>
          <p class="mt-2 text-sm leading-6 text-[#608bc1]">{{ card.detail }}</p>
        </CardContent>
      </Card>
    </section>

    <Card class="border-white/60 bg-[#cbdceb]/40 backdrop-blur-md">
      <CardContent class="pt-6">
        <div class="grid gap-4 xl:grid-cols-[1.2fr_220px_auto_auto]">
          <InputGroup>
            <InputGroupAddon class="bg-[#133e87] text-white">Search</InputGroupAddon>
            <InputGroupInput v-model="controls.search" placeholder="Search generated documents" class="bg-white/90" />
          </InputGroup>
          <label class="flex h-11 items-center rounded-2xl border border-border bg-white/90 px-4 text-sm text-muted-foreground">
            <select v-model="controls.filter" class="w-full bg-transparent text-[#133e87] outline-none">
              <option v-for="option in generationKinds" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <Button class="bg-[#133e87] text-white hover:bg-[#133e87]/90" @click="startGenerateFlow">Generate</Button>
          <Button variant="outline" class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10" @click="enterProfilePage">Edit Details</Button>
        </div>
      </CardContent>
    </Card>

    <DocumentTable />

    <GenerationPanel />
  </div>
</template>
