/** Tipos das variáveis de ambiente lidas pelo app (veja .env.example). */
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
