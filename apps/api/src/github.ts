import type { RepoContext } from "./types.js";

const githubApi = "https://api.github.com";

type GitHubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language: string | null;
};

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

export async function fetchGitHubContext(username: string, token?: string): Promise<RepoContext[]> {
  const repos = await githubFetch<GitHubRepo[]>(
    `/users/${username}/repos?sort=updated&per_page=8`,
    token
  );

  return Promise.all(
    repos.map(async (repo) => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      homepage: repo.homepage,
      topics: repo.topics ?? [],
      language: repo.language,
      readmeExcerpt: await fetchReadmeExcerpt(username, repo.name, token)
    }))
  );
}
