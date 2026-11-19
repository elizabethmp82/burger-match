import type { Page } from '@playwright/test'
import { expect, isMobile, setSavedFavorites, test } from './fixtures'

/** Dois locais dos dados simulados (src/mocks/places.mock.ts). */
const PAO_E_BRASA = { id: 'mock-pao-e-brasa', name: 'Pão & Brasa' }
const CHAPA_QUENTE = { id: 'mock-chapa-quente', name: 'Chapa Quente' }

/** Lixeira de uma favorita NA LISTA (no desktop o painel ao lado tem outro botão). */
function trashButton(page: Page, name: string) {
  return page.getByRole('listitem').getByRole('button', { name: `Remover ${name} dos favoritos` })
}

test.describe('Favoritos', () => {
  test.beforeEach(async ({ page }) => {
    // Favoritos e Detalhes não exigem localização (usam a região de exemplo).
    await page.goto('/favorites')
    await setSavedFavorites(page, [PAO_E_BRASA.id, CHAPA_QUENTE.id])
  })

  test('lista as favoritas salvas', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Favoritos' })).toBeVisible()
    await expect(page.getByText('2 hamburguerias salvas')).toBeVisible()
  })

  test('a lixeira remove (e a remoção continua após recarregar)', async ({ page }) => {
    await trashButton(page, PAO_E_BRASA.name).click()

    await expect(page.getByText('1 hamburgueria salva')).toBeVisible()
    await expect(trashButton(page, PAO_E_BRASA.name)).toHaveCount(0)

    await page.reload()
    await expect(page.getByText('1 hamburgueria salva')).toBeVisible()
  })

  test('sem favoritas, convida a descobrir', async ({ page }) => {
    await setSavedFavorites(page, [])

    await expect(page.getByRole('heading', { name: 'Nenhuma favorita ainda' })).toBeVisible()
    await page.getByRole('link', { name: 'Descobrir hamburguerias' }).click()
    // Descobrir pede a localização antes.
    await expect(page.getByRole('heading', { name: 'Onde você está?' })).toBeVisible()
  })

  test('outra aba vê a mudança (sincronização entre abas)', async ({ page, context }) => {
    const otherTab = await context.newPage()
    await otherTab.goto('/favorites')
    await expect(otherTab.getByText('2 hamburguerias salvas')).toBeVisible()

    await trashButton(page, CHAPA_QUENTE.name).click()

    await expect(otherTab.getByText('1 hamburgueria salva')).toBeVisible()
  })
})

test.describe('Detalhes', () => {
  test('mostra o local, a rota externa e salva/remove dos favoritos', async ({ page }) => {
    await page.goto(`/place/${PAO_E_BRASA.id}`)
    await setSavedFavorites(page, [])

    await expect(page.getByRole('heading', { level: 1, name: PAO_E_BRASA.name })).toBeVisible()

    // Rota: só um link do Google Maps (sem API), em nova aba.
    const route = page.getByRole('link', { name: /Ver rota no Maps/ })
    await expect(route).toHaveAttribute(
      'href',
      /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-?\d/,
    )
    await expect(route).toHaveAttribute('target', '_blank')
    await expect(route).toHaveAttribute('rel', /noopener/)

    // Celular: "Salvar nos favoritos"; desktop (painel): "Salvar Pão & Brasa nos favoritos".
    await page.getByRole('button', { name: /^Salvar .*nos favoritos$/ }).click()
    await expect(page.getByRole('button', { name: /^Remover .*dos favoritos$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    // Abrir Favoritos pelo endereço também confere que a escolha foi salva.
    await page.goto('/favorites')
    await expect(page.getByText('1 hamburgueria salva')).toBeVisible()
    await expect(trashButton(page, PAO_E_BRASA.name)).toBeVisible()
  })

  test('no celular, tocar numa favorita abre os detalhes', async ({ page }) => {
    test.skip(!isMobile(page), 'No desktop a favorita abre no painel ao lado.')
    await page.goto('/favorites')
    await setSavedFavorites(page, [CHAPA_QUENTE.id])

    await page.getByRole('link', { name: new RegExp(CHAPA_QUENTE.name) }).click()

    await expect(page).toHaveURL(new RegExp(`/place/${CHAPA_QUENTE.id}$`))
    await expect(page.getByRole('heading', { level: 1, name: CHAPA_QUENTE.name })).toBeVisible()
  })

  test('local inexistente mostra aviso em vez de quebrar', async ({ page }) => {
    await page.goto('/place/mock-nao-existe')

    await expect(page.getByRole('heading', { name: 'Local não encontrado' })).toBeVisible()
  })
})
