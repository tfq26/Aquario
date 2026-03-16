<script setup lang="ts">
import { ref } from "vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CalendarInput } from "@/components/ui/calendar";
import TagRepositoryField from "@/components/app/TagRepositoryField.vue";
import UniversityInput from "@/components/app/UniversityInput.vue";
import { Github } from "lucide-vue-next";
import { useApp } from "@/composables/useApp";
import { skillOptions, technologyOptions } from "@/lib/catalog";
import { countryOptions } from "@/lib/countries";

const { 
  state, ui, 
  saveProfile, syncGithub, uploadResume, generateHeadline, generateSummary,
  headlineOptions, headlineSelection, isCustomHeadline,
  selectedResumeFile, addEducation, removeEducation, addCertification, removeCertification,
  addCustomSection, removeCustomSection, addExperience, removeExperience
} = useApp();

const editingProjectId = ref<string | null>(null);

function toggleProjectEditor(projectId: string) {
  editingProjectId.value = editingProjectId.value === projectId ? null : projectId;
}

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
</script>

<template>
  <div class="space-y-8 pb-20">
    <!-- Profile Details Card -->
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="text-[#133e87]">Profile details</CardTitle>
        <CardDescription class="text-[#608bc1]">Edit the basic information used in your documents.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid gap-6 md:grid-cols-2">
          <div class="field-group">
            <Label class="text-[#133e87]">Full name</Label>
            <Input v-model="state.profile.fullName" placeholder="Ariana Candidate" class="bg-white/90" />
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Headline</Label>
            <div class="grid gap-3">
              <label class="flex h-11 items-center rounded-2xl border border-border bg-white/90 px-4 text-sm">
                <select v-model="headlineSelection" class="w-full bg-transparent text-[#133e87] outline-none">
                  <option value="" disabled>Select a headline</option>
                  <option v-for="option in headlineOptions" :key="option" :value="option">{{ option }}</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <div v-if="isCustomHeadline" class="flex gap-3">
                <Input v-model="state.profile.headline" placeholder="Type your headline" class="bg-white/90" />
                <Button variant="outline" :disabled="ui.generatingHeadline" class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10" @click="generateHeadline">
                  <Spinner v-if="ui.generatingHeadline" class="mr-2" />
                  Suggest
                </Button>
              </div>
            </div>
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Email</Label>
            <InputGroup>
              <InputGroupAddon class="bg-[#133e87] text-white">@</InputGroupAddon>
              <InputGroupInput v-model="state.profile.email" type="email" placeholder="name@example.com" class="bg-white/90" />
            </InputGroup>
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Phone number</Label>
            <Input v-model="state.profile.phoneNumber" type="tel" placeholder="(555) 123-4567" class="bg-white/90" />
          </div>
        </div>

        <div class="field-group">
          <div class="mb-2 flex items-center justify-between gap-3">
            <Label class="text-[#133e87]">Professional Summary</Label>
            <Button
              variant="outline"
              size="sm"
              :disabled="ui.generatingSummary"
              class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10"
              @click="generateSummary"
            >
              <Spinner v-if="ui.generatingSummary" class="mr-2" />
              Generate
            </Button>
          </div>
          <Textarea
            v-model="state.profile.summary"
            :rows="5"
            placeholder="Write a concise professional summary, or generate one from your experience."
            class="bg-white/90"
          />
        </div>

        <div class="field-group">
          <Label class="text-[#133e87]">Address</Label>
          <div class="grid gap-4 md:grid-cols-2 rounded-[24px] border border-white/50 bg-white/60 p-5 shadow-sm">
            <label class="md:col-span-2 flex h-11 items-center rounded-2xl border border-border bg-white/90 px-4 text-sm">
              <select v-model="state.profile.address.country" class="w-full bg-transparent text-[#133e87] outline-none">
                <option value="" disabled>Select country</option>
                <option v-for="country in countryOptions" :key="country" :value="country">{{ country }}</option>
              </select>
            </label>
            <Input v-model="state.profile.address.street1" placeholder="Street address" class="bg-white/90 md:col-span-2" />
            <Input v-model="state.profile.address.street2" placeholder="Apartment, suite, unit (optional)" class="bg-white/90 md:col-span-2" />
            <Input v-model="state.profile.address.city" placeholder="City" class="bg-white/90" />
            <Input v-model="state.profile.address.state" placeholder="State" class="bg-white/90" />
            <Input v-model="state.profile.address.zipCode" class="md:col-span-2 bg-white/90" placeholder="ZIP code" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Experience Section (Kept as it is standard) -->
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-[#133e87]">Work Experience</CardTitle>
          <CardDescription class="text-[#608bc1]">Your professional journey and achievements.</CardDescription>
        </div>
        <Button size="sm" class="bg-[#133e87] text-white" @click="addExperience">+ Add</Button>
      </CardHeader>
      <CardContent class="space-y-6">
        <div v-for="(exp, index) in state.profile.experience" :key="exp.id" class="relative grid gap-4 rounded-[24px] border border-white/50 bg-white/60 p-6 shadow-sm h-fit">
          <Button variant="ghost" size="sm" class="absolute right-4 top-4 text-red-500 hover:bg-red-50" @click="removeExperience(index)">Remove</Button>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="field-group">
              <Label class="text-[#133e87]">Company</Label>
              <Input v-model="exp.company" placeholder="Acme Corp" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Title</Label>
              <Input v-model="exp.title" placeholder="Lead Engineer" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Start Date</Label>
              <CalendarInput v-model="exp.startDate" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">End Date</Label>
              <CalendarInput v-model="exp.endDate" class="bg-white/90" />
            </div>
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Achievements & Highlights</Label>
            <Textarea v-for="(hl, hlIndex) in exp.highlights" :key="hlIndex" v-model="exp.highlights[hlIndex]" :rows="1" placeholder="Describe a key accomplishment..." class="bg-white/90 h-fit" />
            <Button variant="outline" size="sm" class="w-fit" @click="exp.highlights.push('')">+ Add Bullet Point</Button>
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Technologies Used</Label>
            <TagRepositoryField
              v-model="exp.technologies"
              :options="technologyOptions"
              placeholder="Add another technology"
              add-label="Add Tech"
            />
          </div>
        </div>
        <div v-if="state.profile.experience.length === 0" class="py-10 text-center text-[#608bc1]">
          No work experience added yet.
        </div>
      </CardContent>
    </Card>

    <!-- Education Section -->
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-[#133e87]">Education</CardTitle>
          <CardDescription class="text-[#608bc1]">Degrees, programs, and academic background.</CardDescription>
        </div>
        <Button size="sm" class="bg-[#133e87] text-white" @click="addEducation">+ Add</Button>
      </CardHeader>
      <CardContent class="space-y-6">
        <div v-for="(edu, index) in state.profile.education" :key="edu.id" class="relative grid gap-4 rounded-[24px] border border-white/50 bg-white/60 p-6 shadow-sm">
          <Button variant="ghost" size="sm" class="absolute right-4 top-4 text-red-500 hover:bg-red-50" @click="removeEducation(index)">Remove</Button>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="field-group">
              <Label class="text-[#133e87]">School / Institution</Label>
              <UniversityInput
                v-model="edu.school"
                :country="edu.hasDifferentCountry ? edu.country : state.profile.address.country"
                placeholder="Search for a university"
                class="bg-white/90"
              />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Degree</Label>
              <label class="flex h-11 items-center rounded-lg border border-border bg-white/90 px-4 text-sm">
                <select v-model="edu.degree" class="w-full bg-transparent text-[#133e87] outline-none">
                  <option value="" disabled>Select a degree</option>
                  <option v-for="level in educationLevels" :key="level" :value="level">{{ level }}</option>
                </select>
              </label>
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Field of Study</Label>
              <Input v-model="edu.fieldOfStudy" placeholder="Artificial Intelligence" class="bg-white/90" />
            </div>
            <div class="field-group md:col-span-2">
              <div class="flex items-center gap-3 rounded-[18px] border border-white/50 bg-white/70 px-4 py-3">
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
                <Label class="text-[#133e87]">I studied in a different country</Label>
              </div>
            </div>
            <div v-if="edu.hasDifferentCountry" class="field-group md:col-span-2">
              <Label class="text-[#133e87]">Study Country</Label>
              <label class="flex h-11 items-center rounded-lg border border-border bg-white/90 px-4 text-sm">
                <select v-model="edu.country" class="w-full bg-transparent text-[#133e87] outline-none">
                  <option value="" disabled>Select country</option>
                  <option v-for="country in countryOptions" :key="country" :value="country">{{ country }}</option>
                </select>
              </label>
            </div>
            <div class="field-group flex gap-3">
              <div class="flex-1">
                <Label class="text-[#133e87]">Start</Label>
                <CalendarInput v-model="edu.startDate" class="bg-white/90" />
              </div>
              <div class="flex-1">
                <Label class="text-[#133e87]">End</Label>
                <CalendarInput v-model="edu.endDate" class="bg-white/90" />
              </div>
            </div>
          </div>
        </div>
        <div v-if="state.profile.education.length === 0" class="py-10 text-center text-[#608bc1]">
          No education entries added yet.
        </div>
      </CardContent>
    </Card>

    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-[#133e87]">Certifications</CardTitle>
          <CardDescription class="text-[#608bc1]">Licenses, certificates, and professional credentials.</CardDescription>
        </div>
        <Button size="sm" class="bg-[#133e87] text-white" @click="addCertification">+ Add</Button>
      </CardHeader>
      <CardContent class="space-y-6">
        <div v-for="(cert, index) in state.profile.certifications" :key="cert.id" class="relative grid gap-4 rounded-[24px] border border-white/50 bg-white/60 p-6 shadow-sm">
          <Button variant="ghost" size="sm" class="absolute right-4 top-4 text-red-500 hover:bg-red-50" @click="removeCertification(index)">Remove</Button>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="field-group">
              <Label class="text-[#133e87]">Name</Label>
              <Input v-model="cert.name" placeholder="AWS Certified Developer" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Issuer</Label>
              <Input v-model="cert.issuer" placeholder="Amazon Web Services" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Issued</Label>
              <CalendarInput v-model="cert.issuedDate" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Expires</Label>
              <CalendarInput v-model="cert.expirationDate" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Credential ID</Label>
              <Input v-model="cert.credentialId" placeholder="ABC-123" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Credential URL</Label>
              <Input v-model="cert.url" placeholder="https://..." class="bg-white/90" />
            </div>
          </div>
        </div>
        <div v-if="state.profile.certifications.length === 0" class="py-10 text-center text-[#608bc1]">
          No certifications added yet.
        </div>
      </CardContent>
    </Card>

    <Card v-if="state.profile.customSections.length > 0" class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-[#133e87]">Extra Sections</CardTitle>
          <CardDescription class="text-[#608bc1]">Projects, awards, leadership, volunteer work, or anything else.</CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <div v-for="(section, index) in state.profile.customSections" :key="section.id" class="relative grid gap-4 rounded-[24px] border border-white/50 bg-white/60 p-6 shadow-sm">
          <Button variant="ghost" size="sm" class="absolute right-4 top-4 text-red-500 hover:bg-red-50" @click="removeCustomSection(index)">Remove</Button>
          <div class="field-group">
            <Label class="text-[#133e87]">Section Title</Label>
            <Input v-model="section.title" placeholder="Projects" class="bg-white/90" />
          </div>
          <div class="field-group">
            <Label class="text-[#133e87]">Items</Label>
            <Textarea
              :model-value="section.items.join('\n')"
              :rows="5"
              placeholder="Add one item per line"
              class="bg-white/90"
              @update:model-value="section.items = $event.split('\n').map((item) => item.trim()).filter(Boolean)"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="text-[#133e87]">Synced Projects</CardTitle>
        <CardDescription class="text-[#608bc1]">Projects from your GitHub repositories.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div v-for="project in state.profile.projects" :key="project.id" class="rounded-[24px] border border-white/50 bg-white/60 p-6 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-lg font-semibold text-[#133e87]">{{ project.title }}</p>
              <p class="text-sm text-[#608bc1]">{{ project.category }} · {{ project.developmentDuration || "Duration unknown" }}</p>
            </div>
            <Badge as-child variant="outline" class="border-[#133e87] text-[#133e87] px-2">
              <a :href="project.repoUrl" target="_blank" rel="noreferrer" title="View Repository">
                <Github class="size-5" />
              </a>
            </Badge>
          </div>
          <p class="mt-4 text-sm leading-6 text-[#133e87]/85">{{ project.summary }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <Badge v-for="technology in project.technologies" :key="technology" variant="secondary" class="bg-[#133e87]/10 text-[#133e87] border-white/40">
              {{ technology }}
            </Badge>
          </div>
          <ul v-if="project.highlights.length" class="mt-4 space-y-2 text-sm text-[#608bc1]">
            <li v-for="highlight in project.highlights" :key="highlight">{{ highlight }}</li>
          </ul>
          <div class="mt-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10"
              @click="toggleProjectEditor(project.id)"
            >
              {{ editingProjectId === project.id ? "Done" : "Edit" }}
            </Button>
          </div>

          <div v-if="editingProjectId === project.id" class="mt-6 grid gap-4 border-t border-white/50 pt-6 md:grid-cols-2">
            <div class="field-group">
              <Label class="text-[#133e87]">Project Title</Label>
              <Input v-model="project.title" placeholder="Project name" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Category</Label>
              <Input v-model="project.category" placeholder="Frontend App" class="bg-white/90" />
            </div>
            <div class="field-group md:col-span-2">
              <Label class="text-[#133e87]">Summary</Label>
              <Textarea v-model="project.summary" :rows="4" placeholder="Project summary" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Technologies</Label>
              <TagRepositoryField
                v-model="project.technologies"
                :options="technologyOptions"
                placeholder="Add another technology"
                add-label="Add Tech"
              />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Highlights</Label>
              <Textarea
                :model-value="project.highlights.join('\n')"
                :rows="3"
                placeholder="One highlight per line"
                class="bg-white/90"
                @update:model-value="project.highlights = $event.split('\n').map((item) => item.trim()).filter(Boolean)"
              />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Started</Label>
              <CalendarInput v-model="project.startedAt" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Last Active</Label>
              <CalendarInput v-model="project.lastActiveAt" class="bg-white/90" />
            </div>
            <div class="field-group">
              <Label class="text-[#133e87]">Homepage URL</Label>
              <Input v-model="project.homepageUrl" placeholder="https://..." class="bg-white/90 w-full" />
            </div>
          </div>
        </div>
        <div v-if="state.profile.projects.length === 0" class="py-10 text-center text-[#608bc1]">
          No GitHub projects synced yet.
        </div>
      </CardContent>
    </Card>

    <!-- Skills Section -->
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle class="text-[#133e87]">Skills & Expertise</CardTitle>
        <CardDescription class="text-[#608bc1]">List the core technologies and soft skills you possess.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="field-group">
          <Label class="text-[#133e87]">Skills</Label>
          <TagRepositoryField
            v-model="state.profile.skills"
            :options="skillOptions"
            placeholder="Add another skill"
            add-label="Add Skill"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Context & Attachments (Consolidated from Sidebar/Secondary) -->
    <Card class="border-white/60 bg-[#cbdceb]/60 backdrop-blur-md">
       <CardHeader>
        <CardTitle class="text-[#133e87]">Supporting Context</CardTitle>
        <CardDescription class="text-[#608bc1]">Manage GitHub synchronization and resume grounding.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="field-group">
          <Label class="text-[#133e87]">GitHub Profile</Label>
          <div class="flex gap-3">
            <InputGroup class="max-w-md">
              <InputGroupAddon class="bg-[#133e87] text-white">github.com/</InputGroupAddon>
              <InputGroupInput v-model="state.profile.githubUsername" placeholder="username" class="bg-white/90" />
            </InputGroup>
            <Button variant="outline" :disabled="ui.syncingGithub" class="border-[#133e87] text-[#133e87] hover:bg-[#133e87]/10" @click="syncGithub">
              <Spinner v-if="ui.syncingGithub" class="mr-2" />
              Sync
            </Button>
          </div>
        </div>

        <div class="field-group">
          <Label class="text-[#133e87]">Resume Document</Label>
          <div class="flex flex-col gap-3 max-w-md">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              class="bg-white/90"
              @change="selectedResumeFile = (($event.target as HTMLInputElement).files?.[0] ?? null)"
            />
            <Button :disabled="ui.uploadingResume" class="bg-[#133e87] text-white hover:bg-[#133e87]/90" @click="uploadResume">
              <Spinner v-if="ui.uploadingResume" class="mr-2" />
              Upload & Process
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>

    <!-- Global Save Action -->
    <div class="flex justify-start">
      <Button
        variant="outline"
        class="border-[#133e87] text-[#133e87] w-full"
        @click="addCustomSection"
      >
        + Add Section
      </Button>
    </div>

    <div class="sticky bottom-8 flex justify-end">
      <Button 
        size="lg" 
        class="bg-[#133e87] text-white hover:bg-[#133e87]/90 px-10 py-6 rounded-full shadow-2xl transition-transform hover:scale-105"
        :disabled="ui.savingProfile"
        @click="saveProfile"
      >
        <Spinner v-if="ui.savingProfile" class="mr-2" />
        Save All Changes
      </Button>
    </div>
  </div>
</template>
