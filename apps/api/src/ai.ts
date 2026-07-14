import type { AppBindings } from "./bindings.js";
import { getConfig } from "./config.js";
import type {
  Address,
  AppData,
  Certification,
  CustomSection,
  Education,
  GeneratedDocument,
  LinkItem,
  Profile
} from "./types.js";

type GenerateInput = {
  kind: GeneratedDocument["kind"];
  userRequest?: string;
};

export type JobTargetInput = {
  companyName: string;
  roleTitle: string;
  jobDescription: string;
  hiringManagerNotes: string;
};

export type SelectionSuggestion = {
  experienceIds: string[];
  projectIds: string[];
  certificationIds: string[];
  skillNames: string[];
  reasoning: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export type ResumeProfileImport = Pick<
  Profile,
  | "fullName"
  | "headline"
  | "phoneNumber"
  | "summary"
  | "email"
  | "address"
  | "skills"
  | "experience"
  | "education"
  | "certifications"
  | "customSections"
  | "links"
  | "notes"
>;

function getGeminiConfig(bindings: AppBindings = {}) {
  const { geminiApiKey: apiKey, geminiModel: model, geminiBaseUrl: baseUrl } = getConfig(bindings);

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return { apiKey, model, baseUrl };
}

function isMissingModelError(status: number, body: string) {
  return status === 404 && body.includes("not found");
}

async function runGeminiPrompt(prompt: string, bindings: AppBindings = {}) {
  const { apiKey, model, baseUrl } = getGeminiConfig(bindings);
  const candidateModels = Array.from(new Set([model, "gemini-2.5-flash"]));
  let lastError = "";

  for (const candidateModel of candidateModels) {
    const response = await fetch(`${baseUrl}/models/${candidateModel}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      lastError = `AI request failed with ${response.status}: ${body}`;

      if (candidateModel !== "gemini-2.5-flash" && isMissingModelError(response.status, body)) {
        continue;
      }

      throw new Error(lastError);
    }

    const payload = (await response.json()) as GeminiResponse;

    return (
      payload.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? ""
    );
  }

  throw new Error(lastError || "AI request failed.");
}

function buildPrompt(data: AppData, input: GenerateInput) {
  const formattedJobDescription = formatStructuredText(data.job.jobDescription);
  const formattedHiringNotes = formatStructuredText(data.job.hiringManagerNotes);
  const formattedAddress = [
    data.profile.address.street1,
    data.profile.address.street2,
    [data.profile.address.city, data.profile.address.state].filter(Boolean).join(", "),
    data.profile.address.zipCode,
    data.profile.address.country
  ]
    .filter(Boolean)
    .join("\n");

  const experience = data.profile.experience
    .map(
      (item) =>
        `${item.title} at ${item.company} (${item.startDate} - ${item.endDate})\n` +
        `Highlights: ${item.highlights.join("; ")}\n` +
        `Tech: ${item.technologies.join(", ")}`
    )
    .join("\n\n");

  const education = data.profile.education
    .map(
      (item) =>
        `${item.degree || "Education"} at ${item.school || "Unknown school"} (${item.startDate || "Unknown"} - ${
          item.endDate || "Unknown"
        })\nField: ${item.fieldOfStudy || "Not provided"}\nDetails: ${item.description || "None"}`
    )
    .join("\n\n");

  const certifications = data.profile.certifications
    .map(
      (item) =>
        `${item.name} from ${item.issuer || "Unknown issuer"}\nIssued: ${item.issuedDate || "Unknown"}\nCredential ID: ${
          item.credentialId || "Not provided"
        }\nURL: ${item.url || "Not provided"}`
    )
    .join("\n\n");

  const projects = data.profile.projects
    .map(
      (item) =>
        `${item.title} (${item.category})\nSummary: ${item.summary}\nTechnologies: ${item.technologies.join(", ")}\nDuration: ${
          item.developmentDuration || "Unknown"
        }\nHighlights: ${item.highlights.join("; ")}\nRepo: ${item.repoUrl}`
    )
    .join("\n\n");

  const customSections = data.profile.customSections
    .map(
      (section) =>
        `${section.title || "Custom Section"}:\n${section.items.filter(Boolean).map((item) => `- ${item}`).join("\n")}`
    )
    .join("\n\n");

  const repoContext = data.repos
    .map(
      (repo) =>
        `${repo.name}: ${repo.description ?? "No description"}\n` +
        `Language: ${repo.language ?? "Unknown"}\n` +
        `Topics: ${repo.topics.join(", ")}\n` +
        `README: ${repo.readmeExcerpt ?? ""}`
    )
    .join("\n\n");

  return `
You are a hiring materials assistant. Use the candidate profile, uploaded resume, GitHub projects, and the target job description to produce a high-quality deliverable.

Deliverable type: ${input.kind}
Additional user request: ${input.userRequest ?? "None"}

Candidate profile:
Name: ${data.profile.fullName}
Headline: ${data.profile.headline}
Phone: ${data.profile.phoneNumber}
Summary: ${data.profile.summary}
Skills: ${data.profile.skills.join(", ")}
Address:
${formattedAddress || "Not provided"}
Links: ${data.profile.links.map((link) => `${link.label}: ${link.url}`).join(", ")}
Notes: ${data.profile.notes}

Experience:
${experience}

Education:
${education || "Not provided"}

Certifications:
${certifications || "Not provided"}

Projects:
${projects || "Not provided"}

Additional Sections:
${customSections || "Not provided"}

GitHub context:
${repoContext}

Uploaded resume reference:
${data.resumeAsset?.extractedText ?? "No uploaded resume"}

Job target:
Company: ${data.job.companyName}
Role: ${data.job.roleTitle}
Description:
${formattedJobDescription}

Hiring manager notes:
${formattedHiringNotes}

Instructions:
- Be truthful and only use provided evidence.
- Tailor the output to the role.
- Surface relevant achievements, tools, and project work.
- Treat bullet points in the job description as distinct requirements or responsibilities.
- If generating interview answers, provide concise but strong draft answers.
- Return plain markdown.
`.trim();
}

export async function generateDocument(
  data: AppData,
  input: GenerateInput,
  bindings: AppBindings = {}
): Promise<GeneratedDocument> {
  const content = await runGeminiPrompt(buildPrompt(data, input), bindings);
  return {
    kind: input.kind,
    content: content || "No content returned.",
    createdAt: new Date().toISOString()
  };
}

export async function generateHeadline(data: AppData, bindings: AppBindings = {}) {
  const experience = data.profile.experience
    .slice(0, 5)
    .map((item) => `${item.title} at ${item.company}`)
    .join(", ");

  const prompt = `
Write exactly one concise professional resume headline for this candidate.

Rules:
- 4 to 10 words
- No punctuation-heavy tagline style
- No first person
- No made-up claims
- Reflect seniority, domain, and strongest focus
- Return only the headline text

Candidate:
Name: ${data.profile.fullName}
Summary: ${data.profile.summary}
Phone: ${data.profile.phoneNumber}
Skills: ${data.profile.skills.join(", ")}
Experience: ${experience}
Notes: ${data.profile.notes}
`.trim();

  return (await runGeminiPrompt(prompt, bindings)) || "";
}

export async function generateSummary(data: AppData, bindings: AppBindings = {}) {
  const experience = data.profile.experience
    .slice(0, 6)
    .map((item) => {
      const highlights = item.highlights.filter(Boolean).slice(0, 3).join("; ");
      const technologies = item.technologies.filter(Boolean).join(", ");

      return `${item.title} at ${item.company} (${item.startDate || "Unknown"} - ${item.endDate || "Present"})
Highlights: ${highlights || "None provided"}
Technologies: ${technologies || "None provided"}`;
    })
    .join("\n\n");

  const prompt = `
Write one professional summary for a resume based only on the candidate's real experience.

Rules:
- 3 to 5 sentences
- Warm, polished, and direct
- No first person
- No fake metrics or claims
- Focus on the candidate's actual experience, strengths, and relevant skills
- Do not use bullet points
- Return only the summary text

Candidate:
Name: ${data.profile.fullName}
Headline: ${data.profile.headline}
Current summary: ${data.profile.summary}
Phone: ${data.profile.phoneNumber}
Skills: ${data.profile.skills.join(", ")}
Notes: ${data.profile.notes}

Experience:
${experience || "No experience provided"}
`.trim();

  return (await runGeminiPrompt(prompt, bindings)) || "";
}

const commonJobWords = new Set([
  "with",
  "that",
  "this",
  "from",
  "have",
  "will",
  "your",
  "their",
  "about",
  "role",
  "team",
  "work",
  "using",
  "build",
  "develop",
  "years",
  "experience",
  "ability",
  "skills",
  "responsible",
  "strong",
  "plus",
  "must",
  "required",
  "preferred"
]);

function tokenizeForMatch(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .match(/[a-z0-9.+#-]{3,}/g)
        ?.filter((token) => !commonJobWords.has(token)) ?? []
    )
  );
}

function scoreTextAgainstJob(jobTokens: string[], value: string) {
  const haystack = value.toLowerCase();
  return jobTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function fallbackSelectionSuggestion(data: AppData, job: JobTargetInput): SelectionSuggestion {
  const jobTokens = tokenizeForMatch([job.companyName, job.roleTitle, job.jobDescription, job.hiringManagerNotes].join(" "));

  const experienceIds = data.profile.experience
    .map((item) => ({
      id: item.id,
      score: scoreTextAgainstJob(jobTokens, [item.company, item.title, item.highlights.join(" "), item.technologies.join(" ")].join(" "))
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((item) => item.id);

  const projectIds = data.profile.projects
    .map((item) => ({
      id: item.id,
      score: scoreTextAgainstJob(jobTokens, [item.title, item.category, item.summary, item.highlights.join(" "), item.technologies.join(" ")].join(" "))
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((item) => item.id);

  const certificationIds = data.profile.certifications
    .map((item) => ({
      id: item.id,
      score: scoreTextAgainstJob(jobTokens, [item.name, item.issuer, item.credentialId].join(" "))
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.id);

  const skillNames = data.profile.skills
    .map((skill) => ({
      name: skill,
      score: scoreTextAgainstJob(jobTokens, skill)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 12)
    .map((item) => item.name);

  return {
    experienceIds,
    projectIds,
    certificationIds,
    skillNames,
    reasoning:
      "These suggestions were ranked from your saved profile by matching the job description against your experience, projects, certifications, and skills."
  };
}

export async function suggestDocumentSelections(
  data: AppData,
  job: JobTargetInput,
  bindings: AppBindings = {}
): Promise<SelectionSuggestion> {
  const fallback = fallbackSelectionSuggestion(data, job);

  try {
    const prompt = `
You are helping tailor hiring materials for a candidate.

Read the target job and choose the best matching candidate experiences, projects, certifications, and skills.

Return only valid JSON in this exact shape:
{
  "experienceIds": ["string"],
  "projectIds": ["string"],
  "certificationIds": ["string"],
  "skillNames": ["string"],
  "reasoning": "string"
}

Rules:
- Only choose from the provided IDs and skill names.
- Prefer quality over quantity.
- Pick at most 4 experiences, 4 projects, 3 certifications, and 12 skills.
- Reasoning should be 1 to 2 short sentences.
- Return raw JSON only.

Target job:
Company: ${job.companyName}
Role: ${job.roleTitle}
Description:
${formatStructuredText(job.jobDescription)}

Extra details:
${formatStructuredText(job.hiringManagerNotes)}

Candidate experiences:
${data.profile.experience
  .map(
    (item) =>
      `ID: ${item.id}\nTitle: ${item.title}\nCompany: ${item.company}\nHighlights: ${item.highlights.join("; ")}\nTechnologies: ${item.technologies.join(", ")}`
  )
  .join("\n\n") || "None"}

Candidate projects:
${data.profile.projects
  .map(
    (item) =>
      `ID: ${item.id}\nTitle: ${item.title}\nSummary: ${item.summary}\nHighlights: ${item.highlights.join("; ")}\nTechnologies: ${item.technologies.join(", ")}`
  )
  .join("\n\n") || "None"}

Candidate certifications:
${data.profile.certifications
  .map((item) => `ID: ${item.id}\nName: ${item.name}\nIssuer: ${item.issuer}`)
  .join("\n\n") || "None"}

Candidate skills:
${data.profile.skills.join(", ") || "None"}
`.trim();

    const response = await runGeminiPrompt(prompt, bindings);
    const match = response.match(/\{[\s\S]*\}/);

    if (!match) {
      return fallback;
    }

    const parsed = JSON.parse(match[0]) as Partial<SelectionSuggestion>;
    const experienceIds = (parsed.experienceIds ?? []).filter((id) => data.profile.experience.some((item) => item.id === id)).slice(0, 4);
    const projectIds = (parsed.projectIds ?? []).filter((id) => data.profile.projects.some((item) => item.id === id)).slice(0, 4);
    const certificationIds = (parsed.certificationIds ?? [])
      .filter((id) => data.profile.certifications.some((item) => item.id === id))
      .slice(0, 3);
    const skillNames = (parsed.skillNames ?? [])
      .filter((name) => data.profile.skills.includes(name))
      .slice(0, 12);

    return {
      experienceIds: experienceIds.length ? experienceIds : fallback.experienceIds,
      projectIds: projectIds.length ? projectIds : fallback.projectIds,
      certificationIds: certificationIds.length ? certificationIds : fallback.certificationIds,
      skillNames: skillNames.length ? skillNames : fallback.skillNames,
      reasoning: parsed.reasoning?.trim() || fallback.reasoning
    };
  } catch {
    return fallback;
  }
}

function createEmptyAddress(): Address {
  return {
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  };
}

function sanitizeImportedEducation(items: ResumeProfileImport["education"] = []): Education[] {
  return items.map((item, index) => ({
    id: item.id?.trim() || `imported-edu-${index + 1}`,
    school: item.school?.trim() ?? "",
    degree: item.degree?.trim() ?? "",
    fieldOfStudy: item.fieldOfStudy?.trim() ?? "",
    startDate: item.startDate?.trim() ?? "",
    endDate: item.endDate?.trim() ?? "",
    description: item.description?.trim() ?? "",
    hasDifferentCountry: Boolean(item.hasDifferentCountry),
    country: item.country?.trim() ?? ""
  }));
}

function sanitizeImportedCertifications(items: ResumeProfileImport["certifications"] = []): Certification[] {
  return items.map((item, index) => ({
    id: item.id?.trim() || `imported-cert-${index + 1}`,
    name: item.name?.trim() ?? "",
    issuer: item.issuer?.trim() ?? "",
    issuedDate: item.issuedDate?.trim() ?? "",
    expirationDate: item.expirationDate?.trim() ?? "",
    credentialId: item.credentialId?.trim() ?? "",
    url: item.url?.trim() ?? ""
  }));
}

function sanitizeImportedCustomSections(items: ResumeProfileImport["customSections"] = []): CustomSection[] {
  return items
    .map((item, index) => ({
      id: item.id?.trim() || `imported-section-${index + 1}`,
      title: item.title?.trim() ?? "",
      items: (item.items ?? []).map((entry) => entry.trim()).filter(Boolean)
    }))
    .filter((item) => item.title || item.items.length > 0);
}

function formatStructuredText(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "Not provided";
  }

  const bulletPattern = /^([-\u2022*•]+|\d+[.)])\s+/;
  const hasBullets = lines.some((line) => bulletPattern.test(line));

  if (!hasBullets) {
    return lines.join("\n");
  }

  return lines
    .map((line) => {
      if (bulletPattern.test(line)) {
        return `- ${line.replace(bulletPattern, "").trim()}`;
      }

      return line;
    })
    .join("\n");
}

function sanitizeImportedProfile(parsed: Partial<ResumeProfileImport>): ResumeProfileImport {
  return {
    fullName: parsed.fullName?.trim() ?? "",
    headline: parsed.headline?.trim() ?? "",
    phoneNumber: parsed.phoneNumber?.trim() ?? "",
    summary: parsed.summary?.trim() ?? "",
    email: parsed.email?.trim() ?? "",
    address: {
      ...createEmptyAddress(),
      ...(parsed.address ?? {})
    },
    skills: (parsed.skills ?? []).map((skill) => skill.trim()).filter(Boolean),
    experience: (parsed.experience ?? []).map((item, index) => ({
      id: item.id?.trim() || `imported-exp-${index + 1}`,
      company: item.company?.trim() ?? "",
      title: item.title?.trim() ?? "",
      startDate: item.startDate?.trim() ?? "",
      endDate: item.endDate?.trim() ?? "",
      highlights: (item.highlights ?? []).map((highlight) => highlight.trim()).filter(Boolean),
      technologies: (item.technologies ?? []).map((technology) => technology.trim()).filter(Boolean)
    })),
    education: sanitizeImportedEducation(parsed.education),
    certifications: sanitizeImportedCertifications(parsed.certifications),
    customSections: sanitizeImportedCustomSections(parsed.customSections),
    links: (parsed.links ?? []).map((link, index): LinkItem => ({
      id: link.id?.trim() || `imported-link-${index + 1}`,
      label: link.label?.trim() || "Link",
      url: link.url?.trim() ?? ""
    })),
    notes: parsed.notes?.trim() ?? ""
  };
}

function normalizeResumeText(value: string) {
  const monthPattern = `(?:${monthNames.join("|")})`;

  return value
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    // Repair common PDF text extraction joins like "ApprenticeJune 2025".
    .replace(new RegExp(`([A-Za-z)])(${monthPattern}\\s+\\d{4})`, "g"), "$1 $2")
    // Repair merged location suffixes like "DataRichardson, TX, USA".
    .replace(/([A-Za-z])([A-Z][a-z]+,\s*[A-Z]{2},\s*[A-Z]{2,})/g, "$1 $2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

const dateRangePattern = new RegExp(
  `((?:${monthNames.join("|")})\\s+\\d{4})\\s*-\\s*(Present|Current|(?:${monthNames.join("|")})\\s+\\d{4})`,
  "i"
);

const knownTechKeywords = [
  ".NET",
  ".NET 8",
  "C#",
  "JavaScript",
  "TypeScript",
  "Python",
  "SQL",
  "Java",
  "React",
  "Vue.js",
  "Node.js",
  "Bun",
  "Tailwind CSS",
  "Azure",
  "Microsoft Azure",
  "Git",
  "GitOps",
  "Vercel",
  "PostgreSQL",
  "MongoDB",
  "SurrealDB",
  "Hono",
  "Drizzle ORM",
  "Terraform",
  "MapLibre JS",
  "BigQuery",
  "DuckDB"
] as const;

type ResumeSections = {
  summary: string[];
  education: string[];
  experience: string[];
  projects: string[];
  skills: string[];
  certifications: string[];
  organizations: string[];
};

function findFirstMatch(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function splitListItems(value: string) {
  return value
    .split(/\n|,|•|·|\||;/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function splitBulletLines(value: string) {
  return value
    .split(/\n|•|·/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function normalizeHeadingKey(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function splitIntoSections(text: string): ResumeSections {
  const sections: ResumeSections = {
    summary: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    organizations: []
  };

  const headingMap: Record<string, keyof ResumeSections> = {
    summary: "summary",
    professionalsummary: "summary",
    profile: "summary",
    objective: "summary",
    education: "education",
    academicbackground: "education",
    professionalexperience: "experience",
    experience: "experience",
    workexperience: "experience",
    projectsoutsideexperience: "projects",
    projects: "projects",
    skills: "skills",
    technicalskills: "skills",
    coreskills: "skills",
    technologies: "skills",
    certifications: "certifications",
    certificates: "certifications",
    licenses: "certifications",
    organizations: "organizations"
  };

  let current: keyof ResumeSections | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      if (current) {
        sections[current].push("");
      }
      continue;
    }

    const key = normalizeHeadingKey(line);
    if (headingMap[key]) {
      current = headingMap[key];
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
}

function collapseWrappedLines(lines: string[]) {
  const collapsed: string[] = [];

  for (const line of lines) {
    if (!line) {
      collapsed.push("");
      continue;
    }

    const previous = collapsed[collapsed.length - 1];
    const isBullet = /^[-\u2022*•]/.test(line);

    if (previous && previous !== "" && !isBullet && !dateRangePattern.test(line) && /^[a-z0-9(]/i.test(line)) {
      collapsed[collapsed.length - 1] = `${previous} ${line}`.replace(/\s+/g, " ").trim();
      continue;
    }

    collapsed.push(line);
  }

  return collapsed;
}

function parseMonthYear(value: string) {
  const match = value.match(new RegExp(`(${monthNames.join("|")})\\s+(\\d{4})`, "i"));
  if (!match) {
    return "";
  }

  const monthIndex = monthNames.findIndex((month) => month.toLowerCase() === match[1].toLowerCase());
  return `${match[2]}-${String(monthIndex + 1).padStart(2, "0")}-01`;
}

function parseDateRange(value: string) {
  const match = value.match(dateRangePattern);
  if (!match) {
    return { startDate: "", endDate: "" };
  }

  const [range] = match;
  const [startRaw, endRaw] = range.split(/\s*-\s*/);

  return {
    startDate: parseMonthYear(startRaw),
    endDate: /present|current/i.test(endRaw) ? "" : parseMonthYear(endRaw)
  };
}

function trimLocationSuffix(value: string) {
  const match = value.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}(?:,\s*[A-Z]{2,})?)$/);

  if (!match || match.index === undefined) {
    return value.trim();
  }

  return value.slice(0, match.index).trim() || value.trim();
}

function inferTechnologiesFromText(value: string) {
  const lower = value.toLowerCase();
  return knownTechKeywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function parseExperienceEntries(lines: string[]) {
  const collapsed = collapseWrappedLines(lines).filter((line) => line !== "");
  const entries: ResumeProfileImport["experience"] = [];

  let index = 0;
  while (index < collapsed.length) {
    const companyLine = collapsed[index] ?? "";
    const titleLine = collapsed[index + 1] ?? "";
    const bulletLines: string[] = [];
    index += 2;

    while (index < collapsed.length && /^[-\u2022*•]/.test(collapsed[index] ?? "")) {
      bulletLines.push((collapsed[index] ?? "").replace(/^[-\u2022*•]\s*/, "").trim());
      index += 1;
    }

    if (!companyLine && !titleLine && bulletLines.length === 0) {
      continue;
    }

    const { startDate, endDate } = parseDateRange(titleLine);
    const normalizedTitle = titleLine
      .replace(dateRangePattern, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    entries.push({
      id: `heuristic-exp-${entries.length + 1}`,
      company: trimLocationSuffix(companyLine),
      title: normalizedTitle,
      startDate,
      endDate,
      highlights: bulletLines,
      technologies: Array.from(new Set(inferTechnologiesFromText([companyLine, titleLine, ...bulletLines].join(" "))))
    });
  }

  return entries.filter((entry) => entry.company || entry.title || entry.highlights.length > 0);
}

function parseEducationEntries(lines: string[]) {
  const collapsed = collapseWrappedLines(lines).filter((line) => line !== "");
  const entries: Education[] = [];

  for (let index = 0; index < collapsed.length; index += 2) {
    let schoolLine = collapsed[index] ?? "";
    let degreeLine = collapsed[index + 1] ?? "";

    if (!schoolLine && !degreeLine) {
      continue;
    }

    if (!degreeLine && schoolLine.includes("Bachelor")) {
      const [schoolPart, degreePart] = schoolLine.split(/(?=Bachelor|Master|Associate|PhD|MBA|JD|MD|Diploma|Certificate)/i);
      schoolLine = schoolPart?.trim() ?? schoolLine;
      degreeLine = degreePart?.trim() ?? "";
    }

    const { startDate, endDate } = parseDateRange(schoolLine);
    const school = schoolLine.replace(dateRangePattern, "").trim();
    const [degree = "", fieldOfStudy = ""] = degreeLine.split(",").map((item) => item.trim());

    entries.push({
      id: `heuristic-edu-${entries.length + 1}`,
      school,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      description: "",
      hasDifferentCountry: false,
      country: ""
    });
  }

  return entries;
}

function buildHeuristicImportedProfile(resumeText: string): ResumeProfileImport {
  const text = normalizeResumeText(resumeText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? "";
  const email = findFirstMatch(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  const phone = findFirstMatch(text, /(\+?\d[\d().\-\s]{7,}\d)/);
  const sections = splitIntoSections(text);
  const links = Array.from(new Set((text.match(/https?:\/\/[^\s)]+/g) ?? []).map((item) => item.trim())));

  const locationParts = secondLine.split("|").map((item) => item.trim()).filter(Boolean);
  const locationCandidate = locationParts.find(
    (item) => !item.includes("@") && !/\d/.test(item) && !item.toLowerCase().includes("linkedin")
  );
  const [city = "", state = "", country = ""] = (locationCandidate ?? "")
    .split(",")
    .map((item) => item.trim());

  const educationItems = parseEducationEntries(sections.education);
  const certificationItems = sections.certifications.length
    ? splitListItems(sections.certifications.join("\n")).map((item, index) => ({
        id: `heuristic-cert-${index + 1}`,
        name: item,
        issuer: "",
        issuedDate: "",
        expirationDate: "",
        credentialId: "",
        url: ""
      }))
    : [];

  const customSections = sections.projects.length
    ? [
        {
          id: "heuristic-section-projects",
          title: "Projects",
          items: splitBulletLines(sections.projects.join("\n"))
        }
      ]
    : [];

  const skills = sections.skills.length
    ? splitListItems(
        sections.skills
          .join("\n")
          .replace(/Languages:\s*/gi, "")
          .replace(/Frameworks\s*&\s*Tools:\s*/gi, "")
          .replace(/Cloud\s*&\s*Infrastructure:\s*/gi, "")
          .replace(/Databases:\s*/gi, "")
          .replace(/Concepts:\s*/gi, "")
      )
    : [];

  const experience = parseExperienceEntries(sections.experience);

  return sanitizeImportedProfile({
    fullName: firstLine && !firstLine.includes("@") && firstLine.length < 80 ? firstLine : "",
    headline: experience[0]?.title || "",
    phoneNumber: phone,
    summary: sections.summary.join(" ").replace(/\s+/g, " ").trim(),
    email,
    address: {
      ...createEmptyAddress(),
      city,
      state,
      country
    },
    skills,
    experience,
    education: educationItems,
    certifications: certificationItems,
    customSections,
    links: links.map((url, index) => ({
      id: `heuristic-link-${index + 1}`,
      label: url.includes("linkedin.com") ? "LinkedIn" : url.includes("github.com") ? "GitHub" : "Link",
      url
    }))
  });
}

function buildMinimalImportedProfile(resumeText: string): ResumeProfileImport {
  const text = normalizeResumeText(resumeText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const email = findFirstMatch(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  const phone = findFirstMatch(text, /(\+?\d[\d().\-\s]{7,}\d)/);
  const links = Array.from(new Set((text.match(/https?:\/\/[^\s)]+/g) ?? []).map((item) => item.trim())));

  return sanitizeImportedProfile({
    fullName: lines[0] && !lines[0].includes("@") && lines[0].length < 80 ? lines[0] : "",
    headline: lines[1] && !lines[1].includes("@") && lines[1].length < 80 ? lines[1] : "",
    phoneNumber: phone,
    email,
    summary: "",
    skills: [],
    education: [],
    certifications: [],
    customSections: [],
    links: links.map((url, index) => ({
      id: `minimal-link-${index + 1}`,
      label: url.includes("linkedin.com") ? "LinkedIn" : url.includes("github.com") ? "GitHub" : "Link",
      url
    }))
  });
}

function buildSafeHeuristicImportedProfile(resumeText: string) {
  try {
    return buildHeuristicImportedProfile(resumeText);
  } catch {
    return buildMinimalImportedProfile(resumeText);
  }
}

function mergeImportedProfiles(primary: ResumeProfileImport, fallback: ResumeProfileImport): ResumeProfileImport {
  return sanitizeImportedProfile({
    fullName: primary.fullName || fallback.fullName,
    headline: primary.headline || fallback.headline,
    phoneNumber: primary.phoneNumber || fallback.phoneNumber,
    summary: primary.summary || fallback.summary,
    email: primary.email || fallback.email,
    address: {
      ...fallback.address,
      ...primary.address
    },
    skills: Array.from(new Set([...primary.skills, ...fallback.skills])),
    experience: primary.experience.length ? primary.experience : fallback.experience,
    education: primary.education.length ? primary.education : fallback.education,
    certifications: primary.certifications.length ? primary.certifications : fallback.certifications,
    customSections: primary.customSections.length ? primary.customSections : fallback.customSections,
    links: primary.links.length ? primary.links : fallback.links,
    notes: primary.notes || fallback.notes
  });
}

export async function importProfileFromResumeText(resumeText: string, bindings: AppBindings = {}) {
  const normalizedResumeText = normalizeResumeText(resumeText);
  const heuristicImportedProfile = buildSafeHeuristicImportedProfile(normalizedResumeText);

  if (normalizedResumeText.length < 80) {
    throw new Error("We could upload the file, but we could not extract enough readable text to import from it. Try a text-based PDF or DOCX.");
  }
  return heuristicImportedProfile;
}
