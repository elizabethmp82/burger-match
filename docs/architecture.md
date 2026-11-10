# BurgerMatch — Arquitetura

## Visão geral

SPA em React + TypeScript, compilada pelo Vite, sem backend próprio. Organização **por funcionalidade** (feature-based): cada pasta em `src/features/` agrupa as páginas, os componentes e os hooks de uma área do produto.

```text
Páginas (features/*/pages)
    ↓ usam
Componentes (features/*/components, components/ui, components/layout)
    ↓ obtêm dados por
Hooks (features/*/hooks, hooks/)
    ↓ delegam integração a
Services (services/google, services/storage)  →  Google Maps / Places, Geolocation, localStorage
```

Regras: componentes visuais não chamam APIs diretamente; integrações externas ficam em `services/`; contratos de dados ficam em `types/`; funções puras ficam em `utils/`.

## Estrutura atual (Etapa 2)

```text
src/
├── assets/logos/                 Arquivos originais da identidade visual
├── components/
│   ├── layout/                   AppLayout (h-dvh: só o <main> rola), BottomNavigation
│   ├── place/                    PlaceRow, PlaceMeta, OpenStatus, PhotoTile (usados em várias telas)
│   ├── providers/                SearchAreaProvider (região + raio)
│   └── ui/                       Brand, EmptyState, MapPinShape, buttonStyles
├── features/
│   ├── onboarding/               WelcomePage → WelcomeIntro | LocationStep (?step=location)
│   ├── discovery/                SwipeDeck, BurgerCard, SwipeActions, DeckEmptyState, AreaPill
│   │   ├── context/              DiscoverySessionProvider (histórico de decisões)
│   │   └── hooks/                useDiscoveryDeck (curtir/pular/desfazer), useDiscoverySession
│   ├── favorites/                FavoritesPage, FavoriteCard, FavoritesProvider, useFavorites
│   ├── map/                      MapPage, MockMap, PlaceMarker, utils/projectToBox
│   └── place-details/            PlaceDetailsPage, PhotoGallery
├── hooks/                        useSearchArea, usePlaces (useNearbyPlaces/usePlace/usePlacesByIds), useGoBack
├── mocks/places.mock.ts          16 hamburguerias fictícias (12 dentro de 5 km)
├── services/places/              placesService (lê o mock; Places API na Etapa 4)
├── types/                        place.types, location.types
├── utils/                        distance (Haversine), formatters (pt-BR), googleMaps, cn
├── routes/                       AppRoutes e paths
└── styles/globals.css            Tailwind v4 + tokens + fundo do mapa ilustrativo
```

### Fluxo de dados

```text
Páginas ──► hooks (usePlaces, useDiscoveryDeck, useFavorites, useSearchArea)
                │                          │
                ▼                          ▼
     services/places (mock)      Contexts em App.tsx (estado em memória)
```

Os contexts ficam acima do `RouterProvider`, então região, favoritos e decisões do baralho sobrevivem à troca de telas — mas **não** a um recarregamento (a persistência vem na Etapa 6).

## Rotas

| Rota              | Página                                | Layout                  |
| ----------------- | ------------------------------------- | ----------------------- |
| `/`               | WelcomePage                           | Próprio (sem navegação) |
| `/?step=location` | WelcomePage (etapa "Onde você está?") | Próprio                 |
| `/discover`       | DiscoverPage                          | AppLayout               |
| `/favorites`      | FavoritesPage                         | AppLayout               |
| `/map`            | MapPage                               | AppLayout               |
| `/place/:placeId` | PlaceDetailsPage                      | Próprio (sem navegação) |
| `*`               | → `/`                                 | —                       |

## Registro de decisões técnicas

### ADR-001 — TypeScript fixado em `~6.0.x`

O template atual do Vite usa TypeScript 7. O `typescript-eslint` (exigido para ESLint) declara suporte a `typescript >=4.8.4 <6.1.0`. Fixamos `~6.0.3` para manter o lint funcional. Reavaliar quando o `typescript-eslint` suportar a versão 7.

