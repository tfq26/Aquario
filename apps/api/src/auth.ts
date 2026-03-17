import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import type { Context, Next } from "hono";
import type { AppBindings } from "./bindings.js";
import { getConfig } from "./config.js";

const sessionCookieName = "aquario_session";
const oauthStateCookieName = "aquario_oauth_state";
const encoder = new TextEncoder();

export type AuthProvider = "password" | "github" | "google";

type SessionPayload = {
  exp: number;
  provider: AuthProvider;
  email?: string;
  name?: string;
  avatarUrl?: string;
};

type OAuthStatePayload = {
  provider: Extract<AuthProvider, "github" | "google">;
  exp: number;
};

function toBase64Url(bytes: Uint8Array) {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  return Uint8Array.from(Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
}

async function importKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signValue(value: string, secret: string) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string, signature: string, secret: string) {
  const key = await importKey(secret);
  return crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(value));
}

function getBearerToken(c: Context<{ Bindings: AppBindings }>) {
  const authorization = c.req.header("Authorization");

  if (!authorization) {
    return null;
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function createSignedToken<T extends { exp: number }>(payload: T, secret: string) {
  const payloadValue = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await signValue(payloadValue, secret);
  return `${payloadValue}.${signature}`;
}

export async function readSignedToken<T extends { exp: number }>(token: string, secret: string) {
  const [payloadValue, signature] = token.split(".");

  if (!payloadValue || !signature) {
    return null;
  }

  const valid = await verifyValue(payloadValue, signature, secret);

  if (!valid) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(fromBase64Url(payloadValue)).toString("utf8")) as T;

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function hasValidSession(c: Context<{ Bindings: AppBindings }>) {
  return Boolean(await readSession(c));
}

export async function readSession(c: Context<{ Bindings: AppBindings }>) {
  const config = getConfig(c.env);

  if (!config.authSecret) {
    return null;
  }

  const token = getBearerToken(c) ?? getCookie(c, sessionCookieName);

  if (!token) {
    return null;
  }

  return readSignedToken<SessionPayload>(token, config.authSecret);
}

function resolveCookieSecure(c: Context<{ Bindings: AppBindings }>) {
  const config = getConfig(c.env);

  if (config.cookieSecure) {
    return true;
  }

  return new URL(c.req.url).protocol === "https:";
}

function resolveCookieSameSite(c: Context<{ Bindings: AppBindings }>) {
  const config = getConfig(c.env);
  const url = new URL(c.req.url);

  // Always use Lax on localhost to avoid SameSite=None requirements (which need HTTPS/Secure).
  // This works well with the Vite proxy as the cookie will be seen as same-origin by the browser.
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return "Lax" as const;
  }

  if (!config.appOrigin || !config.apiOrigin) {
    return "Lax" as const;
  }

  try {
    const appUrl = new URL(config.appOrigin);
    const apiUrl = new URL(config.apiOrigin);

    if (appUrl.origin !== apiUrl.origin) {
      return "None" as const;
    }
  } catch {
    return "Lax" as const;
  }

  return "Lax" as const;
}

export async function requireAuth(c: Context<{ Bindings: AppBindings }>, next: Next) {
  const config = getConfig(c.env);

  if (!config.authSecret) {
    return c.json(
      {
        error: "Authentication is not configured. Set AUTH_SECRET and at least one auth provider."
      },
      500
    );
  }

  if (!(await readSession(c))) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
}

export async function issueSessionToken(
  c: Context<{ Bindings: AppBindings }>,
  remember: boolean,
  session: Omit<SessionPayload, "exp">
) {
  const config = getConfig(c.env);
  const maxAge = remember ? 60 * 60 * 24 * 14 : 60 * 60 * 12;

  return createSignedToken<SessionPayload>(
    {
      ...session,
      exp: Math.floor(Date.now() / 1000) + maxAge
    },
    config.authSecret
  );
}

export async function setSessionCookie(
  c: Context<{ Bindings: AppBindings }>,
  remember: boolean,
  session: Omit<SessionPayload, "exp">
) {
  const maxAge = remember ? 60 * 60 * 24 * 14 : 60 * 60 * 12;
  const token = await issueSessionToken(c, remember, session);

  setCookie(c, sessionCookieName, token, {
    httpOnly: true,
    sameSite: resolveCookieSameSite(c),
    secure: resolveCookieSecure(c),
    path: "/",
    maxAge
  });
}

export function clearSessionCookie(c: Context<{ Bindings: AppBindings }>) {
  deleteCookie(c, sessionCookieName, {
    path: "/"
  });
}

export async function setOAuthStateCookie(
  c: Context<{ Bindings: AppBindings }>,
  provider: Extract<AuthProvider, "github" | "google">
) {
  const config = getConfig(c.env);
  const maxAge = 60 * 10;
  const token = await createSignedToken<OAuthStatePayload>(
    {
      provider,
      exp: Math.floor(Date.now() / 1000) + maxAge
    },
    config.authSecret
  );

  setCookie(c, oauthStateCookieName, token, {
    httpOnly: true,
    sameSite: resolveCookieSameSite(c),
    secure: resolveCookieSecure(c),
    path: "/",
    maxAge
  });
}

export async function readOAuthState(
  c: Context<{ Bindings: AppBindings }>,
  expectedProvider: Extract<AuthProvider, "github" | "google">
) {
  const config = getConfig(c.env);
  const token = getCookie(c, oauthStateCookieName);

  if (!token) {
    return null;
  }

  const payload = await readSignedToken<OAuthStatePayload>(token, config.authSecret);

  if (!payload || payload.provider !== expectedProvider) {
    return null;
  }

  return payload;
}

export function clearOAuthStateCookie(c: Context<{ Bindings: AppBindings }>) {
  deleteCookie(c, oauthStateCookieName, {
    path: "/"
  });
}
