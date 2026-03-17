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
  return value
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

function extractSection(text: string, headings: string[]) {
  const escaped = headings.map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const headingPattern = new RegExp(`^(?:${escaped.join("|")})\\s*:?\$`, "i");
  const lines = text.split("\n");
  const collected: string[] = [];
  let active = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (headingPattern.test(trimmed)) {
      active = true;
      continue;
    }

    if (
      active &&
      /^[A-Z][A-Za-z/& ,()-]{2,40}\s*:?$/.test(trimmed) &&
      !trimmed.includes("@") &&
      trimmed.toLowerCase() !== trimmed
    ) {
      break;
    }

    if (active) {
      collected.push(line);
    }
  }

  return collected.join("\n").trim();
}

function buildHeuristicImportedProfile(resumeText: string): ResumeProfileImport {
  const text = normalizeResumeText(resumeText);
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? "";
  const email = findFirstMatch(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  const phone = findFirstMatch(text, /(\+?\d[\d().\-\s]{7,}\d)/);
  const skillsSection = extractSection(text, ["Skills", "Technical Skills", "Core Skills", "Technologies"]);
  const summarySection = extractSection(text, ["Summary", "Professional Summary", "Profile", "Objective"]);
  const educationSection = extractSection(text, ["Education", "Academic Background"]);
  const certificationsSection = extractSection(text, ["Certifications", "Certificates", "Licenses"]);
  const projectsSection = extractSection(text, ["Projects", "Awards", "Volunteer Experience", "Leadership", "Publications"]);
  const links = Array.from(new Set((text.match(/https?:\/\/[^\s)]+/g) ?? []).map((item) => item.trim())));

  const educationItems = educationSection
    ? educationSection
        .split(/\n{2,}/)
        .map((block, index) => {
          const blockLines = block.split("\n").map((line) => line.trim()).filter(Boolean);
          if (blockLines.length === 0) {
            return null;
          }

          return {
            id: `heuristic-edu-${index + 1}`,
            school: blockLines[0] ?? "",
            degree: blockLines[1] ?? "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            description: blockLines.slice(2).join(" "),
            hasDifferentCountry: false,
            country: ""
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  const certificationItems = certificationsSection
    ? splitListItems(certificationsSection).map((item, index) => ({
        id: `heuristic-cert-${index + 1}`,
        name: item,
        issuer: "",
        issuedDate: "",
        expirationDate: "",
        credentialId: "",
        url: ""
      }))
    : [];

  const customSections = projectsSection
    ? [
        {
          id: "heuristic-section-projects",
          title: "Projects",
          items: splitListItems(projectsSection)
        }
      ]
    : [];

  return sanitizeImportedProfile({
    fullName: firstLine && !firstLine.includes("@") && firstLine.length < 80 ? firstLine : "",
    headline:
      secondLine &&
      !secondLine.includes("@") &&
      !secondLine.toLowerCase().includes("linkedin") &&
      secondLine.length < 80
        ? secondLine
        : "",
    phoneNumber: phone,
    summary: summarySection.split("\n").map((line) => line.trim()).filter(Boolean).join(" "),
    email,
    skills: splitListItems(skillsSection),
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
  const heuristicImportedProfile = buildHeuristicImportedProfile(normalizedResumeText);

  if (normalizedResumeText.length < 80) {
    throw new Error("We could upload the file, but we could not extract enough readable text to import from it. Try a text-based PDF or DOCX.");
  }

  const prompt = `
Extract structured candidate information from this resume text.

Return only valid JSON matching this exact shape:
{
  "fullName": "string",
  "headline": "string",
  "phoneNumber": "string",
  "summary": "string",
  "email": "string",
  "address": {
    "street1": "string",
    "street2": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "skills": ["string"],
  "experience": [
    {
      "id": "string",
      "company": "string",
      "title": "string",
      "startDate": "YYYY-MM-DD or empty string",
      "endDate": "YYYY-MM-DD or empty string",
      "highlights": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "id": "string",
      "school": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startDate": "YYYY-MM-DD or empty string",
      "endDate": "YYYY-MM-DD or empty string",
      "description": "string",
      "hasDifferentCountry": true,
      "country": "string"
    }
  ],
  "certifications": [
    {
      "id": "string",
      "name": "string",
      "issuer": "string",
      "issuedDate": "YYYY-MM-DD or empty string",
      "expirationDate": "YYYY-MM-DD or empty string",
      "credentialId": "string",
      "url": "string"
    }
  ],
  "customSections": [
    {
      "id": "string",
      "title": "string",
      "items": ["string"]
    }
  ],
  "links": [
    {
      "id": "string",
      "label": "string",
      "url": "string"
    }
  ],
  "notes": "string"
}

Rules:
- Use only information present in the resume.
- If a value is not available, use an empty string or empty array.
- For dates, prefer YYYY-MM-DD when the day is known. If only month/year are known, use YYYY-MM-01. If unknown, use empty string.
- Keep summaries concise and factual.
- Skills should be distinct and useful.
- Highlights should be short bullet-style statements.
- Technologies should contain tools, languages, frameworks, or platforms.
- Education should include degrees, schools, dates, and any short supporting detail when present.
- If the education is in a different country from the candidate address and the resume makes that clear, set hasDifferentCountry to true and include the country.
- Certifications should include issuer, dates, credential IDs, and links when present.
- Use customSections for resume sections like projects, awards, volunteer work, leadership, publications, or activities when they do not fit elsewhere.
- Do not wrap the JSON in markdown fences.

Resume text:
${normalizedResumeText}
`.trim();

  let response = "";

  try {
    response = await runGeminiPrompt(prompt, bindings);
  } catch {
    return heuristicImportedProfile;
  }

  const match = response.match(/\{[\s\S]*\}/);

  if (!match) {
    return heuristicImportedProfile;
  }

  try {
    const aiImportedProfile = sanitizeImportedProfile(JSON.parse(match[0]) as Partial<ResumeProfileImport>);

    return mergeImportedProfiles(aiImportedProfile, heuristicImportedProfile);
  } catch {
    return heuristicImportedProfile;
  }
}
