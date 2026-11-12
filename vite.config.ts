import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
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

// https://vite.dev/config/ · testes: https://vitest.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const gtmId = env.VITE_GTM_ID?.trim() || DEFAULT_GTM_ID

  return {
    plugins: [react(), tailwindcss(), googleTagManager(gtmId)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['src/**/*.test.ts'],
      environment: 'node',
    },
  }
})
