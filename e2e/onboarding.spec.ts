import { expect, isMobile, startWithMyLocation, test, topCard } from './fixtures'

test.describe('Boas-vindas e localização', () => {
  test('usa a localização do GPS e abre o Descobrir', async ({ page }) => {
    await startWithMyLocation(page)

    await expect(topCard(page)).toBeVisible()
    await expect(page.getByRole('button', { name: /^Curtir / })).toBeVisible()
  })

  test('busca manual de bairro com raio escolhido', async ({ page }) => {
    await page.goto('/?step=location')

    // A permissão de localização só é pedida no clique do botão (RN02).
    await page.getByText('10 km', { exact: true }).click()
    await page.getByRole('combobox', { name: 'Buscar por cidade ou bairro' }).fill('Moema')
    await page.getByRole('option', { name: /Moema/ }).click()

    await expect(page).toHaveURL(/\/discover$/)
    await expect(topCard(page)).toBeVisible()
    if (isMobile(page)) {
      await expect(page.getByRole('link', { name: /Moema · raio de 10 km/ })).toBeVisible()
    }
  })

  test.describe('sem permissão de localização', () => {
    test.use({ permissions: [] })

    test('explica o problema e leva para a busca manual', async ({ page }) => {
      await page.goto('/?step=location')
      await page.getByRole('button', { name: 'Usar minha localização' }).click()

      await expect(page.getByRole('alert')).toContainText(
        'Você não permitiu o acesso à localização',
      )
      // O foco vai direto para a alternativa (busca manual).
      await expect(
        page.getByRole('combobox', { name: 'Buscar por cidade ou bairro' }),
      ).toBeFocused()
    })
  })

  test('telas que dependem da localização pedem a região antes', async ({ page }) => {
    await page.goto('/map')

    await expect(page.getByRole('heading', { name: 'Onde você está?' })).toBeVisible()
    await page.getByRole('button', { name: 'Usar minha localização' }).click()
    // Depois da escolha, volta para a tela que tentou abrir.
    await expect(page).toHaveURL(/\/map$/)
  })

  test('clicar no logo volta para a página inicial', async ({ page }) => {
    await startWithMyLocation(page)

    // Celular: logo no topo do Descobrir. Tablet/desktop: logo na barra lateral.
    await page.getByRole('link', { name: /página inicial/ }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Começar agora' })).toBeVisible()
  })

  test('endereço desconhecido volta para as Boas-vindas', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe')

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('link', { name: 'Começar agora' })).toBeVisible()
  })

  test('não chama serviços externos de dados no modo demonstração', async ({
    page,
    externalRequests,
  }) => {
    await startWithMyLocation(page)
    await expect(topCard(page)).toBeVisible()

    const dataServices = externalRequests.filter((url) =>
      /geoapify|nominatim|overpass/i.test(new URL(url).hostname),
    )
    expect(dataServices).toEqual([])
  })
})
