import type { AppData, GeneratedDocument } from "./types.js";

type GenerateInput = {
  kind: GeneratedDocument["kind"];
  userRequest?: string;
};

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const baseUrl = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  return { apiKey, model, baseUrl };
}

async function runGeminiPrompt(prompt: string) {
  const { apiKey, model, baseUrl } = getGeminiConfig();

  const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
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
    throw new Error(`AI request failed with ${response.status}: ${body}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return (
    payload.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
}

function buildPrompt(data: AppData, input: GenerateInput) {
  const experience = data.profile.experience
    .map(
      (item) =>
        `${item.title} at ${item.company} (${item.startDate} - ${item.endDate})\n` +
        `Highlights: ${item.highlights.join("; ")}\n` +
        `Tech: ${item.technologies.join(", ")}`
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
Summary: ${data.profile.summary}
Skills: ${data.profile.skills.join(", ")}
Address: ${data.profile.address}
Links: ${data.profile.links.map((link) => `${link.label}: ${link.url}`).join(", ")}
Notes: ${data.profile.notes}

Experience:
${experience}

GitHub context:
${repoContext}

Uploaded resume reference:
${data.resumeAsset?.extractedText ?? "No uploaded resume"}

Job target:
Company: ${data.job.companyName}
Role: ${data.job.roleTitle}
Description:
${data.job.jobDescription}

Hiring manager notes:
${data.job.hiringManagerNotes}

Instructions:
- Be truthful and only use provided evidence.
- Tailor the output to the role.
- Surface relevant achievements, tools, and project work.
- If generating interview answers, provide concise but strong draft answers.
- Return plain markdown.
`.trim();
}

export async function generateDocument(data: AppData, input: GenerateInput): Promise<GeneratedDocument> {
  const content = await runGeminiPrompt(buildPrompt(data, input));
  return {
    kind: input.kind,
    content: content || "No content returned.",
    createdAt: new Date().toISOString()
  };
}

export async function generateHeadline(data: AppData) {
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
Skills: ${data.profile.skills.join(", ")}
Experience: ${experience}
Notes: ${data.profile.notes}
`.trim();

  return (await runGeminiPrompt(prompt)) || "";
}
