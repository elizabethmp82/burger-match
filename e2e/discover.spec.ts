import type { Page } from '@playwright/test'
import {
  expect,
  goToTab,
  isMobile,
  setSavedFavorites,
  startWithMyLocation,
  test,
  topCard,
  topCardName,
} from './fixtures'

test.describe('Descobrir', () => {
  test.beforeEach(async ({ page }) => {
    await startWithMyLocation(page)
    await expect(topCard(page)).toBeVisible()
  })

  test('curtir pelo botão salva nos favoritos (e continua salvo após recarregar)', async ({
    page,
  }) => {
    // Começa sem favoritas, para a contagem ser exata. Recarregar apaga a
    // localização (ela só fica na memória): o app pede de novo e volta ao Descobrir.
    await setSavedFavorites(page, [])
    await page.getByRole('button', { name: 'Usar minha localização' }).click()
    await expect(page).toHaveURL(/\/discover$/)
    const name = await topCardName(page)

    await page.getByRole('button', { name: `Curtir ${name}` }).click()

    await expect(page.getByRole('status').filter({ hasText: 'curtida' })).toHaveText(
      `${name} curtida e salva nos favoritos.`,
    )
    await expect(topCard(page)).not.toHaveAttribute('aria-label', name)

    await goToTab(page, 'Favoritos')
    await expect(page.getByText('1 hamburgueria salva')).toBeVisible()
    await expect(
      page.getByRole('listitem').getByRole('button', { name: `Remover ${name} dos favoritos` }),
    ).toBeVisible()

    // localStorage: a favorita sobrevive ao recarregamento.
    await page.reload()
    await expect(
      page.getByRole('listitem').getByRole('button', { name: `Remover ${name} dos favoritos` }),
    ).toBeVisible()
  })

  test('pular e desfazer traz o mesmo card de volta', async ({ page }) => {
    const first = await topCardName(page)
    const undo = page.getByRole('button', { name: 'Desfazer última ação' })
    await expect(undo).toBeDisabled()

    await page.getByRole('button', { name: `Pular ${first}` }).click()
    await expect(topCard(page)).not.toHaveAttribute('aria-label', first)

    await undo.click()
    await expect(topCard(page)).toHaveAttribute('aria-label', first)
    await expect(undo).toBeDisabled()
  })

  test('arrastar o card para a direita curte e para a esquerda pula', async ({ page }) => {
    const first = await topCardName(page)
    await dragTopCard(page, 'right')
    await expect(page.getByRole('status').filter({ hasText: 'curtida' })).toHaveText(
      `${first} curtida e salva nos favoritos.`,
    )

    const second = await topCardName(page)
    await dragTopCard(page, 'left')
    await expect(page.getByRole('status').filter({ hasText: 'pulada' })).toHaveText(
      `${second} pulada.`,
    )
  })

  test('atalhos de teclado no desktop: → curte, ← pula, ↑ abre os detalhes', async ({ page }) => {
    test.skip(isMobile(page), 'Atalhos de teclado são do desktop.')

    const first = await topCardName(page)
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('status').filter({ hasText: 'curtida' })).toHaveText(
      `${first} curtida e salva nos favoritos.`,
    )

    const second = await topCardName(page)
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('status').filter({ hasText: 'pulada' })).toHaveText(
      `${second} pulada.`,
    )

    const third = await topCardName(page)
    await page.keyboard.press('ArrowUp')
    await expect(page).toHaveURL(/\/place\//)
    await expect(page.getByRole('heading', { level: 1, name: third })).toBeVisible()
  })

  test('tocar no texto do card abre os detalhes', async ({ page }) => {
    const name = await topCardName(page)
    await topCard(page)
      .getByRole('link', { name: new RegExp(name) })
      .click()

    await expect(page).toHaveURL(/\/place\//)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })
})

/** Arrasta o card do topo com o ponteiro (mouse), como um dedo deslizando. */
async function dragTopCard(page: Page, direction: 'left' | 'right') {
  const box = await topCard(page).boundingBox()
  if (!box) throw new Error('Card sem tamanho na tela.')
  const startX = box.x + box.width / 2
  const y = box.y + box.height * 0.3
  const endX = direction === 'right' ? startX + box.width * 0.6 : startX - box.width * 0.6

  await page.mouse.move(startX, y)
  await page.mouse.down()
  await page.mouse.move(endX, y, { steps: 12 })
  await page.mouse.up()
}
