export type Experience = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  highlights: string[];
  technologies: string[];
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
  hasDifferentCountry: boolean;
  country: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  issuedDate: string;
  expirationDate: string;
  credentialId: string;
  url: string;
};

export type CustomSection = {
  id: string;
  title: string;
  items: string[];
};

export type Project = {
  id: string;
  title: string;
  category: string;
  summary: string;
  technologies: string[];
  startedAt: string;
  lastActiveAt: string;
  developmentDuration: string;
  repoUrl: string;
  homepageUrl: string;
  highlights: string[];
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
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  languages: string[];
  category: string;
  readmeExcerpt?: string;
};

export type ResumeAsset = {
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  extractedText: string;
  storageKey: string;
};

export type Address = {
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

export type Profile = {
  fullName: string;
  headline: string;
  phoneNumber: string;
  summary: string;
  email: string;
  address: Address;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
  customSections: CustomSection[];
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
