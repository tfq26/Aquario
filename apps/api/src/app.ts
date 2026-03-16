import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { generateDocument, generateHeadline } from "./ai.js";
import type { AppBindings } from "./bindings.js";
import { fetchGitHubContext } from "./github.js";
import { persistResume } from "./resume.js";
import { readStore, writeStore } from "./store.js";

export function createApp() {
  const app = new Hono<{ Bindings: AppBindings }>();
  app.use("*", cors());

  const profileSchema = z.object({
    fullName: z.string(),
    headline: z.string(),
    summary: z.string(),
    email: z.string(),
    address: z.string(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        id: z.string(),
        company: z.string(),
        title: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        highlights: z.array(z.string()),
        technologies: z.array(z.string())
      })
    ),
    links: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        url: z.string()
      })
    ),
    githubUsername: z.string(),
    githubUrl: z.string(),
    notes: z.string()
  });

  const jobSchema = z.object({
    companyName: z.string(),
    roleTitle: z.string(),
    jobDescription: z.string(),
    hiringManagerNotes: z.string()
  });

  app.get("/api/state", async (c) => c.json(await readStore(c.env)));

  app.put("/api/profile", async (c) => {
    const payload = profileSchema.parse(await c.req.json());
    const data = await readStore(c.env);
    data.profile = payload;
    await writeStore(data, c.env);
    return c.json(data.profile);
  });

  app.put("/api/job", async (c) => {
    const payload = jobSchema.parse(await c.req.json());
    const data = await readStore(c.env);
    data.job = payload;
    await writeStore(data, c.env);
    return c.json(data.job);
  });

  app.post("/api/resume/upload", async (c) => {
    const form = await c.req.formData();
    const file = form.get("resume");

    if (!(file instanceof File)) {
      return c.json({ error: "Resume file is required" }, 400);
    }

    const resumeAsset = await persistResume(file, c.env.RESUME_BUCKET);
    const data = await readStore(c.env);
    data.resumeAsset = resumeAsset;
    await writeStore(data, c.env);
    return c.json(resumeAsset);
  });

  app.post("/api/github/sync", async (c) => {
    const { username } = z.object({ username: z.string().min(1) }).parse(await c.req.json());
    const data = await readStore(c.env);
    const repos = await fetchGitHubContext(username, process.env.GITHUB_TOKEN);
    data.profile.githubUsername = username;
    data.profile.githubUrl = `https://github.com/${username}`;
    data.repos = repos;
    await writeStore(data, c.env);
    return c.json(repos);
  });

  app.post("/api/generate", async (c) => {
    const payload = z
      .object({
        kind: z.enum(["tailored-resume", "cv", "cover-letter", "interview-answers"]),
        userRequest: z.string().optional()
      })
      .parse(await c.req.json());

    const data = await readStore(c.env);
    const generated = await generateDocument(data, payload);
    data.generated.unshift(generated);
    await writeStore(data, c.env);
    return c.json(generated);
  });

  app.post("/api/profile/generate-headline", async (c) => {
    const data = await readStore(c.env);
    const headline = await generateHeadline(data);
    data.profile.headline = headline;
    await writeStore(data, c.env);
    return c.json({ headline });
  });

  app.get("/api/health", (c) => c.json({ ok: true }));

  return app;
}
