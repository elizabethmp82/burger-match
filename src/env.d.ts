/** Tipos das variáveis de ambiente lidas pelo app (veja .env.example). */
interface ImportMetaEnv {
  /** "geoapify" (padrão), "overpass" ou "mock" (modo demonstração). */
  readonly VITE_PLACES_PROVIDER?: string
  /** Chave da Geoapify (pública; restrinja aos domínios do app no painel da Geoapify). */
  readonly VITE_GEOAPIFY_API_KEY?: string
  /** Estilo do mapa MapLibre (opcional; padrão: OpenFreeMap "liberty"). */
  readonly VITE_MAP_STYLE_URL?: string
  /** Servidor da Overpass API (opcional; padrão: overpass-api.de). */
  readonly VITE_OVERPASS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
