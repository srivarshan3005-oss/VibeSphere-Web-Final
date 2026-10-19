/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Spring Boot API base URL including the /api context path. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