### ADR-002 — ESLint no lugar do oxlint

O template atual do Vite vem com oxlint. O briefing exige ESLint + Prettier; o oxlint foi removido. Configuração em `eslint.config.js` (flat config) com `typescript-eslint` **strict**, `react-hooks`, `react-refresh`, `no-explicit-any: error` e `eslint-config-prettier` por último.

### ADR-003 — Tailwind CSS v4 com tokens em CSS

Sem `tailwind.config.js`: os tokens ficam em `@theme` em `src/styles/globals.css` e geram os utilitários (`bg-ketchup`, `font-display`, `tracking-logo`, `shadow-offset`...). Cores derivadas (`superficie`, `texto-suave`) são misturas (`color-mix`) das cores oficiais, não cores novas.

### ADR-004 — React Router em modo data (SPA)

Usamos `createBrowserRouter` + `RouterProvider` da biblioteca `react-router`, sem o "framework mode" (que introduz SSR/compilador próprio). Rotas centralizadas em `routes/paths.ts`.

### ADR-005 — Tipografia

Bricolage Grotesque 800 (títulos, `tracking-logo` = -3,5%) e Inter 400/500/600/700 (texto), via Google Fonts (SIL OFL). Na Etapa 7 (PWA) avaliaremos auto-hospedar as fontes para funcionamento offline.

### ADR-006 — Alias `@/`

`@/` aponta para `src/` (em `tsconfig.app.json` e `vite.config.ts`), evitando imports relativos longos.

### ADR-007 — Dados simulados atrás de um serviço

As telas não importam o mock diretamente: usam hooks (`usePlaces`), que chamam `services/places/placesService`. Na Etapa 4 só a implementação do serviço/hooks muda (passando a ter carregamento e erro — RN12).

### ADR-008 — Estado global com Context, sem biblioteca

Três contexts pequenos (região, favoritos, sessão do baralho), cada um com seu hook `useX` que lança erro se usado fora do provider. O objeto do context fica no arquivo do hook (`.ts`) e o provider em `.tsx`, para respeitar a regra `react-refresh/only-export-components`.

### ADR-009 — Baralho derivado do histórico

O baralho não guarda índice: `restantes = locais no raio − locais já decididos`. Ampliar o raio acrescenta os novos ao final; desfazer remove a última entrada do histórico e, se aquele "curtir" criou o favorito, remove o favorito também (RN07).

### ADR-010 — Cores "fortes" para contraste

`ketchup-forte` e `alface-forte` (misturas com tostado) garantem contraste AA em textos pequenos e no botão principal; o alface puro tem ~3:1 sobre o creme.

### ADR-011 — Layout com rolagem interna

O `AppLayout` ocupa `h-dvh` e só o `<main>` rola; a navegação inferior deixou de ser `fixed`. Isso permite que o Mapa ocupe exatamente a altura disponível.

### ADR-012 — Responsividade por faixas, sem alterar o mobile

Breakpoints padrão do Tailwind: celular `< md` (768px), tablet `md`, desktop `lg` (1024px). As classes do mobile aprovado não mudam; só se acrescentam variantes `md:`/`lg:`. Navegação: barra inferior no celular; `SideNavigation` a partir do tablet (compacta em `md`, completa em `lg`, como em `docs/design/Desktop · *.png`). Os itens vêm de `layout/navItems.ts`, fonte única para as duas barras. As páginas limitam a largura com a utility `page-container` (até 72rem).

## Pontos de atenção conhecidos

- `react-router@8` declara `engines.node >=22.22.0`; o ambiente atual usa Node 22.19.0. Funciona para SPA, mas recomenda-se atualizar o Node para a LTS mais recente.
- `npm audit` aponta 10 vulnerabilidades moderadas com origem única no `minimatch` (dependência do ESLint, apenas em desenvolvimento; não vai para o bundle).
- `burgermatch-logo.png` tem ~300 KB; otimizar (WebP/tamanho adequado) nas etapas de PWA/publicação.
