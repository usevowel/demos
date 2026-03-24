/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VOWEL_APP_ID?: string
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
