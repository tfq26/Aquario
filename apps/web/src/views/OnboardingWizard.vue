<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Stepper } from "@/components/ui/stepper";
import { CalendarInput } from "@/components/ui/calendar";
import TagRepositoryField from "@/components/app/TagRepositoryField.vue";
import UniversityInput from "@/components/app/UniversityInput.vue";
import { useApp } from "@/composables/useApp";
import { skillOptions, technologyOptions } from "@/lib/catalog";
import { countryOptions } from "@/lib/countries";

const { 
  state, auth, ui, 
  logout, saveProfile, saveJob, 
  syncGithub, uploadResume, importResume, generateHeadline, generateSummary,
  addExperience, removeExperience, addEducation, removeEducation, addCertification, removeCertification,
  addCustomSection, removeCustomSection, clearAllExperiences, completeWizardAndContinue,
  headlineOptions, headlineSelection, isCustomHeadline,
  selectedResumeFile
} = useApp();

const educationLevels = [
  "High School Diploma",
  "Associates Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "MBA",
  "JD",
  "MD",
  "PhD",
  "Other"
];

const wizardSteps = ["Base Information", "Experience", "Target Role"] as const;

const canProceed = computed(() => {
  if (ui.wizardStep === 0) {
    return (
      state.profile.fullName.trim().length > 0 &&
      state.profile.headline.trim().length > 0 &&
      state.profile.email.trim().length > 0
    );
  }

  if (ui.wizardStep === 1) {
    return (
      (state.profile.experience.length > 0 &&
        state.profile.experience.every((exp) => exp.company.trim().length > 0 && exp.title.trim().length > 0)) ||
      state.profile.education.some((edu) => edu.school.trim().length > 0 || edu.degree.trim().length > 0) ||
      state.profile.certifications.some((cert) => cert.name.trim().length > 0) ||
      state.profile.customSections.some((section) => section.title.trim().length > 0 || section.items.some((item) => item.trim().length > 0))
    );
  }

  if (ui.wizardStep === 2) {
    return (
      state.job.companyName.trim().length > 0 &&
      state.job.roleTitle.trim().length > 0 &&
      state.job.jobDescription.trim().length > 0
    );
  }

  return true;
});

