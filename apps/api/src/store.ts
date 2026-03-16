import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppBindings } from "./bindings.js";
import type { AppData } from "./types.js";

const dataDir = path.resolve(process.cwd(), "data");
const dataFile = path.join(dataDir, "app-data.json");

const defaultData: AppData = {
  profile: {
    fullName: "",
    headline: "",
    summary: "",
    email: "",
    address: "",
    skills: [],
    experience: [],
    links: [],
    githubUsername: "",
    githubUrl: "",
    notes: ""
  },
  job: {
    companyName: "",
    roleTitle: "",
    jobDescription: "",
    hiringManagerNotes: ""
  },
  repos: [],
  resumeAsset: null,
  generated: []
};

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

async function ensureD1Store(bindings: AppBindings) {
  if (!bindings.APP_DB) {
    return;
  }

  await bindings.APP_DB.prepare(
    "CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, json TEXT NOT NULL, updated_at TEXT NOT NULL)"
  ).run();
}

function normalizeData(parsed: AppData & { profile?: AppData["profile"] & { location?: string } }) {
  if (parsed.profile && !parsed.profile.address && parsed.profile.location) {
    parsed.profile.address = parsed.profile.location;
  }

  return parsed as AppData;
}

export async function readStore(bindings: AppBindings = {}): Promise<AppData> {
  if (bindings.APP_DB) {
    await ensureD1Store(bindings);
    const row = await bindings.APP_DB.prepare("SELECT json FROM app_state WHERE id = ?").bind("default").first<{ json: string }>();

    if (!row?.json) {
      await writeStore(defaultData, bindings);
      return defaultData;
    }

    return normalizeData(JSON.parse(row.json) as AppData & { profile?: AppData["profile"] & { location?: string } });
  }

  await ensureStore();
  const raw = await readFile(dataFile, "utf8");
  return normalizeData(
    JSON.parse(raw) as AppData & {
      profile?: AppData["profile"] & { location?: string };
    }
  );
}

export async function writeStore(data: AppData, bindings: AppBindings = {}) {
  if (bindings.APP_DB) {
    await ensureD1Store(bindings);
    await bindings.APP_DB.prepare(
      "INSERT INTO app_state (id, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at"
    )
      .bind("default", JSON.stringify(data), new Date().toISOString())
      .run();
    return;
  }

  await ensureStore();
  await writeFile(dataFile, JSON.stringify(data, null, 2), "utf8");
}
