import type { D1DatabaseBinding } from "./bindings.js";

export type CatalogKind = "skill" | "technology";

type CatalogSearchResult = {
  id: number;
  name: string;
  kind: CatalogKind;
  status: "permanent" | "candidate";
  aliases: string[];
};

const PROMOTION_THRESHOLD = 50;
const CANDIDATE_TTL_DAYS = 7;

const technologyDefaults = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C#",
  "Go",
  "Rust",
  "C++",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "React",
  "Vue",
  "Angular",
  "Next.js",
  "Nuxt",
  "Node.js",
  "Express",
  "Hono",
  "Django",
  "Flask",
  "FastAPI",
  ".NET",
  "Spring Boot",
  "Laravel",
  "Tailwind CSS",
  "PostgreSQL",
  "MySQL",
  "SQLite",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST APIs",
  "Docker",
  "Kubernetes",
  "Terraform",
  "AWS",
  "Azure",
  "Google Cloud",
  "Cloudflare",
  "GitHub Actions",
  "CI/CD",
  "Linux",
  "React Native",
  "Flutter",
  "Figma",
  "Playwright",
  "Jest",
  "Pandas"
] as const;

const skillDefaults = [
  "Communication",
  "Leadership",
  "Problem Solving",
  "Critical Thinking",
  "Collaboration",
  "Teamwork",
  "Project Management",
  "Product Thinking",
  "Customer Empathy",
  "Analytical Thinking",
  "Adaptability",
  "Time Management",
  "Stakeholder Management",
  "Presentation Skills",
  "Technical Writing",
  "Mentoring",
  "Coaching",
  "Research",
  "Strategy",
  "Planning",
  "Execution",
  "Decision Making",
  "Attention to Detail",
  "Quality Assurance",
  "Testing",
  "Debugging",
  "System Design",
  "Architecture",
  "API Design",
  "Data Analysis",
  "Data Visualization",
  "Machine Learning",
  "Automation",
  "Scripting",
  "DevOps",
  "Security Awareness",
  "Accessibility",
  "UX Thinking",
  "Design Systems",
  "Agile",
  "Scrum",
  "Cross-functional Leadership",
  "Conflict Resolution",
  "Negotiation",
  "Requirements Gathering",
  "Documentation",
  "Public Speaking",
  "Interviewing",
  "Prioritization",
  "Continuous Improvement"
] as const;

const synonymMap = new Map<string, string>([
  ["azure", "azure"],
  ["microsoft azure", "azure"],
  ["aws", "aws"],
  ["amazon web services", "aws"],
  ["gcp", "google cloud"],
  ["google cloud", "google cloud"],
  ["google cloud platform", "google cloud"],
  ["javascript", "javascript"],
  ["js", "javascript"],
  ["typescript", "typescript"],
  ["ts", "typescript"],
  ["node", "node js"],
  ["nodejs", "node js"],
  ["node js", "node js"],
  ["c sharp", "c#"],
  ["c#", "c#"],
  ["dot net", ".net"],
  ["dotnet", ".net"],
  [".net", ".net"]
]);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeCatalogTerm(value: string) {
  const cleaned = normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[()[\]{}.,/\\:_-]+/g, " ")
  );

  return synonymMap.get(cleaned) ?? cleaned;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function expirationDate() {
  return new Date(Date.now() + CANDIDATE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

async function ensureCatalogTables(db: D1DatabaseBinding) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS catalog_terms (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, canonical_name TEXT NOT NULL, canonical_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'permanent', usage_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, expires_at TEXT, UNIQUE(kind, canonical_key))"
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS catalog_aliases (id INTEGER PRIMARY KEY AUTOINCREMENT, term_id INTEGER NOT NULL, kind TEXT NOT NULL, alias_name TEXT NOT NULL, alias_key TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(kind, alias_key))"
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS catalog_adoptions (id INTEGER PRIMARY KEY AUTOINCREMENT, term_id INTEGER NOT NULL, user_key TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(term_id, user_key))"
  ).run();
}