const wizardCopy = computed(() => {
  if (ui.wizardStep === 0) {
    return {
      badge: "Step 1",
      title: "Tell us about you",
      body: "Start with the basics so Aquario can personalize your drafts.",
      points: [
        {
          label: "Add your name and headline.",
          subpoints: ["Your headline should be a short, punchy summary of your professional identity (e.g., 'Senior Product Designer')."]
        }
      ]
    };
  }

  if (ui.wizardStep === 1) {
    return {
      badge: "Step 2",
      title: "Add your experience",
      body: "Share the work you want to highlight.",
      points: [
        {
          label: "Upload your current resume if you have one.",
          subpoints: ["We can pull in experience, skills, and other basics for you."]
        },
        {
          label: "Add one role at a time.",
          subpoints: ["Include company name, title, and dates worked."]
        },
        {
          label: "Keep highlights short and clear.",
          subpoints: ["Highlights are your major achievements and wins for each role—keep them impact-focused."]
        },
        {
          label: "Include the tools you used.",
          subpoints: ["Mention the specific technologies and tools that were central to that position."]
        }
      ]
    };
  }

  return {
    badge: "Step 3",
    title: "Set your target",
    body: "Add the role you want and any extra context that can help.",
    points: [
      {
        label: "Paste the job description.",
        subpoints: ["Providing the full description helps the AI align your materials with the specific requirements."]
      },
      {
        label: "Add notes if they matter.",
        subpoints: ["Notes allow you to mention hidden context or specific things you want the AI to emphasize."]
      },
      {
        label: "Sync GitHub or upload a resume.",
        subpoints: ["Optional. Syncrepos or uploading a PDF provides extra grounded context for generation."]
      }
    ]
  };
});
</script>
<template>
  <section class="-mx-4 -my-6 min-h-screen sm:-mx-6 lg:-mx-8">
    <div class="hero-panel relative min-h-screen overflow-hidden px-6 py-8 sm:px-8 lg:px-10">
      <div class="ambient-grid" />
      <div class="ambient-orb ambient-orb-a" />
      <div class="ambient-orb ambient-orb-b" />
      <div class="relative z-10 flex min-h-[calc(100vh-4rem)] items-stretch">
        <Card class="flex w-full border-white/60 bg-[#cbdceb]/60 backdrop-blur-md overflow-hidden">
          <div class="grid min-h-full w-full lg:grid-cols-[0.88fr_1.12fr]">
            <!-- Left Panel -->
            <div class="wizard-left flex flex-col justify-between border-b border-white/50 p-6 lg:border-b-0 lg:border-r">
              <div class="space-y-6">
                <div class="space-y-3">
                  <Badge variant="secondary" class="premium-badge">{{ wizardCopy.badge }}</Badge>
                  <h1 class="text-4xl font-semibold tracking-[-0.05em] sm:text-[2.8rem]">{{ wizardCopy.title }}</h1>
                  <p class="max-w-md text-base leading-7 text-muted-foreground">{{ wizardCopy.body }}</p>
                </div>

                <div v-if="auth.user" class="flex items-center gap-3 rounded-[24px] border border-white/60 bg-white/70 px-4 py-3 w-fit">
                  <img v-if="auth.user.avatarUrl" :src="auth.user.avatarUrl" alt="" class="size-10 rounded-full border border-border/70 object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate">{{ auth.user.name || auth.user.email }}</p>
                  </div>
                  <Button variant="outline" @click="logout" class="h-10 rounded-xl bg-white/85 flex-shrink-0 ml-4 hover:bg-red-500/20 hover:text-red-500">
                    Sign out
                  </Button>
                </div>

                <div class="rounded-[28px] border border-white/55 bg-white/62 p-6 space-y-5">
                  <div v-for="point in wizardCopy.points" :key="point.label" class="space-y-1.5">
                    <div class="flex items-start gap-3 text-sm font-medium text-foreground">
                      <div class="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      {{ point.label }}
                    </div>
                    <ul class="ml-7 space-y-1">
                      <li v-for="sub in point.subpoints" :key="sub" class="text-[13px] leading-relaxed text-muted-foreground/90">
                        • {{ sub }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="mt-8">
                <Stepper :steps="wizardSteps" :current-step="ui.wizardStep" @select="ui.wizardStep = $event" />
              </div>
            </div>

            <!-- Right Panel -->
            <div class="flex flex-col h-full overflow-hidden">
              <div class="flex-grow overflow-y-auto p-6 scrollbar-thin">
                <div class="mb-6">
                  <h2 class="text-2xl font-semibold tracking-[-0.03em] text-foreground">Fill in this step</h2>
                  <p class="mt-2 text-sm leading-6 text-muted-foreground">Fields marked with <span class="text-red-500">*</span> are mandatory.</p>
                </div>

                <!-- Step 0: Identity -->
                <div v-if="ui.wizardStep === 0" class="wizard-screen grid gap-6 lg:grid-cols-2">
                  <div class="field-group">
                    <Label>Full name <span class="text-red-500">*</span></Label>
                    <Input v-model="state.profile.fullName" placeholder="Full name" />
                  </div>
                  <div class="field-group">
                    <Label>Headline <span class="text-red-500">*</span></Label>
                    <div class="grid gap-3">
                      <label class="flex h-11 items-center rounded-2xl border border-border bg-white/80 px-4 text-sm text-muted-foreground">
                        <select v-model="headlineSelection" class="w-full bg-transparent text-foreground outline-none">
                          <option value="" disabled>Select a headline</option>
                          <option v-for="option in headlineOptions" :key="option" :value="option">{{ option }}</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <div v-if="isCustomHeadline" class="flex gap-2">
                        <Input v-model="state.profile.headline" placeholder="Type your headline" />
                        <Button variant="outline" :disabled="ui.generatingHeadline" @click="generateHeadline">
                          <Spinner v-if="ui.generatingHeadline" class="mr-2" />
                          Suggest
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div class="field-group lg:col-span-2">
                    <Label>Email <span class="text-red-500">*</span></Label>
                    <InputGroup>
                      <InputGroupAddon>@</InputGroupAddon>
                      <InputGroupInput v-model="state.profile.email" type="email" placeholder="name@example.com" />
                    </InputGroup>
                  </div>
                  <div class="field-group lg:col-span-2">
                    <Label>Phone number</Label>
                    <Input v-model="state.profile.phoneNumber" type="tel" placeholder="(555) 123-4567" />
                  </div>
                  <div class="field-group lg:col-span-2">
                    <Label>Address</Label>
                    <div class="grid gap-3 md:grid-cols-2">
                      <label class="md:col-span-2 flex h-11 items-center rounded-2xl border border-border bg-white/80 px-4 text-sm text-muted-foreground">
                        <select v-model="state.profile.address.country" class="w-full bg-transparent text-foreground outline-none">
                          <option value="" disabled>Select country</option>
                          <option v-for="country in countryOptions" :key="country" :value="country">{{ country }}</option>
                        </select>
                      </label>
                      <Input v-model="state.profile.address.street1" placeholder="Street address" />
                      <Input v-model="state.profile.address.street2" placeholder="Suite / Unit" />
                      <Input v-model="state.profile.address.city" placeholder="City" />
                      <div class="grid grid-cols-2 gap-3">
                        <Input v-model="state.profile.address.state" placeholder="State" />
                        <Input v-model="state.profile.address.zipCode" placeholder="ZIP" />
                      </div>
                    </div>
                  </div>
                  <div class="field-group lg:col-span-2">
                    <div class="mb-2 flex items-center justify-between gap-3">
                      <Label>Professional Summary</Label>
                      <Button variant="outline" size="sm" :disabled="ui.generatingSummary" @click="generateSummary">
                        <Spinner v-if="ui.generatingSummary" class="mr-2" />
                        Generate
                      </Button>
                    </div>
                    <Textarea
                      v-model="state.profile.summary"
                      :rows="5"
                      placeholder="Add a short summary, or let Aquario draft one from your experience."
                    />
                  </div>
                </div>

                <!-- Step 1: Experience -->
                <div v-else-if="ui.wizardStep === 1" class="wizard-screen space-y-6">
                  <div class="rounded-[24px] border border-border/70 bg-white/74 p-5">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <p class="text-sm font-semibold text-foreground">Import from your resume</p>
                        <p class="mt-1 text-sm leading-6 text-muted-foreground">
                          Upload your existing resume and we will try to fill in your experience, skills, and summary.
                        </p>
                      </div>
                      <Badge variant="outline">{{ state.resumeAsset ? "Resume ready" : "Optional" }}</Badge>
                    </div>

                    <div class="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        class="bg-white"
                        @change="selectedResumeFile = (($event.target as HTMLInputElement).files?.[0] ?? null)"
                      />
                      <Button variant="outline" :disabled="ui.uploadingResume" @click="uploadResume">
                        <Spinner v-if="ui.uploadingResume" class="mr-2" />
                        Upload Only
                      </Button>
                      <Button :disabled="ui.importingResume" @click="importResume">
                        <Spinner v-if="ui.importingResume" class="mr-2" />
                        Upload and Import
                      </Button>
                    </div>

                    <p v-if="state.resumeAsset" class="mt-3 text-sm text-muted-foreground">
                      {{ state.resumeAsset.fileName }} uploaded {{ new Date(state.resumeAsset.uploadedAt).toLocaleString() }}
                    </p>
                  </div>

                  <div v-for="(item, index) in state.profile.experience" :key="item.id" class="rounded-[24px] border border-border/60 bg-white/60 p-5 shadow-sm">
                    <div class="mb-4 flex items-center justify-between">
                      <p class="text-sm font-semibold text-foreground">Role {{ index + 1 }}</p>
                      <Button variant="ghost" size="sm" class="h-8 text-muted-foreground hover:text-red-500" @click="removeExperience(index)">Remove</Button>
                    </div>
                    <div class="grid gap-4 lg:grid-cols-2">
                      <div class="field-group">
                        <Label>Company <span class="text-red-500">*</span></Label>
                        <Input v-model="item.company" placeholder="Company name" />
                      </div>
                      <div class="field-group">
                        <Label>Title <span class="text-red-500">*</span></Label>
                        <Input v-model="item.title" placeholder="Job title" />
                      </div>
                      <div class="field-group">
                        <Label>Start Date</Label>
                        <CalendarInput v-model="item.startDate" />
                      </div>
                      <div class="field-group">
                        <Label>End Date</Label>
                        <CalendarInput v-model="item.endDate" />
                      </div>
                      <div class="field-group lg:col-span-2">
                        <Label>Highlights</Label>
                        <Textarea :model-value="item.highlights.join('\n')" :rows="4" placeholder="Impact points..." @update:model-value="item.highlights = $event.split('\n').filter(Boolean)" />
                      </div>
                      <div class="field-group lg:col-span-2">
                        <Label>Technologies Used</Label>
                        <TagRepositoryField
                          v-model="item.technologies"
                          :options="technologyOptions"
                          placeholder="Add another technology"
                          add-label="Add Tech"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <Button variant="outline" class="w-full border-dashed" @click="addExperience">
                      + Add Experience Entry
                    </Button>
                    <Button
                      variant="ghost"
                      class="w-full text-muted-foreground hover:text-red-500"
                      :disabled="state.profile.experience.length === 0"
                      @click="clearAllExperiences"
                    >
                      Remove All Experiences
                    </Button>
                  </div>

                  <div class="rounded-[24px] border border-border/70 bg-white/74 p-5">
                    <div class="mb-4 flex items-center justify-between">
                      <div>
                        <p class="text-sm font-semibold text-foreground">Education</p>
                        <p class="text-sm text-muted-foreground">Add schools, degrees, or training.</p>
                      </div>
                      <Button variant="outline" size="sm" @click="addEducation">+ Add Education</Button>
                    </div>

                    <div v-if="state.profile.education.length" class="space-y-4">
                      <div
                        v-for="(edu, index) in state.profile.education"
                        :key="edu.id"
                        class="rounded-[20px] border border-border/60 bg-white/70 p-4"
                      >
                        <div class="mb-3 flex items-center justify-between">
                          <p class="text-sm font-medium text-foreground">Education {{ index + 1 }}</p>
                          <Button variant="ghost" size="sm" class="h-8 text-muted-foreground hover:text-red-500" @click="removeEducation(index)">
                            Remove
                          </Button>
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                          <UniversityInput
                            v-model="edu.school"
                            :country="edu.hasDifferentCountry ? edu.country : state.profile.address.country"
                            placeholder="Search for a university"
                          />
                          <label class="flex h-11 items-center rounded-lg border border-border bg-white/80 px-4 text-sm text-muted-foreground">
                            <select v-model="edu.degree" class="w-full bg-transparent text-foreground outline-none">
                              <option value="" disabled>Select a degree</option>
                              <option v-for="level in educationLevels" :key="level" :value="level">{{ level }}</option>
                            </select>
                          </label>
                          <Input v-model="edu.fieldOfStudy" placeholder="Field of study" />
                          <div class="md:col-span-2">
                            <div class="flex items-center gap-3 rounded-[18px] border border-border/60 bg-white/70 px-4 py-3">
                              <Checkbox
                                :checked="edu.hasDifferentCountry"
                                @update:checked="
                                  (value) => {
                                    edu.hasDifferentCountry = Boolean(value);
                                    if (!edu.hasDifferentCountry) {
                                      edu.country = '';
                                    }
                                  }
                                "
                              />
                              <Label>I studied in a different country</Label>
                            </div>
                          </div>
                          <div v-if="edu.hasDifferentCountry" class="md:col-span-2">
                            <label class="flex h-11 items-center rounded-lg border border-border bg-white/80 px-4 text-sm text-muted-foreground">
                              <select v-model="edu.country" class="w-full bg-transparent text-foreground outline-none">
                                <option value="" disabled>Select country</option>
                                <option v-for="country in countryOptions" :key="country" :value="country">{{ country }}</option>
                              </select>
                            </label>
                          </div>
                          <div class="grid grid-cols-2 gap-3">
                            <CalendarInput v-model="edu.startDate" />
                            <CalendarInput v-model="edu.endDate" />
                          </div>
                          <div class="md:col-span-2">
                            <Textarea v-model="edu.description" :rows="3" placeholder="Anything helpful to mention" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-[24px] border border-border/70 bg-white/74 p-5">
                    <div class="mb-4 flex items-center justify-between">
                      <div>
                        <p class="text-sm font-semibold text-foreground">Certifications</p>
                        <p class="text-sm text-muted-foreground">Include certificates, licenses, or credentials.</p>
                      </div>
                      <Button variant="outline" size="sm" @click="addCertification">+ Add Certification</Button>
                    </div>

                    <div v-if="state.profile.certifications.length" class="space-y-4">
                      <div
                        v-for="(cert, index) in state.profile.certifications"
                        :key="cert.id"
                        class="rounded-[20px] border border-border/60 bg-white/70 p-4"
                      >
                        <div class="mb-3 flex items-center justify-between">
                          <p class="text-sm font-medium text-foreground">Certification {{ index + 1 }}</p>
                          <Button variant="ghost" size="sm" class="h-8 text-muted-foreground hover:text-red-500" @click="removeCertification(index)">
                            Remove
                          </Button>
                        </div>
                        <div class="grid gap-4 md:grid-cols-2">
                          <Input v-model="cert.name" placeholder="Certification name" />
                          <Input v-model="cert.issuer" placeholder="Issuer" />
                          <Input v-model="cert.credentialId" placeholder="Credential ID" />
                          <Input v-model="cert.url" placeholder="Credential URL" />
                          <div class="grid grid-cols-2 gap-3 md:col-span-2">
                            <CalendarInput v-model="cert.issuedDate" />
                            <CalendarInput v-model="cert.expirationDate" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-[24px] border border-border/70 bg-white/74 p-5">
                    <div class="mb-4">
                      <p class="text-sm font-semibold text-foreground">Skills</p>
                      <p class="text-sm text-muted-foreground">Pick the skills that best describe you, then add your own if needed.</p>
                    </div>
                    <TagRepositoryField
                      v-model="state.profile.skills"
                      :options="skillOptions"
                      placeholder="Add another skill"
                      add-label="Add Skill"
                    />
                  </div>

                  <div v-if="state.profile.customSections.length" class="rounded-[24px] border border-border/70 bg-white/74 p-5">
                    <div class="mb-4 flex items-center justify-between">
                      <div>
                        <p class="text-sm font-semibold text-foreground">Extra Sections</p>
                        <p class="text-sm text-muted-foreground">Add projects, awards, activities, or anything else.</p>
                      </div>
                    </div>

                    <div v-if="state.profile.customSections.length" class="space-y-4">
                      <div
                        v-for="(section, index) in state.profile.customSections"
                        :key="section.id"
                        class="rounded-[20px] border border-border/60 bg-white/70 p-4"
                      >
                        <div class="mb-3 flex items-center justify-between">
                          <p class="text-sm font-medium text-foreground">Section {{ index + 1 }}</p>
                          <Button variant="ghost" size="sm" class="h-8 text-muted-foreground hover:text-red-500" @click="removeCustomSection(index)">
                            Remove
                          </Button>
                        </div>
                        <div class="space-y-3">
                          <Input v-model="section.title" placeholder="Section title" />
                          <Textarea
                            :model-value="section.items.join('\n')"
                            :rows="4"
                            placeholder="One item per line"
                            @update:model-value="section.items = $event.split('\n').map((item) => item.trim()).filter(Boolean)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="flex justify-start">
                    <Button variant="outline" size="sm" @click="addCustomSection">Add Section</Button>
                  </div>
                </div>

                <!-- Step 2: Target Role -->
                <div v-else class="wizard-screen space-y-6">
                  <div class="grid gap-6 lg:grid-cols-2">
                    <div class="field-group">
                      <Label>Target Company <span class="text-red-500">*</span></Label>
                      <Input v-model="state.job.companyName" placeholder="North Star Systems" />
                    </div>
                    <div class="field-group">
                      <Label>Target Role <span class="text-red-500">*</span></Label>
                      <Input v-model="state.job.roleTitle" placeholder="Staff Product Engineer" />
                    </div>
                    <div class="field-group lg:col-span-2">
                      <Label>Job Description <span class="text-red-500">*</span></Label>
                      <Textarea v-model="state.job.jobDescription" :rows="8" placeholder="Paste the text here..." />
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2 mt-4">
                    <div class="rounded-[24px] border border-border/80 bg-white/70 p-5">
                      <div class="flex items-center justify-between mb-4">
                        <Label class="text-sm font-semibold">GitHub Context</Label>
                        <Badge variant="outline">{{ state.repos.length }} repos</Badge>
                      </div>
                      <div class="flex gap-2">
                        <Input v-model="state.profile.githubUsername" placeholder="username" />
                        <Button variant="outline" size="sm" :disabled="ui.syncingGithub" @click="syncGithub">
                          {{ ui.syncingGithub ? 'Syncing...' : 'Sync' }}
                        </Button>
                      </div>
                    </div>
                    <div class="rounded-[24px] border border-border/80 bg-white/70 p-5">
                      <Label class="text-sm font-semibold block mb-4">Original Resume</Label>
                      <div class="space-y-3">
                        <Input type="file" size="sm" class="h-9 text-xs" @change="selectedResumeFile = (($event.target as HTMLInputElement).files?.[0] ?? null)" />
                        <Button variant="outline" size="sm" class="w-full" :disabled="ui.uploadingResume" @click="uploadResume">
                          {{ ui.uploadingResume ? 'Uploading...' : 'Upload' }}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Controls -->
              <div class="p-6 border-t border-white/40 bg-white/20 backdrop-blur-sm">
                <div class="flex items-center justify-between">
                  <Button variant="ghost" :disabled="ui.wizardStep === 0" @click="ui.wizardStep--">
                    Back
                  </Button>
                  <div class="flex gap-3">
                    <Button v-if="ui.wizardStep < 2" :disabled="!canProceed" @click="ui.wizardStep++">
                      Next Step
                    </Button>
                    <Button v-else :disabled="!canProceed || ui.savingProfile" @click="completeWizardAndContinue">
                      <Spinner v-if="ui.savingProfile" class="mr-2" />
                      Complete Setup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>
</template>
