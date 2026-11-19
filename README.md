<p align="center">
  <img src="src/assets/logos/burgermatch-logo.png" alt="BurgerMatch" width="280" />
</p>

<p align="center"><strong>Encontre sua hamburgueria ideal.</strong></p>

<p align="center">
  PWA para descobrir hamburguerias próximas com cards no estilo <em>swipe</em>:<br />
  direita para favoritar, esquerda para descartar.
</p>

---

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Status do projeto](#status-do-projeto)
- [Começando](#começando)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Fontes de dados e atribuição](#fontes-de-dados-e-atribuição)
- [Privacidade](#privacidade)
- [Documentação](#documentação)
- [Stack](#stack)

## Visão geral

O BurgerMatch mostra hamburguerias perto de você, uma de cada vez, como um baralho de cards. Você decide rápido (curtir ou pular), guarda as favoritas e vê tudo num mapa.

O app é **100% front-end** (sem backend nem banco de dados) e foi pensado para ser **gratuito de manter**: usa dados abertos do OpenStreetMap, mapa do OpenFreeMap e nenhuma API com cobrança obrigatória.

| Celular                                                            | Desktop                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| ![Descobrir no celular](<docs/design/3. Descobrir (swipe)@1x.png>) | ![Descobrir no desktop](<docs/design/Desktop · Descobrir@1x.png>) |

> Imagens dos mockups de referência. Todas as telas estão em [`docs/design/`](docs/design/).

## Funcionalidades

- **Boas-vindas e localização** — usa o GPS do aparelho ou uma busca manual de bairro/cidade, com raio de busca de 5, 10 ou 20 km.
- **Descobrir** — baralho de cards, do mais próximo para o mais distante. Arraste para a direita (curtir), esquerda (pular) ou para cima (detalhes); também há botões e desfazer.
  - Atalhos no desktop: `←` pular · `→` curtir · `↑` detalhes · `Ctrl/⌘ + Z` desfazer.
- **Favoritos** — salvos no aparelho (continuam depois de recarregar ou fechar o navegador); lista das hamburguerias curtidas (no desktop ≥ 1280 px, lista + detalhe lado a lado).
- **Mapa** — mapa interativo (MapLibre) com as hamburguerias da região; no desktop, lista lateral sincronizada.
- **Detalhes** — endereço, horário de funcionamento, status "aberto/fechado", distância, compartilhar e rota pelo Google Maps (apenas link, sem API).
- **Instalável (PWA)** — dá para adicionar à tela inicial do celular ou instalar no computador; o app abre mesmo sem internet (os dados das hamburguerias precisam de conexão).
- **Modo demonstração** — dados simulados, sem acessar a rede, para desenvolver e testar em qualquer lugar.
- **Layout responsivo** — celular, tablet e desktop:

| Faixa              | Navegação              | Destaques                                                                |
| ------------------ | ---------------------- | ------------------------------------------------------------------------ |
| Celular (< 768 px) | Barra inferior         | Layout dos mockups mobile                                                |
| Tablet (768+)      | Barra lateral compacta | Conteúdo centralizado, cards com tamanho controlado                      |
| Desktop (1024+)    | Barra lateral completa | Descobrir com painel e atalhos; Mapa com lista; Boas-vindas em 2 colunas |
| Desktop (1280+)    | Barra lateral completa | Favoritos com lista + detalhe                                            |

## Status do projeto

O desenvolvimento acontece em etapas, cada uma validada antes da próxima.

| Etapa | Descrição               | Situação                                                                    |
| ----- | ----------------------- | --------------------------------------------------------------------------- |
| 1     | Configuração inicial    | ✅ Concluída                                                                |
| 2     | Interfaces (dados mock) | ✅ Concluída                                                                |
| 3     | Geolocalização          | ✅ Concluída                                                                |
| 4     | Dados reais e mapa      | ✅ Concluída — Geoapify + OpenStreetMap, MapLibre + OpenFreeMap, Nominatim  |
| 5     | Swipe (gestos)          | ✅ Concluída                                                                |
| 6     | Favoritos persistentes  | ✅ Concluída                                                                |
| 7     | PWA                     | ✅ Concluída                                                                |
| 8     | Testes e publicação     | 🚧 Em andamento — testes E2E (Playwright) prontos; CI e publicação a seguir |

> A Etapa 4 começou com a Google Maps Platform, mas o projeto migrou para dados abertos para não depender de faturamento obrigatório.

## Começando

### Requisitos

- Node.js `^20.19.0 || >=22.12.0` (recomendado: LTS mais recente)
- npm 10+

### Instalação

```bash
git clone <url-do-repositorio> burger-match
cd burger-match
npm install
cp .env.example .env.local   # depois preencha (veja abaixo)
npm run dev                  # http://localhost:5173
```

**Quer só ver o app funcionando?** Coloque `VITE_PLACES_PROVIDER=mock` no `.env.local`: o app roda em modo demonstração, sem chave e sem acessar a rede.

## Variáveis de ambiente

Configure no arquivo `.env.local` (ignorado pelo Git). O modelo completo, comentado, está em [`.env.example`](.env.example).

| Variável                | Padrão                    | Descrição                                                                |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------ |
| `VITE_PLACES_PROVIDER`  | `geoapify`                | Fonte das hamburguerias: `geoapify`, `overpass` (temporária) ou `mock`   |
| `VITE_GEOAPIFY_API_KEY` | _(vazio)_                 | Chave da Geoapify. Sem ela, a busca avisa que não está configurada       |
| `VITE_OVERPASS_URL`     | servidor público Overpass | Só para `overpass`. Aceita apenas `https` (ou `http` em localhost)       |
| `VITE_NOMINATIM_URL`    | Nominatim público do OSM  | Busca de bairro/cidade fora da lista local (só após a pessoa confirmar)  |
| `VITE_MAP_STYLE_URL`    | OpenFreeMap _liberty_     | Estilo do mapa (MapLibre). Alternativas: `.../styles/bright`, `positron` |
| `VITE_GTM_ID`           | ID padrão do projeto      | Google Tag Manager — carregado **só** no build de produção               |

### Obtendo a chave da Geoapify

Passo a passo completo (inclusive Nominatim, mapa e Overpass) em [docs/data-services.md](docs/data-services.md).

1. Crie uma conta gratuita (sem cartão) em <https://myprojects.geoapify.com>.
2. Crie um projeto e copie a chave de API para `VITE_GEOAPIFY_API_KEY`.
3. **Restrinja a chave** no painel da Geoapify, liberando só os endereços do app (ex.: `http://localhost:5173` e o domínio publicado).

> ⚠️ Toda variável `VITE_*` é embutida no JavaScript do navegador, ou seja, é **pública**. Nunca coloque segredos de verdade nelas. A proteção da chave da Geoapify é a lista de domínios permitidos.

> Os planos gratuitos dos serviços têm limites e podem mudar. Confira sempre as páginas oficiais antes de publicar.

## Scripts

| Script                 | O que faz                                                                     |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento com HMR                                           |
| `npm run build`        | Verificação de tipos + build de produção                                      |
| `npm run preview`      | Serve o build de `dist/` localmente (é onde a PWA e o modo offline funcionam) |
| `npm test`             | Roda os testes uma vez (Vitest)                                               |
| `npm run test:watch`   | Testes em modo observação                                                     |
| `npm run test:e2e`     | Testes ponta a ponta (Playwright), no build de produção em modo demonstração  |
| `npm run test:e2e:ui`  | Testes E2E na interface visual do Playwright (ver cada passo)                 |
| `npm run test:all`     | Testes unitários + E2E                                                        |
| `npm run typecheck`    | Verificação de tipos (TypeScript)                                             |
| `npm run lint`         | ESLint                                                                        |
| `npm run lint:fix`     | ESLint com correções automáticas                                              |
| `npm run format`       | Formata o código com Prettier                                                 |
| `npm run format:check` | Verifica a formatação sem alterar                                             |

Antes de abrir um commit, o ideal é que passem: `npm run typecheck && npm run lint && npm test && npm run format:check`.

### Testes E2E (Playwright)

Na primeira vez, baixe o navegador usado pelos testes: `npx playwright install chromium`.

`npm run test:e2e` gera o build de produção em `dist-e2e/` no **modo demonstração** (dados simulados) e o serve na porta 4180. Os testes rodam em dois perfis, **desktop** (1280 px) e **celular** (Pixel 7), e cobrem boas-vindas e localização (GPS simulado, recusa da permissão, busca manual e raio), Descobrir (botões, arrastar, desfazer e atalhos), Favoritos (persistência, lixeira e sincronização entre abas), Detalhes, Mapa e PWA (manifest e abertura offline).

Todo pedido para fora do app é bloqueado durante os testes. Assim eles não dependem da internet, não gastam créditos da Geoapify e não geram visitas no Analytics. Quando um teste falha, o relatório com captura de tela e _trace_ fica em `playwright-report/` (`npx playwright show-report`).

## Estrutura do projeto

Organização **por funcionalidade**: cada pasta em `src/features/` reúne páginas, componentes e hooks de uma área do produto. Integrações externas ficam isoladas em `src/services/`.

```text
src/
├── components/        Componentes compartilhados (layout, place, providers, ui)
├── features/
│   ├── onboarding/    Boas-vindas e escolha de localização
│   ├── discovery/     Baralho de cards (Descobrir)
│   ├── favorites/     Favoritos
│   ├── map/           Mapa (MapLibre) e lista de lugares próximos
│   └── place-details/ Página de detalhes
├── hooks/             Hooks gerais (geolocalização, busca, media query…)
├── services/
│   ├── places/        Interface PlacesProvider + Geoapify, Overpass e mock
│   └── location/      GPS e busca manual de região
├── config/            Leitura e validação das variáveis de ambiente
├── mocks/             Dados do modo demonstração
├── routes/            Rotas da aplicação
├── types/             Contratos de dados
└── utils/             Funções puras (distância, horários OSM, formatação…)
e2e/                   Testes ponta a ponta (Playwright)
```

A fonte de dados é trocável: todas as implementações seguem a interface `PlacesProvider`, e a escolha é feita por `VITE_PLACES_PROVIDER`. Mais detalhes em [Arquitetura e decisões](docs/architecture.md).

## Fontes de dados e atribuição

| Serviço                                         | Uso                                            |
| ----------------------------------------------- | ---------------------------------------------- |
| [Geoapify Places API](https://www.geoapify.com) | Busca de hamburguerias e detalhes              |
| [OpenStreetMap](https://www.openstreetmap.org)  | Dados dos lugares (© colaboradores OSM)        |
| [OpenFreeMap](https://openfreemap.org)          | Estilo e tiles do mapa                         |
| [Nominatim](https://nominatim.org)              | Busca de bairros e cidades fora da lista local |
| [MapLibre GL JS](https://maplibre.org)          | Renderização do mapa                           |

O app exibe a atribuição exigida por cada serviço. Para respeitar as políticas de uso de serviços públicos, as buscas têm cache de sessão, tempo limite e nenhuma repetição agressiva.

## Privacidade

- A localização **nunca é salva**: é usada só durante a sessão para buscar lugares próximos.
- Os favoritos ficam só no seu navegador (`localStorage`), e apenas os IDs dos lugares. Limpar os dados do site apaga os favoritos.
- O Google Tag Manager só é incluído no build de produção — o ambiente de desenvolvimento não gera visitas nos relatórios.

## Documentação

- [Escopo](docs/scope.md)
- [Requisitos](docs/requirements.md)
- [Arquitetura e decisões](docs/architecture.md)
- [Serviços de dados e mapa](docs/data-services.md) — configuração da Geoapify, Nominatim e OpenFreeMap
- [Mockups](docs/design/)

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query 5 · MapLibre GL JS · Geoapify Places API · vite-plugin-pwa (Workbox) · Fontsource · Lucide React · Vitest · Playwright · ESLint · Prettier
