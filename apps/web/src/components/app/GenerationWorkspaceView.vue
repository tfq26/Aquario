<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/composables/useApp";

const {
  state,
  ui,
  documentBuilder,
  selectedResumeFile,
  uploadResume,
  suggestDocumentSelections,
  generateWorkspaceDocument
} = useApp();

const wizardSteps = ["Document", "Base", "Details", "Selections", "Preview"] as const;

const kindOptions = [
  {
    value: "tailored-resume",
    label: "Resume",
    description: "Best for most job applications."
  },
  {
    value: "cv",
    label: "CV",
    description: "A fuller academic or professional history."
  },
  {
    value: "cover-letter",
    label: "Cover letter",
    description: "A targeted introduction for one role."
  },
  {
    value: "interview-answers",
    label: "Interview answers",
    description: "Practice responses tailored to the job."
  }
] as const;

const sourceOptions = [
  {
    value: "existing-resume",
    label: "Use saved resume",
  },
  {
    value: "uploaded-resume",
    label: "Upload a different one",
  },
  {
    value: "template-only",
    label: "Start from a template",
    description: "Build it from your profile details and selections only."
  }
] as const;

const templateOptions = [
  {
    value: "classic",
    label: "Classic",
    description: "Clean, familiar, and recruiter-friendly."
  },
  {
    value: "compact",
    label: "Compact",
    description: "Tighter and better when space matters."
  },
  {
    value: "technical",
    label: "Technical",
    description: "More room for systems, tools, and depth."
  }
] as const;

function toggleValue(collection: string[], value: string) {
  return collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value];
}

function sortWithSuggestions<T extends { id: string }>(items: T[], suggestedIds: string[]) {
  const suggestions = new Set(suggestedIds);
  return [...items].sort((left, right) => {
    const leftSuggested = suggestions.has(left.id) ? 1 : 0;
    const rightSuggested = suggestions.has(right.id) ? 1 : 0;

    if (leftSuggested !== rightSuggested) {
      return rightSuggested - leftSuggested;
    }

    return 0;
  });
}

const sortedExperiences = computed(() => sortWithSuggestions(state.profile.experience, documentBuilder.suggestions.experienceIds));
const sortedProjects = computed(() => sortWithSuggestions(state.profile.projects, documentBuilder.suggestions.projectIds));
const sortedCertifications = computed(() =>
  sortWithSuggestions(state.profile.certifications, documentBuilder.suggestions.certificationIds)
);
const sortedSkills = computed(() => {
  const suggestions = new Set(documentBuilder.suggestions.skillNames);
  return [...state.profile.skills].sort((left, right) => {
    const leftSuggested = suggestions.has(left) ? 1 : 0;
    const rightSuggested = suggestions.has(right) ? 1 : 0;

    if (leftSuggested !== rightSuggested) {
      return rightSuggested - leftSuggested;
    }

    return left.localeCompare(right);
  });
});

const previewContent = computed(() => documentBuilder.preview?.content ?? "");
const isAddressedDocument = computed(() => documentBuilder.kind === "cv" || documentBuilder.kind === "cover-letter");
const uploadedResumeReady = computed(
  () => !!selectedResumeFile.value && state.resumeAsset?.fileName === selectedResumeFile.value.name
);

const selectedTotals = computed(() => ({
  experiences: documentBuilder.selectedExperienceIds.length,
  projects: documentBuilder.selectedProjectIds.length,
  certifications: documentBuilder.selectedCertificationIds.length,
  skills: documentBuilder.selectedSkillNames.length
}));

const canContinue = computed(() => {
  if (documentBuilder.step === 0) {
    return !!documentBuilder.kind;
  }

  if (documentBuilder.step === 1) {
    if (documentBuilder.sourceMode === "existing-resume") {
      return !!state.resumeAsset;
    }

    if (documentBuilder.sourceMode === "uploaded-resume") {
      return uploadedResumeReady.value;
    }

    return true;
  }

  if (documentBuilder.step === 2) {
    return (
      documentBuilder.companyName.trim().length > 0 &&
      documentBuilder.roleTitle.trim().length > 0 &&
      documentBuilder.jobDescription.trim().length > 0 &&
      (!isAddressedDocument.value ||
        !!documentBuilder.addresseeName.trim() ||
        !!documentBuilder.addresseeTitle.trim() ||
        !!documentBuilder.addresseeCompany.trim())
    );
  }

  if (documentBuilder.step === 3) {
    return (
      documentBuilder.selectedExperienceIds.length > 0 ||
      documentBuilder.selectedProjectIds.length > 0 ||
      documentBuilder.selectedCertificationIds.length > 0 ||
      documentBuilder.selectedSkillNames.length > 0
    );
  }

  return true;
});

