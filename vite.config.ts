import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** Contêiner do Google Tag Manager. Pode ser trocado por VITE_GTM_ID (vazio = padrão). */
const DEFAULT_GTM_ID = 'GTM-MCGKVLLR'

/**
 * Insere a tag do Google Tag Manager no <head> — SÓ no build de produção.
 * Em desenvolvimento (npm run dev) a tag não carrega: testes locais não viram
 * visitas falsas nos relatórios. Para conferir: npm run build && npm run preview.
 */
function googleTagManager(gtmId: string): Plugin {
  // Só aceita o formato oficial: nada de texto livre dentro de um <script>.
  if (!/^GTM-[A-Z0-9]{4,12}$/.test(gtmId)) {
    throw new Error(`[gtm] ID inválido: "${gtmId}". Formato esperado: GTM-XXXXXXX`)
  }
  return {
    name: 'burgermatch:google-tag-manager',
    apply: 'build',
    transformIndexHtml: () => [
      {
        tag: 'script',
        attrs: { async: true, src: `https://www.googletagmanager.com/gtm.js?id=${gtmId}` },
        injectTo: 'head-prepend',
      },
      {
        tag: 'script',
        children: [
          'window.dataLayer = window.dataLayer || [];',
          'function gtag(){dataLayer.push(arguments);}',
          "gtag('js', new Date());",
        ].join('\n'),
        injectTo: 'head-prepend',
      },
    ],
  }
}

/** Mesmo endereço padrão de src/config/env.ts (estilo e tiles do mapa). */
const OPENFREEMAP_ORIGIN = 'https://tiles.openfreemap.org'
const DAY_SECONDS = 24 * 60 * 60

/**
 * PWA: manifest (instalar o app) + service worker gerado pelo Workbox.
 * https://vite-pwa-org.netlify.app/
 *
 * Cache:
 * - app (HTML, JS, CSS, fontes, ícones): pré-carregado na instalação → abre offline;
 * - mapa (OpenFreeMap): estilo/fontes/sprites e tiles já vistos ficam guardados;
 * - dados (Geoapify, Nominatim, Overpass): NÃO passam pelo service worker. Já há
 *   cache da sessão (sessionStorage) e as regras de cada serviço são respeitadas lá.
 */
function pwa() {
  return VitePWA({
    // Registro feito pelo componente UpdatePrompt (avisa quando há versão nova).
    injectRegister: false,
    registerType: 'prompt',
    // Os ícones já entram pelo globPatterns do Workbox (evita entradas repetidas).
    includeManifestIcons: false,
    manifest: {
      name: 'BurgerMatch',
      short_name: 'BurgerMatch',
      description: 'Encontre sua hamburgueria ideal.',
      lang: 'pt-BR',
      dir: 'ltr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      theme_color: '#FFF4E0',
      background_color: '#FFF4E0',
      categories: ['food', 'lifestyle', 'travel'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2,png,webp,svg}'],
      globIgnores: [
        // Fontes de outros alfabetos: só baixadas se algum texto precisar delas.
        '**/*-vietnamese-*',
        '**/*-latin-ext-*',
        // MapLibre (~1,5 MB): fica fora da instalação para não pesar no 4G de quem
        // nunca abre o mapa. É guardado na 1ª vez que o mapa abre (regra abaixo).
        '**/maplibre-*',
      ],
      navigateFallback: '/index.html',
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          // Arquivos do próprio app com hash no nome (nunca mudam): MapLibre e seu worker.
          urlPattern: ({ url, sameOrigin }) =>
            sameOrigin && url.pathname.startsWith('/assets/maplibre-'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'app-map-library',
            expiration: { maxEntries: 10 },
          },
        },
        {
          // Tiles vetoriais: mudam pouco; até 7 dias e 600 tiles (~poucos MB).
          urlPattern: ({ url }) =>
            url.origin === OPENFREEMAP_ORIGIN && url.pathname.endsWith('.pbf'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'map-tiles',
            expiration: { maxEntries: 600, maxAgeSeconds: 7 * DAY_SECONDS },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          // Estilo, fontes e ícones do mapa: usa o guardado e atualiza em segundo plano.
          urlPattern: ({ url }) => url.origin === OPENFREEMAP_ORIGIN,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'map-style',
            expiration: { maxEntries: 80, maxAgeSeconds: 30 * DAY_SECONDS },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  })
}

// https://vite.dev/config/ · testes: https://vitest.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const gtmId = env.VITE_GTM_ID?.trim() || DEFAULT_GTM_ID

  return {
    plugins: [react(), tailwindcss(), googleTagManager(gtmId), pwa()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          // Nome fixo para o pedaço do MapLibre (o service worker o trata à parte).
          codeSplitting: { groups: [{ name: 'maplibre', test: /node_modules[\\/]maplibre-gl/ }] },
        },
      },
      // O MapLibre (~1 MB) é carregado só nas telas com mapa (lazy): aviso esperado.
      chunkSizeWarningLimit: 1100,
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
