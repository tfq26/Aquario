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
  language: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  languages: string[];
  category: string;
};

export type ResumeAsset = {
  fileName: string;
  uploadedAt: string;
  extractedText: string;
};

export type GeneratedDocument = {
  kind: "tailored-resume" | "cv" | "cover-letter" | "interview-answers";
  content: string;
  createdAt: string;
};

export type AppState = {
  profile: {
    fullName: string;
    headline: string;
    phoneNumber: string;
    summary: string;
    email: string;
    address: {
      street1: string;
      street2: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
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
  job: {
    companyName: string;
    roleTitle: string;
    jobDescription: string;
    hiringManagerNotes: string;
  };
  repos: RepoContext[];
  resumeAsset: ResumeAsset | null;
  generated: GeneratedDocument[];
};

export type AuthUser = {
  provider: "password" | "github" | "google";
  email: string;
  name: string;
  avatarUrl: string;
};
