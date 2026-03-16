<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useApp } from "@/composables/useApp";

const { state, ui, generation, generateDocument } = useApp();

const generationKinds = [
  { value: "tailored-resume", label: "Resume" },
  { value: "cv", label: "CV" },
  { value: "cover-letter", label: "Cover letter" },
  { value: "interview-answers", label: "Interview answers" }
] as const;

const latestGenerated = computed(() => state.generated[0] ?? null);
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_360px]">
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="text-[#133e87]">Generate a new draft</CardTitle>
        <CardDescription class="text-[#608bc1]">Use the controls below to create your next hiring artifact.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="option in generationKinds"
            :key="option.value"
            type="button"
            class="flex h-12 items-center justify-center rounded-2xl border border-white/60 text-sm font-medium transition-all duration-300"
            :class="[
              generation.kind === option.value 
                ? 'bg-[#133e87] text-white shadow-lg' 
                : 'bg-white/70 text-[#133e87] hover:bg-white/90'
            ]"
            @click="generation.kind = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <div class="grid gap-3 rounded-[24px] border border-white/50 bg-white/70 p-4">
          <div class="flex items-center gap-3">
            <Checkbox v-model:checked="generation.includeGithub" class="border-[#133e87] data-[state=checked]:bg-[#133e87]" />
            <Label class="text-[#133e87]">Include synced GitHub repositories</Label>
          </div>
          <div class="flex items-center gap-3">
            <Checkbox v-model:checked="generation.includeResume" class="border-[#133e87] data-[state=checked]:bg-[#133e87]" />
            <Label class="text-[#133e87]">Include uploaded resume context</Label>
          </div>
        </div>
        <div class="field-group">
          <Label class="text-[#133e87]">Additional instructions</Label>
          <Textarea
            v-model="generation.userRequest"
            :rows="5"
            class="bg-white/90"
            placeholder="Emphasize product thinking, clarity, measurable outcomes, and customer-facing communication."
          />
        </div>
      </CardContent>
      <CardFooter class="justify-end px-6 pb-6">
        <Button :disabled="ui.generatingDocument" class="bg-[#133e87] text-white hover:bg-[#133e87]/90 px-8" @click="generateDocument">
          <Spinner v-if="ui.generatingDocument" class="mr-2" />
          Generate Draft
        </Button>
      </CardFooter>
    </Card>

    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="text-[#133e87]">Latest document</CardTitle>
        <CardDescription class="text-[#608bc1]">Your most recent output stays visible here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="latestGenerated" class="rounded-[24px] border border-white/50 bg-white/70 p-5 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-3">
            <Badge variant="secondary" class="bg-[#cbdceb] text-[#133e87]">{{ latestGenerated.kind }}</Badge>
            <span class="text-xs text-[#608bc1]">{{ new Date(latestGenerated.createdAt).toLocaleString() }}</span>
          </div>
          <pre class="max-h-[360px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-[#133e87] font-mono">{{ latestGenerated.content }}</pre>
        </div>
        <Skeleton v-else class="h-72 w-full rounded-[24px] bg-white/50" />
      </CardContent>
    </Card>
  </div>
</template>
