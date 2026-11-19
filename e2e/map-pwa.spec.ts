import { expect, goToTab, isMobile, startWithMyLocation, test } from './fixtures'

test.describe('Mapa', () => {
  test.beforeEach(async ({ page }) => {
    await startWithMyLocation(page)
    await goToTab(page, 'Mapa')
    await expect(page).toHaveURL(/\/map$/)
  })

  test('desktop: lista ao lado com filtros e detalhes de cada local', async ({ page }) => {
    test.skip(isMobile(page), 'A lista ao lado do mapa é do desktop.')

    const filters = page.getByRole('group', { name: 'Filtrar hamburguerias' })
    await expect(filters.getByRole('button', { name: 'Todas' })).toBeVisible()

    const firstDetails = page.getByRole('link', { name: /^Ver detalhes de / }).first()
    const label = (await firstDetails.getAttribute('aria-label')) ?? ''
    const name = label.replace('Ver detalhes de ', '')
    await firstDetails.click()

    await expect(page).toHaveURL(/\/place\//)
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })

  test('celular: mostra a região e o raio sobre o mapa', async ({ page }) => {
    test.skip(!isMobile(page), 'No desktop a região fica na barra lateral.')

    await expect(page.getByRole('main').getByText('Sua localização · 5 km')).toBeVisible()
  })
})

test.describe('PWA', () => {
  test('manifest do app instalável', async ({ page, request }) => {
    await page.goto('/')
    const href = await page.locator('link[rel="manifest"]').getAttribute('href')
    expect(href).toBeTruthy()

    const manifest = (await (await request.get(href ?? '')).json()) as {
      name: string
      display: string
      start_url: string
      lang: string
      icons: { sizes: string; purpose?: string }[]
    }
    expect(manifest).toMatchObject({
      name: 'BurgerMatch',
      display: 'standalone',
      start_url: '/',
      lang: 'pt-BR',
    })
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    )
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  test.describe('service worker', () => {
    test.use({ serviceWorkers: 'allow' })

    test('é registrado e abre o app sem internet', async ({ page, context }) => {
      test.skip(isMobile(page), 'Basta conferir em um projeto.')

      await page.goto('/')
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready
      })
      // Recarrega para a página ficar sob o controle do service worker.
      await page.reload()
      await expect
        .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
        .toBe(true)

      await context.setOffline(true)
      await page.goto('/favorites')
      await expect(page.getByRole('heading', { level: 1, name: 'Favoritos' })).toBeVisible()
      await context.setOffline(false)
    })
  })
})
