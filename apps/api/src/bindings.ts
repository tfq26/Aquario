export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
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
};
