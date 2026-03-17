import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  issueSessionToken,
  readOAuthState,
  readSession,
  requireAuth,
  setOAuthStateCookie,
  setSessionCookie
} from "./auth.js";
import { generateDocument, generateHeadline, generateSummary, importProfileFromResumeText } from "./ai.js";
import type { AppBindings } from "./bindings.js";
import { getConfig } from "./config.js";
import { fetchGitHubContext } from "./github.js";
import { resolveCatalogTerm, searchCatalog } from "./catalog.js";
import { buildAppRedirect, buildAuthorizationUrl, exchangeCodeForUser, getOAuthProviders } from "./oauth.js";
import { persistResume } from "./resume.js";
import { readStore, writeStore } from "./store.js";

export function createApp() {
  const app = new Hono<{ Bindings: AppBindings }>();
  app.use(
    "*",
    cors({
      origin: (origin, c) => {
        const configuredOrigin = getConfig(c.env).appOrigin;

        if (!origin) {
          return configuredOrigin || "*";
        }

        return configuredOrigin || origin;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true
    })
  );

  const profileSchema = z.object({
    fullName: z.string(),
    headline: z.string(),
    phoneNumber: z.string(),
    summary: z.string(),
    email: z.string(),
    address: z.object({
      street1: z.string(),
      street2: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string()
    }),
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
    education: z.array(
      z.object({
        id: z.string(),
        school: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        description: z.string(),
        hasDifferentCountry: z.boolean(),
        country: z.string()
      })
    ),
    certifications: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        issuer: z.string(),
        issuedDate: z.string(),
        expirationDate: z.string(),
        credentialId: z.string(),
        url: z.string()
      })
    ),
    projects: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        summary: z.string(),
        technologies: z.array(z.string()),
        startedAt: z.string(),
        lastActiveAt: z.string(),
        developmentDuration: z.string(),
        repoUrl: z.string(),
        homepageUrl: z.string(),
        highlights: z.array(z.string())
      })
    ),
    customSections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        items: z.array(z.string())
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

  const authSchema = z.object({
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(1),
    remember: z.boolean().optional()
  });

  const hasMeaningfulEducation = (items: Array<{ school: string; degree: string; description: string }>) =>
    items.some((item) => item.school.trim() || item.degree.trim() || item.description.trim());

  const hasMeaningfulCertifications = (items: Array<{ name: string; issuer: string; credentialId: string }>) =>
    items.some((item) => item.name.trim() || item.issuer.trim() || item.credentialId.trim());

  const hasMeaningfulCustomSections = (items: Array<{ title: string; items: string[] }>) =>
    items.some((item) => item.title.trim() || item.items.some((entry) => entry.trim()));

  app.post("/api/auth/login", async (c) => {
    const payload = authSchema.parse(await c.req.json());
    const config = getConfig(c.env);

    if (!config.authPassword || !config.authSecret) {
      return c.json({ error: "Authentication is not configured on the server." }, 500);
    }

    if (payload.password !== config.authPassword) {
      return c.json({ error: "Invalid password" }, 401);
    }

    const session = { provider: "password" as const, email: payload.email };
    const token = await issueSessionToken(c, payload.remember ?? false, session);
    await setSessionCookie(c, payload.remember ?? false, session);

    return c.json({
      authenticated: true,
      token,
      user: {
        provider: "password",
        email: payload.email ?? "",
        name: "",
        avatarUrl: ""
      }
    });
  });

  app.get("/api/auth/:provider/login", async (c) => {
    const provider = z.enum(["github", "google"]).parse(c.req.param("provider"));
    const providers = getOAuthProviders(c);

    if (!providers[provider]) {
      return c.redirect(buildAppRedirect(c, false, `${provider} sign-in is not configured.`));
    }

    await setOAuthStateCookie(c, provider);
    return c.redirect(buildAuthorizationUrl(c, provider));
  });

  app.get("/api/auth/:provider/callback", async (c) => {
    const provider = z.enum(["github", "google"]).parse(c.req.param("provider"));
    const code = c.req.query("code");

    if (!code) {
      clearOAuthStateCookie(c);
      return c.redirect(buildAppRedirect(c, false, "The provider did not return an authorization code."));
    }

    const state = await readOAuthState(c, provider);

    if (!state) {
      clearOAuthStateCookie(c);
      return c.redirect(buildAppRedirect(c, false, "The sign-in request expired or is invalid."));
    }

    try {
      const user = await exchangeCodeForUser(c, provider, code);
      const session = {
        provider,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      };
      const token = await issueSessionToken(c, true, session);
      await setSessionCookie(c, true, session);
      clearOAuthStateCookie(c);
      return c.redirect(buildAppRedirect(c, true, undefined, token));
    } catch (error) {
      clearOAuthStateCookie(c);
      const message = error instanceof Error ? error.message : "OAuth sign-in failed.";
      return c.redirect(buildAppRedirect(c, false, message));
    }
  });

  app.post("/api/auth/logout", (c) => {
    clearOAuthStateCookie(c);
    clearSessionCookie(c);
    return c.json({ authenticated: false });
  });

  app.get("/api/auth/session", async (c) => {
    const providers = getOAuthProviders(c);
    const config = getConfig(c.env);

    if (!config.authSecret || (!providers.password && !providers.github && !providers.google)) {
      return c.json({ authenticated: false, configured: false, providers, user: null });
    }

    const session = await readSession(c);

    return c.json({
      authenticated: Boolean(session),
      configured: true,
      providers,
      user: session
        ? {
            provider: session.provider,
            email: session.email ?? "",
            name: session.name ?? "",
            avatarUrl: session.avatarUrl ?? ""
          }
        : null
    });
  });

  app.use("/api/state", requireAuth);
  app.use("/api/profile", requireAuth);
  app.use("/api/job", requireAuth);
  app.use("/api/resume/*", requireAuth);
  app.use("/api/github/*", requireAuth);
  app.use("/api/universities/*", requireAuth);
  app.use("/api/catalog/*", requireAuth);
  app.use("/api/generate", requireAuth);
  app.use("/api/profile/generate-headline", requireAuth);
  app.use("/api/profile/generate-summary", requireAuth);

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

  app.post("/api/resume/import", async (c) => {
    try {
      const form = await c.req.formData();
      const file = form.get("resume");

      if (!(file instanceof File)) {
        return c.json({ error: "Resume file is required" }, 400);
      }

      const resumeAsset = await persistResume(file, c.env.RESUME_BUCKET);
      const importedProfile = await importProfileFromResumeText(resumeAsset.extractedText, c.env);
      const data = await readStore(c.env);

      data.resumeAsset = resumeAsset;
      data.profile.fullName = data.profile.fullName || importedProfile.fullName;
      data.profile.headline = data.profile.headline || importedProfile.headline;
      data.profile.phoneNumber = data.profile.phoneNumber || importedProfile.phoneNumber;
      data.profile.summary = data.profile.summary || importedProfile.summary;
      data.profile.email = data.profile.email || importedProfile.email;
      data.profile.address = {
        street1: data.profile.address.street1 || importedProfile.address.street1,
        street2: data.profile.address.street2 || importedProfile.address.street2,
        city: data.profile.address.city || importedProfile.address.city,
        state: data.profile.address.state || importedProfile.address.state,
        zipCode: data.profile.address.zipCode || importedProfile.address.zipCode,
        country: data.profile.address.country || importedProfile.address.country
      };
      data.profile.skills = Array.from(new Set([...data.profile.skills, ...importedProfile.skills]));
      data.profile.education = hasMeaningfulEducation(data.profile.education) ? data.profile.education : importedProfile.education;
      data.profile.certifications = hasMeaningfulCertifications(data.profile.certifications)
        ? data.profile.certifications
        : importedProfile.certifications;
      data.profile.customSections = hasMeaningfulCustomSections(data.profile.customSections)
        ? data.profile.customSections
        : importedProfile.customSections;
      data.profile.links = data.profile.links.length
        ? data.profile.links
        : importedProfile.links.filter((link) => link.url);
      data.profile.notes = data.profile.notes || importedProfile.notes;

      if (importedProfile.experience.length > 0) {
        data.profile.experience = importedProfile.experience;
      }

      await writeStore(data, c.env);

      return c.json({
        resumeAsset,
        profile: data.profile
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Resume import failed.";
      const status = message.includes("could not extract enough readable text") ? 422 : 500;
      return c.json({ error: message }, status);
    }
  });

  app.post("/api/github/sync", async (c) => {
    const { username } = z.object({ username: z.string().min(1) }).parse(await c.req.json());
    const data = await readStore(c.env);
    const { repos, projects } = await fetchGitHubContext(username, c.env);
    data.profile.githubUsername = username;
    data.profile.githubUrl = `https://github.com/${username}`;
    data.repos = repos;
    data.profile.projects = projects;
    await writeStore(data, c.env);
    return c.json({ repos, projects });
  });

  app.get("/api/universities/search", async (c) => {
    const country = (c.req.query("country") ?? "").trim();
    const name = (c.req.query("name") ?? "").trim();

    if (!country) {
      return c.json([]);
    }

    const url = new URL("http://universities.hipolabs.com/search");
    url.searchParams.set("country", country);

    if (name) {
      url.searchParams.set("name", name);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      return c.json({ error: "Unable to fetch universities right now." }, 502);
    }

    const payload = (await response.json()) as Array<{
      name?: string;
      country?: string;
      "state-province"?: string | null;
      web_pages?: string[];
      domains?: string[];
    }>;

    const universities = payload
      .map((item) => ({
        name: item.name ?? "",
        country: item.country ?? country,
        stateProvince: item["state-province"] ?? "",
        website: item.web_pages?.[0] ?? "",
        domain: item.domains?.[0] ?? ""
      }))
      .filter((item) => item.name)
      .slice(0, 20);

    return c.json(universities);
  });

  app.get("/api/catalog/search", async (c) => {
    const kind = z.enum(["skill", "technology"]).parse(c.req.query("kind"));
    const query = (c.req.query("q") ?? "").trim();
    return c.json(await searchCatalog(c.env.APP_DB, kind, query));
  });

  app.post("/api/catalog/resolve", async (c) => {
    const payload = z
      .object({
        kind: z.enum(["skill", "technology"]),
        value: z.string().min(1)
      })
      .parse(await c.req.json());

    const session = await readSession(c);
    const userKey = `${session?.provider ?? "user"}:${session?.email ?? "unknown"}`;
    return c.json(await resolveCatalogTerm(c.env.APP_DB, payload.kind, payload.value, userKey));
  });

  app.post("/api/generate", async (c) => {
    const payload = z
      .object({
        kind: z.enum(["tailored-resume", "cv", "cover-letter", "interview-answers"]),
        userRequest: z.string().optional()
      })
      .parse(await c.req.json());

    const data = await readStore(c.env);
    const generated = await generateDocument(data, payload, c.env);
    data.generated.unshift(generated);
    await writeStore(data, c.env);
    return c.json(generated);
  });

  app.post("/api/profile/generate-headline", async (c) => {
    const data = await readStore(c.env);
    const headline = await generateHeadline(data, c.env);
    data.profile.headline = headline;
    await writeStore(data, c.env);
    return c.json({ headline });
  });

  app.post("/api/profile/generate-summary", async (c) => {
    const data = await readStore(c.env);
    const summary = await generateSummary(data, c.env);
    data.profile.summary = summary;
    await writeStore(data, c.env);
    return c.json({ summary });
  });

  app.get("/api/health", (c) => c.json({ ok: true }));

  return app;
}