const wizardCopy = computed(() => {
  if (documentBuilder.step === 0) {
    return {
      badge: "Step 1",
      title: "Pick your document",
      body: "What kind of document do you want to create?",
      points: [
        "Choose a document type.",
        "You can change it later if you want.",
        "We'll tailor it to your experience and the role."
      ]
    };
  }

  if (documentBuilder.step === 1) {
    return {
      badge: "Step 2",
      title: "Choose your starting point",
      body: "Tell us whether to use an existing resume or start from a template.",
      points: [
        "Use your saved resume if it already looks close.",
        "Upload another resume if you want a different base.",
        "Pick a template if you want to build from your profile only."
      ]
    };
  }

  if (documentBuilder.step === 2) {
    return {
      badge: "Step 3",
      title: "Add the target details",
      body: "Now we need the role details and job description.",
      points: [
        "Paste the full job description for better suggestions.",
        "Add a little extra context if there is anything special to emphasize.",
        "For letters and CVs, tell us who this should be addressed to."
      ]
    };
  }

  if (documentBuilder.step === 3) {
    return {
      badge: "Step 4",
      title: "Choose what to include",
      body: "We will put the strongest suggested items at the top for you.",
      points: [
        "Suggested items appear first in each list.",
        "Keep only the experiences and skills you want in this version.",
        "Once you are happy, we will generate the draft."
      ]
    };
  }

  return {
    badge: "Step 5",
    title: "Review and tweak",
    body: "Your first draft is ready. Make changes, regenerate, and download when it feels right.",
    points: [
      "Use the tweak box to ask for tone or emphasis changes.",
      "Regenerate as many times as you need.",
      "Download once the preview looks right."
    ]
  };
});

function handleResumeSelection(event: Event) {
  selectedResumeFile.value = ((event.target as HTMLInputElement).files?.[0] ?? null);
}

async function continueFromBaseStep() {
  ui.error = "";

  if (documentBuilder.sourceMode === "existing-resume" && !state.resumeAsset) {
    ui.error = "There is no saved resume in your profile yet.";
    return;
  }

  if (documentBuilder.sourceMode === "uploaded-resume") {
    if (!selectedResumeFile.value) {
      ui.error = "Choose a resume file first.";
      return;
    }

    if (!uploadedResumeReady.value) {
      await uploadResume();
      if (ui.error) {
        return;
      }
    }
  }

  documentBuilder.step += 1;
}

async function continueFromDetailsStep() {
  await suggestDocumentSelections();
  if (!ui.error) {
    documentBuilder.step += 1;
  }
}

async function continueFromSelectionsStep() {
  await generateWorkspaceDocument();
  if (!ui.error && documentBuilder.preview) {
    documentBuilder.step += 1;
  }
}

async function handleNext() {
  if (!canContinue.value) {
    return;
  }

  if (documentBuilder.step === 1) {
    await continueFromBaseStep();
    return;
  }

  if (documentBuilder.step === 2) {
    await continueFromDetailsStep();
    return;
  }

  if (documentBuilder.step === 3) {
    await continueFromSelectionsStep();
    return;
  }

  documentBuilder.step = Math.min(documentBuilder.step + 1, wizardSteps.length - 1);
}

function handleBack() {
  documentBuilder.step = Math.max(documentBuilder.step - 1, 0);
}

function handleStepSelect(step: number) {
  if (step <= documentBuilder.step) {
    documentBuilder.step = step;
  }
}

