import type { AppBindings } from "./bindings.js";

function readNodeEnv(name: string) {
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

export function getConfig(bindings: AppBindings = {}) {
  return {
    authPassword: bindings.AUTH_PASSWORD ?? readNodeEnv("AUTH_PASSWORD") ?? "",
    authSecret: bindings.AUTH_SECRET ?? readNodeEnv("AUTH_SECRET") ?? "",
    githubToken: bindings.GITHUB_TOKEN ?? readNodeEnv("GITHUB_TOKEN") ?? "",
    geminiApiKey: bindings.GEMINI_API_KEY ?? readNodeEnv("GEMINI_API_KEY") ?? "",
    geminiModel: bindings.GEMINI_MODEL ?? readNodeEnv("GEMINI_MODEL") ?? "gemini-2.5-flash",
    geminiBaseUrl:
      bindings.GEMINI_BASE_URL ?? readNodeEnv("GEMINI_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta",
    appOrigin: bindings.APP_ORIGIN ?? readNodeEnv("APP_ORIGIN") ?? "",
    apiOrigin: bindings.API_ORIGIN ?? readNodeEnv("API_ORIGIN") ?? "",
    cookieSecure: (bindings.COOKIE_SECURE ?? readNodeEnv("COOKIE_SECURE") ?? "").toLowerCase() === "true",
    googleClientId: bindings.GOOGLE_CLIENT_ID ?? readNodeEnv("GOOGLE_CLIENT_ID") ?? "",
    googleClientSecret: bindings.GOOGLE_CLIENT_SECRET ?? readNodeEnv("GOOGLE_CLIENT_SECRET") ?? "",
    githubClientId: bindings.GITHUB_CLIENT_ID ?? readNodeEnv("GITHUB_CLIENT_ID") ?? "",
    githubClientSecret: bindings.GITHUB_CLIENT_SECRET ?? readNodeEnv("GITHUB_CLIENT_SECRET") ?? ""
  };
}
