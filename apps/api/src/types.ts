export type Experience = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  highlights: string[];
  technologies: string[];
};

export type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type RepoContext = {
  id: number;
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  topics: string[];
  language: string | null;
  readmeExcerpt?: string;
};

export type ResumeAsset = {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  extractedText: string;
  storageKey: string;
};

export type Profile = {
  fullName: string;
  headline: string;
  summary: string;
  email: string;
  address: string;
  skills: string[];
  experience: Experience[];
  links: LinkItem[];
  githubUsername: string;
  githubUrl: string;
  notes: string;
};

export type JobApplication = {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  hiringManagerNotes: string;
};

export type GeneratedDocument = {
  kind: "tailored-resume" | "cv" | "cover-letter" | "interview-answers";
  content: string;
  createdAt: string;
};

export type AppData = {
  profile: Profile;
  job: JobApplication;
  repos: RepoContext[];
  resumeAsset: ResumeAsset | null;
  generated: GeneratedDocument[];
};