function downloadPreview() {
  if (!documentBuilder.preview) {
    return;
  }

  const blob = new Blob([documentBuilder.preview.content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${documentBuilder.kind}-${new Date().toISOString().slice(0, 10)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="relative overflow-hidden rounded-md border-none-none py-4">
    <div class="ambient-grid" />
    <div class="ambient-orb ambient-orb-a" />
    <div class="ambient-orb ambient-orb-b" />

    <Card class="relative overflow-hidden border-none-white/60 bg-[#cbdceb]/60 dark:border-none dark:bg-black">
      <div class="grid min-h-[780px] lg:grid-cols-[0.86fr_1.14fr]">
        <div class="flex flex-col justify-between border-none-none p-6">
          <div class="space-y-6">
            <div class="space-y-3">
              <h2 class="text-4xl font-semibold tracking-[-0.05em] sm:text-[2.65rem]">{{ wizardCopy.title }}</h2>
              <p class="max-w-md text-base leading-7 text-muted-foreground">{{ wizardCopy.body }}</p>
            </div>

            <div class="rounded-md border-none-none bg-white/62 dark:bg-black/30 p-6 space-y-4">
              <div v-for="point in wizardCopy.points" :key="point" class="flex items-start gap-3 text-sm text-foreground">
                <div class="mt-2 size-1.5 shrink-0 rounded-full bg-primary dark:bg-sky-400" />
                <p class="leading-6">{{ point }}</p>
              </div>
            </div>

            <div class="rounded-md border-none-none bg-white/62 dark:bg-black/30 p-6 space-y-3">
              <p class="text-sm font-semibold text-foreground">Current choices</p>
              <div class="grid gap-2 text-sm text-muted-foreground">
                <p>Document: {{ kindOptions.find((option) => option.value === documentBuilder.kind)?.label }}</p>
                <p>Base: {{ sourceOptions.find((option) => option.value === documentBuilder.sourceMode)?.label }}</p>
                <p>Template: {{ templateOptions.find((option) => option.value === documentBuilder.templateId)?.label }}</p>
                <p v-if="documentBuilder.step >= 3">
                  Selected: {{ selectedTotals.experiences }} experiences, {{ selectedTotals.projects }} projects, {{ selectedTotals.certifications }} certifications, {{ selectedTotals.skills }} skills
                </p>
              </div>
            </div>
          </div>

          <div class="mt-8">
            <Stepper :steps="wizardSteps" :current-step="documentBuilder.step" @select="handleStepSelect" />
          </div>
        </div>

        <div class="flex flex-col overflow-hidden">
          <div class="flex-1 overflow-y-auto p-6 flex flex-col">
            <div class="mx-auto my-auto w-full max-w-3xl flex flex-col space-y-8">
              <div v-if="documentBuilder.step === 0" class="wizard-screen space-y-6">
                <div class="space-y-3">
                  <div class="grid gap-3">
                    <button
                      v-for="option in kindOptions"
                      :key="option.value"
                      type="button"
                      class="rounded-md border-none p-7 text-center transition-all duration-300"
                      :class="[
                        documentBuilder.kind === option.value
                          ? 'border-none-transparent bg-[#133e87] dark:bg-sky-700 text-white shadow-lg'
                          : 'border-none-white/60 bg-white/78 dark:bg-white/5 dark:border-none-white/10 text-[#133e87] dark:text-[#f3f3e0] hover:bg-white/90 dark:hover:bg-white/10'
                      ]"
                      @click="documentBuilder.kind = option.value"
                    >
                      <p class="text-base font-semibold">{{ option.label }}</p>
                      <p class="mt-2 text-sm leading-6" :class="documentBuilder.kind === option.value ? 'text-white/80' : 'text-[#608bc1] dark:text-sky-300'">
                        {{ option.description }}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else-if="documentBuilder.step === 1" class="wizard-screen space-y-6">
                <div class="space-y-3">
                  <div class="grid gap-3 md:grid-cols-3">
                    <button
                      v-for="option in sourceOptions"
                      :key="option.value"
                      type="button"
                      class="rounded-md border-none p-4 text-center transition-all duration-300"
                      :class="[
                        documentBuilder.sourceMode === option.value
                          ? 'border-none-transparent bg-[#133e87] dark:bg-sky-700 text-white shadow-lg'
                          : 'border-none-white/60 bg-white/78 dark:bg-white/5 dark:border-none-white/10 text-[#133e87] dark:text-[#f3f3e0] hover:bg-white/90 dark:hover:bg-white/10'
                      ]"
                      @click="documentBuilder.sourceMode = option.value"
                    >
                      <p class="text-sm font-semibold">{{ option.label }}</p>
                    </button>
                  </div>
                </div>

                <div v-if="documentBuilder.sourceMode === 'existing-resume'" class="rounded-md border-none border-none-white/60 bg-white/78 dark:bg-white/5 dark:border-none-white/10 p-5">
                  <p class="text-sm font-semibold text-[#133e87] dark:text-[#f3f3e0]">
                    {{ state.resumeAsset ? `Using ${state.resumeAsset.fileName}` : "No saved resume found yet." }}
                  </p>
                  <p class="mt-2 text-sm leading-6 text-[#608bc1] dark:text-sky-400">
                    {{ state.resumeAsset ? "We will use your saved resume as the starting point." : "Switch to upload or template if you do not have one saved yet." }}
                  </p>
                </div>

                <div v-else-if="documentBuilder.sourceMode === 'uploaded-resume'" class="space-y-3 rounded-md border-none border-none-white/60 dark:border-none-white/10 bg-white/78 dark:bg-black/20 p-5">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Upload the resume you want to use</Label>
                  <Input type="file" accept=".pdf,.doc,.docx,.txt" @change="handleResumeSelection" />
                  <div class="flex flex-wrap items-center gap-3">
                    <Button variant="outline" :disabled="ui.uploadingResume || !selectedResumeFile" @click="uploadResume">
                      <Spinner v-if="ui.uploadingResume" class="mr-2" />
                    </Button>
                  </div>
                </div>

                <div class="space-y-3">
                  <Label class="text-center block w-full text-lg mb-2">Pick a template style</Label>
                  <div class="grid gap-3">
                    <button
                      v-for="template in templateOptions"
                      :key="template.value"
                      type="button"
                      class="rounded-md border-none p-7 text-center transition-all duration-300"
                      :class="[
                        documentBuilder.templateId === template.value
                          ? 'border-none-transparent bg-[#133e87] dark:bg-sky-700 text-white shadow-lg'
                          : 'border-none-white/60 bg-white/78 dark:bg-white/5 dark:border-none-white/10 text-[#133e87] dark:text-[#f3f3e0] hover:bg-white/90 dark:hover:bg-white/10'
                      ]"
                      @click="documentBuilder.templateId = template.value"
                    >
                      <p class="text-base font-semibold">{{ template.label }}</p>
                      <p class="mt-2 text-sm leading-6" :class="documentBuilder.templateId === template.value ? 'text-white/80' : 'text-[#608bc1]'">
                        {{ template.description }}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              <div v-else-if="documentBuilder.step === 2" class="wizard-screen space-y-6">
                <div class="field-group">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Company</Label>
                  <Input v-model="documentBuilder.companyName" placeholder="North Star Systems" />
                </div>

                <div class="field-group">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Role</Label>
                  <Input v-model="documentBuilder.roleTitle" placeholder="Software Engineer" />
                </div>

                <div v-if="isAddressedDocument" class="rounded-md border-none border-none-white/60 dark:border-none-white/10 bg-white/78 dark:bg-black/20 p-5 space-y-4">
                  <p class="text-sm font-semibold text-[#133e87] dark:text-[#f3f3e0]">Who should this be addressed to?</p>
                  <div class="space-y-4">
                    <div class="field-group">
                      <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Name</Label>
                      <Input v-model="documentBuilder.addresseeName" placeholder="Jane Smith" />
                    </div>
                    <div class="field-group">
                      <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Title</Label>
                      <Input v-model="documentBuilder.addresseeTitle" placeholder="Hiring Manager" />
                    </div>
                    <div class="field-group">
                      <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Company</Label>
                      <Input v-model="documentBuilder.addresseeCompany" placeholder="North Star Systems" />
                    </div>
                  </div>
                </div>

                <div class="field-group">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Job description</Label>
                    <Textarea
                      v-model="documentBuilder.jobDescription"
                      :rows="10"
                      placeholder="Paste the full job description here."
                    />
                </div>

                <div class="field-group">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Extra context</Label>
                    <Textarea
                      v-model="documentBuilder.hiringManagerNotes"
                      :rows="5"
                      placeholder="Add anything else you want us to keep in mind."
                    />
                </div>
              </div>

              <div v-else-if="documentBuilder.step === 3" class="wizard-screen space-y-6">
                <div class="rounded-md border-none border-none-white/60 dark:border-none-white/10 bg-white/78 dark:bg-black/40 p-5">
                  <p class="text-sm font-semibold text-[#133e87] dark:text-[#f3f3e0]">Suggested for this job</p>
                  <p class="mt-2 text-sm leading-6 text-[#608bc1] dark:text-sky-400">
                    {{ documentBuilder.suggestions.reasoning || "We matched your profile to the job and moved the strongest items to the top." }}
                  </p>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <Label>Experiences</Label>
                    <Badge variant="secondary">{{ selectedTotals.experiences }} selected</Badge>
                  </div>
                  <div class="grid gap-3">
                    <label
                      v-for="item in sortedExperiences"
                      :key="item.id"
                      class="rounded-md border-none border-none-white/60 bg-white/78 p-4"
                    >
                      <div class="flex items-start gap-3">
                        <Checkbox
                          :checked="documentBuilder.selectedExperienceIds.includes(item.id)"
                          @update:checked="documentBuilder.selectedExperienceIds = toggleValue(documentBuilder.selectedExperienceIds, item.id)"
                        />
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-[#133e87]">{{ item.title || "Untitled role" }}</p>
                            <Badge v-if="documentBuilder.suggestions.experienceIds.includes(item.id)" variant="outline">Suggested</Badge>
                          </div>
                          <p class="mt-1 text-sm text-[#608bc1]">{{ item.company }} • {{ item.startDate || "Unknown" }} - {{ item.endDate || "Present" }}</p>
                          <p class="mt-2 text-sm leading-6 text-[#133e87]/85">{{ item.highlights[0] || "No highlight added yet." }}</p>
                        </div>
                      </div>
                    </label>
                    <p v-if="!state.profile.experience.length" class="text-sm text-[#608bc1]">No experiences saved yet.</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <Label>Projects</Label>
                    <Badge variant="secondary">{{ selectedTotals.projects }} selected</Badge>
                  </div>
                  <div class="grid gap-3">
                    <label
                      v-for="item in sortedProjects"
                      :key="item.id"
                      class="rounded-md border-none border-none-white/60 bg-white/78 p-4"
                    >
                      <div class="flex items-start gap-3">
                        <Checkbox
                          :checked="documentBuilder.selectedProjectIds.includes(item.id)"
                          @update:checked="documentBuilder.selectedProjectIds = toggleValue(documentBuilder.selectedProjectIds, item.id)"
                        />
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-[#133e87]">{{ item.title || "Untitled project" }}</p>
                            <Badge v-if="documentBuilder.suggestions.projectIds.includes(item.id)" variant="outline">Suggested</Badge>
                          </div>
                          <p class="mt-1 text-sm text-[#608bc1]">{{ item.category || "Project" }}</p>
                          <p class="mt-2 text-sm leading-6 text-[#133e87]/85">{{ item.summary || item.highlights[0] || "No project summary yet." }}</p>
                        </div>
                      </div>
                    </label>
                    <p v-if="!state.profile.projects.length" class="text-sm text-[#608bc1]">No projects saved yet.</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <Label>Certifications</Label>
                    <Badge variant="secondary">{{ selectedTotals.certifications }} selected</Badge>
                  </div>
                  <div class="grid gap-3">
                    <label
                      v-for="item in sortedCertifications"
                      :key="item.id"
                      class="rounded-md border-none border-none-white/60 bg-white/78 p-4"
                    >
                      <div class="flex items-start gap-3">
                        <Checkbox
                          :checked="documentBuilder.selectedCertificationIds.includes(item.id)"
                          @update:checked="documentBuilder.selectedCertificationIds = toggleValue(documentBuilder.selectedCertificationIds, item.id)"
                        />
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-[#133e87]">{{ item.name || "Untitled certification" }}</p>
                            <Badge v-if="documentBuilder.suggestions.certificationIds.includes(item.id)" variant="outline">Suggested</Badge>
                          </div>
                          <p class="mt-1 text-sm text-[#608bc1]">{{ item.issuer || "Issuer not added yet" }}</p>
                        </div>
                      </div>
                    </label>
                    <p v-if="!state.profile.certifications.length" class="text-sm text-[#608bc1]">No certifications saved yet.</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <Label>Skills</Label>
                    <Badge variant="secondary">{{ selectedTotals.skills }} selected</Badge>
                  </div>
                  <div class="grid gap-2">
                    <label
                      v-for="skill in sortedSkills"
                      :key="skill"
                      class="flex items-center gap-3 rounded-md border-none border-none-white/60 bg-white/78 px-4 py-3"
                    >
                      <Checkbox
                        :checked="documentBuilder.selectedSkillNames.includes(skill)"
                        @update:checked="documentBuilder.selectedSkillNames = toggleValue(documentBuilder.selectedSkillNames, skill)"
                      />
                      <span class="text-sm font-medium text-[#133e87]">{{ skill }}</span>
                      <Badge v-if="documentBuilder.suggestions.skillNames.includes(skill)" variant="outline" class="ml-auto">Suggested</Badge>
                    </label>
                    <p v-if="!state.profile.skills.length" class="text-sm text-[#608bc1]">No skills saved yet.</p>
                  </div>
                </div>
              </div>

              <div v-else class="wizard-screen space-y-6">
                <div class="rounded-md border-none border-none-white/60 bg-white/78 p-5 space-y-3">
                  <div class="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{{ kindOptions.find((option) => option.value === documentBuilder.kind)?.label }}</Badge>
                    <Badge variant="secondary">{{ templateOptions.find((option) => option.value === documentBuilder.templateId)?.label }}</Badge>
                    <Badge variant="secondary">{{ sourceOptions.find((option) => option.value === documentBuilder.sourceMode)?.label }}</Badge>
                  </div>
                  <p class="text-sm leading-6 text-[#608bc1]">
                    Ask for a different tone, stronger technical language, shorter bullets, or anything else you want to refine.
                  </p>
                </div>

                <div class="field-group text-center">
                  <Label class="text-center block w-full text-lg mb-2 dark:text-[#f3f3e0]">Tweak this draft</Label>
                    <Textarea
                      v-model="documentBuilder.userRequest"
                      :rows="5"
                      placeholder="Example: Make this more concise and emphasize backend systems work."
                    />
                </div>

                <div class="flex flex-wrap gap-4 justify-center">
                  <Button class="bg-[#133e87] text-white hover:bg-[#133e87]/90 px-8 py-6 rounded-md h-auto text-lg" :disabled="ui.generatingWorkspaceDocument" @click="generateWorkspaceDocument">
                    <Spinner v-if="ui.generatingWorkspaceDocument" class="mr-2" />
                    Update Preview
                  </Button>
                  <Button variant="outline" class="px-8 py-6 rounded-md h-auto text-lg" :disabled="!documentBuilder.preview" @click="downloadPreview">Download</Button>
                </div>

                <div class="rounded-md border-none border-none-white/55 dark:border-none-white/10 bg-white/85 dark:bg-black/60 p-5 shadow-sm">
                  <pre v-if="previewContent" class="max-h-[760px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-[#133e87] dark:text-[#f3f3e0] font-mono">{{ previewContent }}</pre>
                  <div v-else class="grid min-h-[320px] place-items-center text-center text-sm text-[#608bc1] dark:text-sky-400">
                    Your preview will appear here once it is generated.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-none-t border-none-white/50 px-6 py-8">
            <div class="mx-auto flex max-w-3xl flex-wrap justify-center gap-8">
              <Button variant="outline" class="px-10 py-6 rounded-md h-auto text-lg" :disabled="documentBuilder.step === 0 || ui.suggestingSelections || ui.generatingWorkspaceDocument" @click="handleBack">
                Back
              </Button>

              <Button
                v-if="documentBuilder.step < 4"
                class="bg-[#133e87] dark:bg-sky-800 text-white hover:bg-[#133e87]/90 dark:hover:bg-sky-700 px-10 py-6 rounded-md h-auto text-lg font-semibold"
                :disabled="!canContinue || ui.uploadingResume || ui.suggestingSelections || ui.generatingWorkspaceDocument"
                @click="handleNext"
              >
                <Spinner v-if="ui.suggestingSelections || ui.generatingWorkspaceDocument" class="mr-2" />
                {{
                  documentBuilder.step === 2
                    ? "Find Suggestions"
                    : documentBuilder.step === 3
                      ? "Generate Draft"
                      : documentBuilder.step === 4
                        ? "Ready"
                      : "Next"
                }}
              </Button>

              <div v-else />
            </div>
          </div>
        </div>
      </div>
    </Card>
  </section>
</template>
