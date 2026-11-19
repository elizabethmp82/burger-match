import { test as base, expect, type Page } from '@playwright/test'

/**
 * Base de todos os testes E2E.
 *
 * Bloqueia qualquer pedido para fora do app (GTM, Geoapify, Nominatim, tiles do
 * mapa...): os testes não dependem da internet, não gastam créditos e não viram
 * visitas no Analytics. Os endereços bloqueados ficam em `externalRequests`.
 */
export const test = base.extend<{ externalRequests: string[] }>({
  externalRequests: async ({ context }, provide) => {
    const blocked: string[] = []
    await context.route(
      (url) => url.hostname !== 'localhost',
      (route) => {
        blocked.push(route.request().url())
        return route.abort('blockedbyclient')
      },
    )
    await provide(blocked)
  },
  // Toda página já nasce com o bloqueio ativo.
  page: async ({ page, externalRequests }, provide) => {
    void externalRequests
    await provide(page)
  },
})

export { expect }

/** O projeto atual simula um celular? (layout com barra de navegação embaixo) */
export function isMobile(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768
}

/**
 * Passa pelas Boas-vindas e escolhe a localização pelo "GPS" simulado.
 * A localização fica só na memória da aba (não é salva): cada teste começa aqui.
 */
export async function startWithMyLocation(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('link', { name: 'Começar agora' }).click()
  await expect(page.getByRole('heading', { name: 'Onde você está?' })).toBeVisible()
  await page.getByRole('button', { name: 'Usar minha localização' }).click()
  await expect(page).toHaveURL(/\/discover$/)
}

/** Chave dos favoritos no modo demonstração (src/services/storage/favoritesStorage.ts). */
const DEMO_FAVORITES_KEY = 'burgermatch:favorites:demo:v1'

/**
 * Define os favoritos salvos e recarrega a página.
 * Sem nada salvo, o modo demonstração começa com 4 favoritas de exemplo.
 */
export async function setSavedFavorites(page: Page, ids: readonly string[]): Promise<void> {
  await page.evaluate(([key, value]) => localStorage.setItem(key, value), [
    DEMO_FAVORITES_KEY,
    JSON.stringify({ version: 1, ids }),
  ] as const)
  await page.reload()
}

/** Card do topo do baralho (o único <article> com nome na tela Descobrir). */
export function topCard(page: Page) {
  return page.locator('article[aria-label]').first()
}

/** Nome da hamburgueria do card do topo. */
export async function topCardName(page: Page): Promise<string> {
  const name = await topCard(page).getAttribute('aria-label')
  if (!name) throw new Error('Nenhum card na tela Descobrir.')
  return name
}

/** Navegação principal: barra de baixo (celular) ou barra lateral (tablet/desktop). */
export async function goToTab(page: Page, label: 'Descobrir' | 'Favoritos' | 'Mapa') {
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('link', { name: label })
    .click()
}
