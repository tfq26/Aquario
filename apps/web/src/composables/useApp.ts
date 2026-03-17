import { computed, reactive, ref } from "vue";
import type { AppState, AuthUser, GeneratedDocument, RepoContext, ResumeAsset } from "@/types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function withApiBase(path: string) {
  if (!apiBaseUrl) {
    return path;
  }

  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

const headlineOptions = [
  "University Student",
  "High School Student",
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Product Engineer",
  "Staff Engineer",
  "Engineering Manager",
  "Product Manager",
  "Technical Program Manager",
  "UX Designer",
  "Product Designer",
  "Data Analyst",
  "Data Scientist",
  "DevOps Engineer"
] as const;

const state = reactive<AppState>({
  profile: {
    fullName: "",
    headline: "",
    phoneNumber: "",
    summary: "",
    email: "",
    address: {
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    skills: [],
    experience: [],
    education: [],
    certifications: [],
    projects: [],
    customSections: [],
    links: [],
    githubUsername: "",
    githubUrl: "",
    notes: ""
  },
  job: {
    companyName: "",
    roleTitle: "",
    jobDescription: "",
    hiringManagerNotes: ""
  },
  repos: [],
  resumeAsset: null,
  generated: []
});

const auth = reactive({
  email: "",
  password: "",
  remember: true,
  authenticated: false,
  configured: true,
  providers: {
    password: false,
    github: false,
    google: false
  },
  user: null as AuthUser | null,
  loading: true,
  submitting: false,
  error: ""
});

const ui = reactive({
  bootstrapping: true,
  currentPage: "dashboard" as "dashboard" | "profile",
  wizardStep: 0,
  onboardingActive: false,
  savingProfile: false,
  savingJob: false,
  syncingGithub: false,
  uploadingResume: false,
  importingResume: false,
  generatingHeadline: false,
  generatingSummary: false,
  generatingDocument: false,
  notice: "",
  error: "",
  isDark: false
});

const controls = reactive({
  search: "",
  filter: "all" as "all" | GeneratedDocument["kind"]
});

const generation = reactive({
  kind: "tailored-resume" as GeneratedDocument["kind"],
  userRequest: "",
  includeGithub: true,
  includeResume: true
});

const selectedResumeFile = ref<File | null>(null);
const headlineSelection = computed({
  get() {
    if (!state.profile.headline.trim()) {
      return "";
    }

    return headlineOptions.includes(state.profile.headline as (typeof headlineOptions)[number]) ? state.profile.headline : "Other";
  },
  set(value: string) {
    if (!value || value === "Other") {
      state.profile.headline = "";
      return;
    }

    state.profile.headline = value;
  }
});
const isCustomHeadline = computed(() => headlineSelection.value === "Other");

export function useApp() {
  function createId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function applyState(next: AppState) {
    state.profile = structuredClone(next.profile);
    // Ensure education exists even if coming from old state
    if (!state.profile.education) {
      state.profile.education = [];
    }
    if (!state.profile.certifications) {
      state.profile.certifications = [];
    }
    if (!state.profile.projects) {
      state.profile.projects = [];
    }
    if (!state.profile.customSections) {
      state.profile.customSections = [];
    }
    state.profile.education = state.profile.education.map((item) => ({
      ...item,
      hasDifferentCountry: item.hasDifferentCountry ?? false,
      country: item.country ?? ""
    }));
    state.job = structuredClone(next.job);
    state.repos = structuredClone(next.repos);
    state.resumeAsset = next.resumeAsset ? structuredClone(next.resumeAsset) : null;
    state.generated = structuredClone(next.generated);
  }

  async function api<T>(path: string, init?: RequestInit) {
    const response = await fetch(withApiBase(path), {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Request failed");
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  }

  async function loadSession() {
    const session = await api<{
      authenticated: boolean;
      configured: boolean;
      providers: {
        password: boolean;
        github: boolean;
        google: boolean;
      };
      user: AuthUser | null;
    }>("/api/auth/session");

    auth.authenticated = session.authenticated;
    auth.configured = session.configured;
    auth.providers = session.providers;
    auth.user = session.user;
  }

  async function loadState() {
    applyState(await api<AppState>("/api/state"));
  }

  async function bootstrap() {
    ui.bootstrapping = true;
    auth.loading = true;
    ui.error = "";

    try {
      await loadSession();

      if (auth.authenticated) {
        await loadState();
        ui.onboardingActive =
          !state.profile.fullName.trim() && !state.profile.summary.trim() && state.profile.experience.length === 0;
      }
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Failed to load the application.";
    } finally {
      auth.loading = false;
      ui.bootstrapping = false;
    }
  }

  async function login() {
    auth.submitting = true;
    auth.error = "";

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: auth.email,
          password: auth.password,
          remember: auth.remember
        })
      });
      auth.password = "";
      await loadSession();
      await loadState();
    } catch (error) {
      auth.error = error instanceof Error ? error.message : "Unable to sign in.";
    } finally {
      auth.submitting = false;
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    auth.authenticated = false;
    auth.user = null;
    ui.currentPage = "dashboard";
    ui.wizardStep = 0;
    ui.onboardingActive = false;
  }

  function beginOAuth(provider: "github" | "google") {
    window.location.href = withApiBase(`/api/auth/${provider}/login`);
  }

  async function saveProfile() {
    ui.savingProfile = true;
    ui.notice = "";
    ui.error = "";

    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify(state.profile)
      });
      ui.notice = "Profile saved.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to save profile.";
    } finally {
      ui.savingProfile = false;
    }
  }

  async function saveJob() {
    ui.savingJob = true;
    ui.notice = "";
    ui.error = "";

    try {
      await api("/api/job", {
        method: "PUT",
        body: JSON.stringify(state.job)
      });
      ui.notice = "Role details saved.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to save role details.";
    } finally {
      ui.savingJob = false;
    }
  }

  async function syncGithub() {
    if (!state.profile.githubUsername.trim()) {
      ui.error = "Add a GitHub username first.";
      return;
    }

    ui.syncingGithub = true;
    ui.error = "";

    try {
      const payload = await api<{ repos: RepoContext[]; projects: AppState["profile"]["projects"] }>("/api/github/sync", {
        method: "POST",
        body: JSON.stringify({ username: state.profile.githubUsername.trim() })
      });
      state.repos = payload.repos;
      state.profile.projects = payload.projects;
      state.profile.githubUrl = `https://github.com/${state.profile.githubUsername.trim()}`;
      ui.notice = "GitHub projects synced.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to sync GitHub.";
    } finally {
      ui.syncingGithub = false;
    }
  }

  async function uploadResume() {
    if (!selectedResumeFile.value) {
      ui.error = "Choose a resume file first.";
      return;
    }

    ui.uploadingResume = true;

    try {
      const formData = new FormData();
      formData.set("resume", selectedResumeFile.value);

      const response = await fetch(withApiBase("/api/resume/upload"), {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Upload failed");
      }

      state.resumeAsset = (await response.json()) as ResumeAsset;
      ui.notice = "Resume uploaded.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to upload resume.";
    } finally {
      ui.uploadingResume = false;
    }
  }

  async function importResume() {
    if (!selectedResumeFile.value) {
      ui.error = "Choose a resume file first.";
      return;
    }

    ui.importingResume = true;
    ui.error = "";

    try {
      const formData = new FormData();
      formData.set("resume", selectedResumeFile.value);

      const response = await fetch(withApiBase("/api/resume/import"), {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Resume import failed");
      }

      const payload = (await response.json()) as {
        resumeAsset: ResumeAsset;
        profile: AppState["profile"];
      };

      state.resumeAsset = payload.resumeAsset;
      state.profile = structuredClone(payload.profile);
      ui.notice = "Resume imported. We filled in what we could.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to import resume.";
    } finally {
      ui.importingResume = false;
    }
  }

  async function generateHeadline() {
    ui.generatingHeadline = true;

    try {
      const result = await api<{ headline: string }>("/api/profile/generate-headline", {
        method: "POST",
        body: JSON.stringify({})
      });
      state.profile.headline = result.headline;
      ui.notice = "Headline refreshed.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to generate headline.";
    } finally {
      ui.generatingHeadline = false;
    }
  }

  async function generateSummary() {
    ui.generatingSummary = true;

    try {
      const result = await api<{ summary: string }>("/api/profile/generate-summary", {
        method: "POST",
        body: JSON.stringify({})
      });
      state.profile.summary = result.summary;
      ui.notice = "Summary refreshed.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to generate summary.";
    } finally {
      ui.generatingSummary = false;
    }
  }

  async function generateDocument() {
    ui.generatingDocument = true;

    try {
      const suffix = [
        generation.includeGithub ? "use GitHub context when helpful" : "ignore GitHub context",
        generation.includeResume ? "use the uploaded resume as reference" : "ignore the uploaded resume"
      ].join("; ");

      const generated = await api<GeneratedDocument>("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          kind: generation.kind,
          userRequest: generation.userRequest ? `${generation.userRequest}\n\n${suffix}` : suffix
        })
      });

      state.generated.unshift(generated);
      ui.notice = "Draft generated.";
    } catch (error) {
      ui.error = error instanceof Error ? error.message : "Unable to generate draft.";
    } finally {
      ui.generatingDocument = false;
    }
  }

  function addExperience() {
    state.profile.experience.push({
      id: createId("exp"),
      company: "",
      title: "",
      startDate: "",
      endDate: "",
      highlights: [""],
      technologies: []
    });
  }

  function removeExperience(index: number) {
    state.profile.experience.splice(index, 1);
  }

  function clearAllExperiences() {
    state.profile.experience = [];
    ui.notice = "All experience entries removed.";
  }

  function addEducation() {
    state.profile.education.push({
      id: createId("edu"),
      school: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      description: "",
      hasDifferentCountry: false,
      country: ""
    });
  }

  function removeEducation(index: number) {
    state.profile.education.splice(index, 1);
  }

  function addCertification() {
    state.profile.certifications.push({
      id: createId("cert"),
      name: "",
      issuer: "",
      issuedDate: "",
      expirationDate: "",
      credentialId: "",
      url: ""
    });
  }

  function removeCertification(index: number) {
    state.profile.certifications.splice(index, 1);
  }

  function addCustomSection() {
    state.profile.customSections.push({
      id: createId("section"),
      title: "",
      items: [""]
    });
  }

  function removeCustomSection(index: number) {
    state.profile.customSections.splice(index, 1);
  }

  async function completeWizardAndContinue() {
    await saveProfile();
    await saveJob();
    ui.onboardingActive = false;
    ui.currentPage = "dashboard";
  }

  function enterProfilePage() {
    ui.currentPage = "profile";
  }

  function startGenerateFlow() {
    controls.filter = "all";
    generation.userRequest = "";
  }

  function toggleDarkMode() {
    ui.isDark = !ui.isDark;
    if (ui.isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  return {
    state,
    auth,
    ui,
    controls,
    generation,
    selectedResumeFile,
    headlineOptions,
    headlineSelection,
    isCustomHeadline,
    bootstrap,
    login,
    logout,
    beginOAuth,
    saveProfile,
    saveJob,
    syncGithub,
    uploadResume,
    importResume,
    generateHeadline,
    generateSummary,
    generateDocument,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addCertification,
    removeCertification,
    addCustomSection,
    removeCustomSection,
    clearAllExperiences,
    completeWizardAndContinue,
    enterProfilePage,
    startGenerateFlow,
    toggleDarkMode
  };
}
