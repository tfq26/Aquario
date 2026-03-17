const authTokenStorageKey = "aquario_auth_token";

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(authTokenStorageKey) ?? "";
}

export function setStoredAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(authTokenStorageKey, token);
  } else {
    window.localStorage.removeItem(authTokenStorageKey);
  }
}

export function createAuthorizedHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const token = getStoredAuthToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}