async function seedDefaults(db: D1DatabaseBinding) {
  const defaults: Array<{ kind: CatalogKind; name: string }> = [
    ...skillDefaults.map((name) => ({ kind: "skill" as const, name })),
    ...technologyDefaults.map((name) => ({ kind: "technology" as const, name }))
  ];

  for (const item of defaults) {
    const key = normalizeCatalogTerm(item.name);
    const now = new Date().toISOString();
    await db
      .prepare(
        "INSERT OR IGNORE INTO catalog_terms (kind, canonical_name, canonical_key, status, usage_count, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'permanent', 0, ?, ?, NULL)"
      )
      .bind(item.kind, item.name, key, now, now)
      .run();

    const term = await db
      .prepare("SELECT id FROM catalog_terms WHERE kind = ? AND canonical_key = ?")
      .bind(item.kind, key)
      .first<{ id: number }>();

    if (term) {
      await db
        .prepare(
          "INSERT OR IGNORE INTO catalog_aliases (term_id, kind, alias_name, alias_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(term.id, item.kind, item.name, key, now, now)
        .run();
    }
  }
}

export async function ensureCatalog(db?: D1DatabaseBinding) {
  if (!db) {
    return;
  }

  await ensureCatalogTables(db);
  await seedDefaults(db);
}

export async function pruneExpiredCatalogTerms(db?: D1DatabaseBinding) {
  if (!db) {
    return;
  }

  await db
    .prepare("DELETE FROM catalog_terms WHERE status = 'candidate' AND expires_at IS NOT NULL AND expires_at <= ?")
    .bind(new Date().toISOString())
    .run();
}

async function findTermByAlias(db: D1DatabaseBinding, kind: CatalogKind, aliasKey: string) {
  return db
    .prepare(
      "SELECT t.id, t.canonical_name, t.status FROM catalog_aliases a JOIN catalog_terms t ON t.id = a.term_id WHERE a.kind = ? AND a.alias_key = ? LIMIT 1"
    )
    .bind(kind, aliasKey)
    .first<{ id: number; canonical_name: string; status: "permanent" | "candidate" }>();
}

async function countAdoptions(db: D1DatabaseBinding, termId: number) {
  const row = await db
    .prepare("SELECT COUNT(*) AS count FROM catalog_adoptions WHERE term_id = ?")
    .bind(termId)
    .first<{ count: number | string }>();

  return Number(row?.count ?? 0);
}

async function upsertAlias(db: D1DatabaseBinding, termId: number, kind: CatalogKind, originalName: string, aliasKey: string) {
  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT OR IGNORE INTO catalog_aliases (term_id, kind, alias_name, alias_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(termId, kind, originalName, aliasKey, now, now)
    .run();
}

async function markAdoption(db: D1DatabaseBinding, termId: number, userKey: string) {
  const now = new Date().toISOString();
  await db
    .prepare("INSERT OR IGNORE INTO catalog_adoptions (term_id, user_key, created_at) VALUES (?, ?, ?)")
    .bind(termId, userKey, now)
    .run();
}

export async function resolveCatalogTerm(
  db: D1DatabaseBinding | undefined,
  kind: CatalogKind,
  value: string,
  userKey: string
) {
  const trimmed = normalizeWhitespace(value);
  const aliasKey = normalizeCatalogTerm(trimmed);

  if (!trimmed) {
    throw new Error("A value is required.");
  }

  if (!db) {
    return { name: trimmed, status: "candidate" as const, promoted: false };
  }

  await ensureCatalog(db);
  await pruneExpiredCatalogTerms(db);

  const existing = await findTermByAlias(db, kind, aliasKey);

  if (existing) {
    await upsertAlias(db, existing.id, kind, trimmed, aliasKey);
    await markAdoption(db, existing.id, userKey);
    const adoptionCount = await countAdoptions(db, existing.id);
    const promoted = existing.status === "candidate" && adoptionCount >= PROMOTION_THRESHOLD;

    if (promoted) {
      await db
        .prepare("UPDATE catalog_terms SET status = 'permanent', expires_at = NULL, updated_at = ?, usage_count = ? WHERE id = ?")
        .bind(new Date().toISOString(), adoptionCount, existing.id)
        .run();
    } else {
      await db
        .prepare("UPDATE catalog_terms SET updated_at = ?, usage_count = ? WHERE id = ?")
        .bind(new Date().toISOString(), adoptionCount, existing.id)
        .run();
    }

    return {
      name: existing.canonical_name,
      status: promoted ? ("permanent" as const) : existing.status,
      promoted
    };
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      "INSERT INTO catalog_terms (kind, canonical_name, canonical_key, status, usage_count, created_at, updated_at, expires_at) VALUES (?, ?, ?, 'candidate', 1, ?, ?, ?)"
    )
    .bind(kind, trimmed, aliasKey, now, now, expirationDate())
    .run();

  const created = await db
    .prepare("SELECT id, canonical_name FROM catalog_terms WHERE kind = ? AND canonical_key = ?")
    .bind(kind, aliasKey)
    .first<{ id: number; canonical_name: string }>();

  if (!created) {
    throw new Error("Unable to create catalog term.");
  }

  await upsertAlias(db, created.id, kind, trimmed, aliasKey);
  await markAdoption(db, created.id, userKey);

  return {
    name: created.canonical_name,
    status: "candidate" as const,
    promoted: false
  };
}

export async function searchCatalog(db: D1DatabaseBinding | undefined, kind: CatalogKind, query: string) {
  const normalizedQuery = normalizeCatalogTerm(query);

  if (!db) {
    const defaults = kind === "skill" ? [...skillDefaults] : [...technologyDefaults];
    return defaults
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20)
      .map((item, index) => ({
        id: index + 1,
        name: item,
        kind,
        status: "permanent" as const,
        aliases: [item]
      }));
  }

  await ensureCatalog(db);
  await pruneExpiredCatalogTerms(db);

  const rows = await db
    .prepare(
      `SELECT
        t.id,
        t.canonical_name AS name,
        t.kind,
        t.status,
        GROUP_CONCAT(a.alias_name, '||') AS aliases
      FROM catalog_terms t
      LEFT JOIN catalog_aliases a ON a.term_id = t.id
      WHERE t.kind = ?
        AND t.status = 'permanent'
        AND (
          t.canonical_name LIKE ?
          OR t.canonical_key LIKE ?
          OR a.alias_name LIKE ?
          OR a.alias_key LIKE ?
        )
      GROUP BY t.id, t.canonical_name, t.kind, t.status
      ORDER BY
        CASE WHEN t.canonical_key = ? THEN 0 ELSE 1 END,
        CASE WHEN t.canonical_name LIKE ? THEN 0 ELSE 1 END,
        t.canonical_name ASC
      LIMIT 20`
    )
    .bind(kind, `%${query}%`, `%${normalizedQuery}%`, `%${query}%`, `%${normalizedQuery}%`, normalizedQuery, `${query}%`)
    .all<{
      id: number;
      name: string;
      kind: CatalogKind;
      status: "permanent" | "candidate";
      aliases: string | null;
    }>();

  return rows.results.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    status: row.status,
    aliases: uniqueValues((row.aliases ?? "").split("||"))
  })) satisfies CatalogSearchResult[];
}
