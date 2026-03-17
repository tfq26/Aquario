import type { Context } from "hono";
import type { AppBindings } from "./bindings.js";
import { getConfig } from "./config.js";

export type OAuthProvider = "github" | "google";

type OAuthUser = {
  email?: string;
  name?: string;
  avatarUrl?: string;
};

function getBaseUrl(c: Context<{ Bindings: AppBindings }>) {
  const config = getConfig(c.env);
  const url = new URL(c.req.url);

  if (config.apiOrigin) {
    return config.apiOrigin;
  }

  if (url.hostname === "127.0.0.1") {
    return `${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`;
  }

  return url.origin;
}

export function getOAuthProviders(c: Context<{ Bindings: AppBindings }>) {
  const config = getConfig(c.env);

  return {
    password: Boolean(config.authPassword && config.authSecret),
    github: Boolean(config.authSecret && config.githubClientId && config.githubClientSecret),
    google: Boolean(config.authSecret && config.googleClientId && config.googleClientSecret)
  };
}

export function getOAuthRedirectUrl(c: Context<{ Bindings: AppBindings }>, provider: OAuthProvider) {
  const config = getConfig(c.env);
  const baseUrl = getBaseUrl(c);

  // If we're using a proxy in development (APP_ORIGIN is localhost but API is on another port),
  // we must redirect back to the app's origin so the browser sends the state cookie.
  if (
    config.appOrigin &&
    (config.appOrigin.includes("localhost") || config.appOrigin.includes("127.0.0.1")) &&
    !baseUrl.includes(new URL(config.appOrigin).port)
  ) {
    return `${config.appOrigin}/api/auth/${provider}/callback`;
  }

  return `${baseUrl}/api/auth/${provider}/callback`;
}

export function buildAuthorizationUrl(c: Context<{ Bindings: AppBindings }>, provider: OAuthProvider) {
  const config = getConfig(c.env);
  const redirectUri = getOAuthRedirectUrl(c, provider);

  if (provider === "github") {
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", config.githubClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "read:user user:email");
    return url.toString();
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.googleClientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

async function exchangeGithubCode(c: Context<{ Bindings: AppBindings }>, code: string) {
  const config = getConfig(c.env);
  const redirectUri = getOAuthRedirectUrl(c, "github");
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    throw new Error("GitHub token exchange failed.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error("GitHub token exchange returned no access token.");
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  if (!profileResponse.ok) {
    throw new Error("GitHub profile request failed.");
  }

  const profile = (await profileResponse.json()) as { name?: string; avatar_url?: string; email?: string };
  let email = profile.email;

  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenPayload.access_token}`
      }
    });

    if (emailsResponse.ok) {
      const emails = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;
    }
  }

  return {
    email,
    name: profile.name,
    avatarUrl: profile.avatar_url
  } satisfies OAuthUser;
}

async function exchangeGoogleCode(c: Context<{ Bindings: AppBindings }>, code: string) {
  const config = getConfig(c.env);
  const redirectUri = getOAuthRedirectUrl(c, "google");
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed.");
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };

  if (!tokenPayload.access_token) {
    throw new Error("Google token exchange returned no access token.");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`
    }
  });

  if (!profileResponse.ok) {
    throw new Error("Google profile request failed.");
  }

  const profile = (await profileResponse.json()) as { email?: string; name?: string; picture?: string };

  return {
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture
  } satisfies OAuthUser;
}

export async function exchangeCodeForUser(
  c: Context<{ Bindings: AppBindings }>,
  provider: OAuthProvider,
  code: string
) {
  if (provider === "github") {
    return exchangeGithubCode(c, code);
  }

  return exchangeGoogleCode(c, code);
}

export function buildAppRedirect(
  c: Context<{ Bindings: AppBindings }>,
  success: boolean,
  message?: string,
  token?: string
) {
  const config = getConfig(c.env);
  const base = config.appOrigin || new URL(c.req.url).origin;
  const url = new URL(base);

  const hashParams = new URLSearchParams();
  hashParams.set("auth", success ? "success" : "error");

  if (message) {
    hashParams.set("message", message);
  }

  if (token) {
    hashParams.set("token", token);
  }

  url.hash = hashParams.toString();

  return url.toString();
}
