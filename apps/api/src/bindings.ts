export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1DatabaseBinding {
  prepare(query: string): D1PreparedStatement;
}

export interface R2BucketBinding {
  put(key: string, value: ArrayBuffer | ArrayBufferView | string | Blob): Promise<unknown>;
}

export type AppBindings = {
  APP_DB?: D1DatabaseBinding;
  RESUME_BUCKET?: R2BucketBinding;
  AUTH_PASSWORD?: string;
  AUTH_SECRET?: string;
  GITHUB_TOKEN?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_BASE_URL?: string;
  APP_ORIGIN?: string;
  API_ORIGIN?: string;
  COOKIE_SECURE?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
};
