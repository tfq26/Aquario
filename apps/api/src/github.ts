import type { Project, RepoContext } from "./types.js";
import type { AppBindings } from "./bindings.js";
import { getConfig } from "./config.js";

const githubApi = "https://api.github.com";

type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language: string | null;
  fork: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
};

type GitHubLanguages = Record<string, number>;

function buildProjectCategory(repo: GitHubRepo, languages: string[], readmeExcerpt: string) {
  const searchable = [repo.name, repo.description ?? "", ...(repo.topics ?? []), ...languages, readmeExcerpt].join(" ").toLowerCase();

  if (/(ios|android|swift|kotlin|react native|flutter|mobile)/.test(searchable)) {
    return "Mobile App";
  }

  if (/(data|analytics|ml|ai|python|jupyter|notebook|model)/.test(searchable)) {
    return "Data / AI";
  }

  if (/(api|backend|server|express|hono|node|go|rust|django|fastapi)/.test(searchable)) {
    return "Backend Service";
  }

  if (/(design system|component|ui|frontend|vite|vue|react|next)/.test(searchable)) {
    return "Frontend App";
  }

  if (/(cli|tool|devtool|plugin|extension|sdk|library|package)/.test(searchable)) {
    return "Tooling / Library";
  }

  return "Software Project";
}

function firstMeaningfulParagraph(readmeExcerpt: string) {
  return (
    readmeExcerpt
      .split(/\n\s*\n/)
      .map((block) => block.replace(/^#+\s*/gm, "").replace(/[`*_>-]/g, "").trim())
      .find((block) => block.length > 40) ?? ""
  );
}

function formatDuration(startedAt: string, lastActiveAt: string) {
  if (!startedAt || !lastActiveAt) {
    return "";
  }

  const start = new Date(startedAt);
  const end = new Date(lastActiveAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return "";
  }

  const totalMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];

  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }

  if (months > 0 || parts.length === 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }

  return parts.join(" ");
}

function buildProjectSummary(repo: GitHubRepo, readmeExcerpt: string, category: string) {
  const readmeSummary = firstMeaningfulParagraph(readmeExcerpt);
  return readmeSummary || repo.description || `${repo.name} is a ${category.toLowerCase()} built from this GitHub repository.`;
}

function buildProjectHighlights(repo: GitHubRepo, languages: string[], category: string) {
  const highlights = [
    repo.description ? `Purpose: ${repo.description}` : "",
    languages.length ? `Technologies: ${languages.join(", ")}` : "",
    repo.topics?.length ? `Focus areas: ${repo.topics.join(", ")}` : "",
    `Project type: ${category}`
  ].filter(Boolean);

  return highlights;
}

async function githubFetch<T>(pathname: string, token?: string): Promise<T> {
  const response = await fetch(`${githubApi}${pathname}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function githubFetchAllRepos(username: string, token?: string) {
  const repos: GitHubRepo[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const nextPage = await githubFetch<GitHubRepo[]>(
      `/users/${username}/repos?sort=updated&per_page=100&page=${page}`,
      token
    );
    repos.push(...nextPage);

    if (nextPage.length < 100) {
      break;
    }
  }

  return repos;
}

async function fetchReadmeExcerpt(owner: string, repo: string, token?: string) {
  const response = await fetch(`${githubApi}/repos/${owner}/${repo}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    return "";
  }

  const content = await response.text();
  return content.slice(0, 1200);
}

async function fetchLanguages(owner: string, repo: string, token?: string) {
  const response = await fetch(`${githubApi}/repos/${owner}/${repo}/languages`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as GitHubLanguages;
  return Object.keys(payload);
}

export async function fetchGitHubContext(
  username: string,
  bindings: AppBindings = {}
): Promise<{ repos: RepoContext[]; projects: Project[] }> {
  const token = getConfig(bindings).githubToken;
  const repos = (await githubFetchAllRepos(username, token)).filter((repo) => !repo.fork);

  const repoContexts = await Promise.all(
    repos.map(async (repo) => {
      const [readmeExcerpt, languages] = await Promise.all([
        fetchReadmeExcerpt(username, repo.name, token),
        fetchLanguages(username, repo.name, token)
      ]);
      const allLanguages = Array.from(new Set([repo.language, ...languages].filter(Boolean))) as string[];
      const category = buildProjectCategory(repo, allLanguages, readmeExcerpt);

      const context: RepoContext = {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage,
        topics: repo.topics ?? [],
        language: repo.language,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        languages: allLanguages,
        category,
        readmeExcerpt
      };

      return context;
    })
  );

  const projects: Project[] = repoContexts.map((repo) => ({
    id: `github-project-${repo.id}`,
    title: repo.name,
    category: repo.category,
    summary: buildProjectSummary(
      {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.url,
        homepage: repo.homepage,
        topics: repo.topics,
        language: repo.language,
        fork: false,
        archived: false,
        created_at: repo.createdAt,
        updated_at: repo.updatedAt,
        pushed_at: repo.pushedAt
      },
      repo.readmeExcerpt ?? "",
      repo.category
    ),
    technologies: repo.languages,
    startedAt: repo.createdAt,
    lastActiveAt: repo.pushedAt || repo.updatedAt,
    developmentDuration: formatDuration(repo.createdAt, repo.pushedAt || repo.updatedAt),
    repoUrl: repo.url,
    homepageUrl: repo.homepage ?? "",
    highlights: buildProjectHighlights(
      {
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.url,
        homepage: repo.homepage,
        topics: repo.topics,
        language: repo.language,
        fork: false,
        archived: false,
        created_at: repo.createdAt,
        updated_at: repo.updatedAt,
        pushed_at: repo.pushedAt
      },
      repo.languages,
      repo.category
    )
  }));

  return { repos: repoContexts, projects };
}
