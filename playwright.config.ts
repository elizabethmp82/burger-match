import { defineConfig, devices } from '@playwright/test'

/**
 * Testes E2E (ponta a ponta): o app inteiro roda num navegador de verdade.
 * https://playwright.dev/docs/test-configuration
 *
 * - Roda o BUILD DE PRODUÇÃO (vite build + vite preview), como o usuário recebe.
 * - MODO DEMONSTRAÇÃO (VITE_PLACES_PROVIDER=mock): hamburguerias simuladas, sem
 *   gastar créditos da Geoapify nem depender da internet.
 * - Pedidos para fora do app são bloqueados nos testes (veja e2e/fixtures.ts).
 */
const PORT = 4180
const BASE_URL = `http://localhost:${PORT}`
const isCI = Boolean(process.env.CI)

/** Posição simulada do "GPS": centro de Pinheiros (São Paulo). */
const E2E_COORDINATES = { latitude: -23.5667, longitude: -46.6929 }

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  // No CI, um test.only esquecido faz a execução falhar.
  forbidOnly: isCI,
  // Uma nova tentativa só no CI (máquinas compartilhadas às vezes ficam lentas).
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    geolocation: E2E_COORDINATES,
    // Service worker desligado: cada teste começa "limpo". O teste do PWA liga de novo.
    serviceWorkers: 'block',
    // "Usar minha localização" já autorizado (o teste da recusa tira a permissão).
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    // 1280 px: layout de desktop completo (barra lateral, painéis ao lado).
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    // Celular (Chromium com tela e toque de um Pixel 7): layout aprovado do celular.
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    // Só o vite build (os tipos já são conferidos pelo "npm run typecheck").
    command: `npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: {
      VITE_PLACES_PROVIDER: 'mock',
      // Contêiner de teste: o GTM nunca recebe visitas dos testes (e o pedido é bloqueado).
      VITE_GTM_ID: 'GTM-E2ETEST',
      VITE_GEOAPIFY_API_KEY: '',
    },
  },
})
