# BurgerMatch — Arquitetura

## Visão geral

SPA em React + TypeScript, compilada pelo Vite, sem backend próprio nem banco de dados. Organização **por funcionalidade** (feature-based): cada pasta em `src/features/` agrupa as páginas, os componentes e os hooks de uma área do produto.

```text
Páginas (features/*/pages)
    ↓ usam
Componentes (features/*/components, components/ui, components/layout, components/place)
    ↓ obtêm dados por
Hooks (features/*/hooks, hooks/)
    ↓ delegam integração a
Services (services/places, services/location)
    → Geoapify (dados do OpenStreetMap), Nominatim, Geolocation API, sessionStorage, localStorage
```

Regras: componentes visuais não chamam APIs diretamente; integrações externas ficam em `services/`; contratos de dados ficam em `types/`; funções puras ficam em `utils/`; configuração vinda do ambiente fica em `config/env.ts`.

Serviços externos — todos sem cobrança obrigatória (detalhes em [data-services.md](data-services.md)):

| Serviço                      | Para quê                                        | Onde no código                                     |
| ---------------------------- | ----------------------------------------------- | -------------------------------------------------- |
| Geoapify Places API          | Hamburguerias próximas e detalhes (dados OSM)   | `services/places/geoapify/`                        |
| Overpass API (temporária)    | Alternativa de dados OSM sem chave              | `services/places/overpass/`                        |
| Nominatim                    | Bairro/cidade fora da lista local (sob pedido)  | `services/location/nominatim/`                     |
| OpenFreeMap + MapLibre GL JS | Mapa interativo e minimapa                      | `features/map/components/BurgerMap`, `LiveMiniMap` |
| Google Maps (só link)        | "Como chegar" — URL de rotas, sem API nem chave | `utils/googleMaps.ts`                              |

## Estrutura atual

```text
src/
├── assets/logos/                 Arquivos originais da identidade visual
├── components/
│   ├── layout/                   AppLayout (h-dvh: só o <main> rola), BottomNavigation, SideNavigation, RequireLocation
│   ├── place/                    PlaceRow, PlaceMeta, OpenStatus, PhotoTile, PlaceDetailsPanel, LoadMorePlaces…
│   ├── providers/                SearchAreaProvider (região + raio)
│   └── ui/                       Brand, EmptyState, LoadState, DataAttribution, MapPinShape, buttonStyles
├── config/env.ts                 Leitura e validação das variáveis VITE_* (fonte de dados, chave, URLs)
├── features/
│   ├── onboarding/               WelcomePage → WelcomeIntro | LocationStep (GPS ou RegionSearch)
│   ├── discovery/                SwipeDeck, BurgerCard, SwipeActions, PlaceAside (painel desktop), atalhos
│   │   ├── context/              DiscoverySessionProvider (histórico de decisões)
│   │   └── hooks/                useDiscoveryDeck (curtir/pular/desfazer), useDeckShortcuts
│   ├── favorites/                FavoritesPage, FavoriteCard, FavoritesProvider, useFavorites
│   ├── map/                      MapPage, BurgerMap (MapLibre, lazy), LiveMiniMap, MiniMap (ilustrativo), NearbyPanel
│   │   └── lib/maplibreSetup.ts  CSS + worker do MapLibre (compartilhado pelos mapas)
│   └── place-details/            PlaceDetailsPage, PhotoGallery
├── hooks/                        useSearchArea, usePlaces, useGeolocation, useMediaQuery, useNow, useGoBack…
├── lib/queryClient.ts            TanStack Query: cache de 30 min, sem retry automático
├── mocks/                        Hamburguerias simuladas (modo demonstração) e lista local de regiões
├── routes/                       AppRoutes e paths
├── services/
│   ├── places/                   placesService (fachada) + PlacesProvider (interface)
│   │   ├── geoapify/             Provider principal: cliente HTTP, mapper, paginação
│   │   ├── overpass/             Provider alternativo (mantido temporariamente)
│   │   ├── osm/                  Partes comuns aos dados OSM: IDs, mapper de tags, deduplicação
│   │   ├── mock/                 Provider do modo demonstração
│   │   └── withSessionCache.ts   Cache em sessionStorage na frente de qualquer provider
│   ├── location/                 geolocationService (GPS) e regionSearchService (lista local + Nominatim)
│   └── storage/                  favoritesStorage (IDs dos favoritos no localStorage, validados)
├── styles/globals.css            Tailwind v4 + tokens + fundo do minimapa ilustrativo
├── types/                        place.types, location.types
└── utils/                        distance (Haversine), formatters (pt-BR), openingHours, osmOpeningHours, googleMaps (link), share, cn
```

### Fluxo de dados

```text
Páginas ──► hooks (usePlaces, useDiscoveryDeck, useFavorites, useSearchArea)
                │                                   │
                ▼                                   ▼
     TanStack Query (memória, 30 min)     Contexts em App.tsx (estado em memória)
                │
                ▼
     services/places/placesService
                │
                ▼
     withSessionCache (sessionStorage) ──► PlacesProvider: Geoapify | Overpass | Mock
```

A fonte é escolhida uma vez, por `VITE_PLACES_PROVIDER` (padrão `geoapify`; `mock` = modo demonstração). Os contexts ficam acima do `RouterProvider`, então região, favoritos e decisões do baralho sobrevivem à troca de telas. Ao recarregar, só os **favoritos** voltam (salvos no aparelho, ADR-020); região, raio e decisões do baralho recomeçam — a localização nunca é salva.

## Rotas

| Rota              | Página                                | Layout                                    |
| ----------------- | ------------------------------------- | ----------------------------------------- |
| `/`               | WelcomePage                           | Próprio (sem navegação)                   |
| `/?step=location` | WelcomePage (etapa "Onde você está?") | Próprio                                   |
| `/discover`       | DiscoverPage                          | AppLayout                                 |
| `/favorites`      | FavoritesPage                         | AppLayout                                 |
| `/map`            | MapPage                               | AppLayout                                 |
| `/place/:placeId` | PlaceDetailsPage                      | AppLayout (sem barra inferior no celular) |
| `*`               | → `/`                                 | —                                         |

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

Bricolage Grotesque 800 (títulos, `tracking-logo` = -3,5%) e Inter 400/500/600/700 (texto), licença SIL OFL. Desde a Etapa 7 são **hospedadas no próprio app** (pacotes Fontsource, só o alfabeto latino): funcionam offline e não enviam visitas ao Google.

### ADR-006 — Alias `@/`

`@/` aponta para `src/` (em `tsconfig.app.json` e `vite.config.ts`), evitando imports relativos longos.

### ADR-007 — Dados simulados atrás de um serviço

As telas não importam o mock diretamente: usam hooks (`usePlaces`), que chamam `services/places/placesService`. Na Etapa 4 só a implementação do serviço/hooks mudou (passando a ter carregamento e erro — RN12); hoje o mock é um dos `PlacesProvider` (ADR-015).

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

- **Visual muda com a largura → classes do Tailwind.** **Comportamento muda → `useMediaQuery`** (ex.: em Favoritos ≥ 1280px a linha _seleciona_ o local no painel; abaixo disso _abre_ os Detalhes).
- **Lista + detalhe só a partir de `xl` (1280px):** entre 1024 e 1279px o painel ficaria com ~310px, pouco para o mosaico de fotos.
- **Container queries (`@container`)** quando o que importa é a largura do componente, não da tela: a lista de Favoritos vira 2 colunas quando ela mesma tem ≥ 42rem, e o nome em `PlaceRow` cresce quando a linha tem ≥ 24rem.
- **Detalhes dentro do `AppLayout`:** ganha a barra lateral no tablet/desktop; no celular o layout esconde a navegação inferior nessa rota. A partir de 768px a página usa o `PlaceDetailsPanel` (o mesmo do Favoritos) + galeria completa com crédito por foto.
- **Mapa:** no desktop, lista "Por perto" (filtros Todas / Abertas agora / Favoritas) + mapa com balão no marcador selecionado; selecionar na lista ou no mapa sincroniza os dois (RN10). O enquadramento usa todos os locais da região, para os marcadores não mudarem de lugar ao filtrar. Busca, zoom e "minha localização" do mockup entram nas Etapas 3/4, quando funcionarem.
- **`<main>` é `relative`:** elementos `absolute` (como os avisos `sr-only`) ficam dentro da área que rola, sem criar rolagem na página inteira.

### ADR-013 — Localização (Etapa 3)

- **Fluxo:** a região começa como exemplo (`source: 'default'`). Descobrir e Mapa ficam atrás de `RequireLocation`, que leva a "Onde você está?" e depois devolve o usuário à tela pedida (`state.from`). Favoritos e Detalhes funcionam sem escolha.
- **GPS (RN02):** `navigator.geolocation` só é chamado no clique, com `enableHighAccuracy: false` (precisão de bairro basta), `timeout` de 10 s e `maximumAge` de 5 min. Erros tipados (`denied`, `unavailable`, `timeout`, `unsupported`) viram mensagens que sempre apontam a busca manual (RN03/RN12). A Permissions API avisa de antemão quando a localização está bloqueada.
- **Privacidade:** a localização fica só em memória (contexto React) — não é salva nem enviada, como a tela promete.
- **Busca manual:** combobox acessível (padrão WAI-ARIA) sobre uma lista local de bairros e cidades, sem acentos/maiúsculas na comparação. Fora da lista, busca no Nominatim sob confirmação (ADR-018).
- **Mocks relativos ao centro:** os locais simulados guardam distância e direção (`offset`), não coordenadas. Assim o modo demonstração funciona em qualquer cidade.
- **Raio de busca:** escolhido na própria tela "Onde você está?" (5, 10 ou 20 km; começa em 5 km — RN04), com `RadiusPicker` (rádios nativos). Quem já tem região e só quer trocar o raio usa "Continuar em …", sem buscar a região de novo. O fim do baralho também oferece raios maiores.
- **Ordem por distância:** a busca usa o centro arredondado (cache), mas `useNearbyPlaces` reordena tudo pela distância exibida (centro exato), sempre do mais próximo para o mais distante — inclusive o que chega por "carregar mais" (que só aparece quando o baralho acabou, então nunca passa na frente de um card já na fila).
- **Sessão do baralho por região:** trocar de região recomeça o baralho; mudar só o raio, não. Favoritos não são afetados.

### ADR-014 — Google Maps Platform (Etapa 4) — **substituída pela ADR-015**

Primeira versão da Etapa 4: `@googlemaps/js-api-loader`, Places API (New), Autocomplete e `AdvancedMarkerElement`, com chave em `VITE_GOOGLE_MAPS_API_KEY`. Nunca chegou a ser testada com chave real e foi removida (código, dependências e tipos `google.maps`). Do Google ficou apenas o **link** de rotas (`utils/googleMaps.ts`), que não usa API nem chave.

### ADR-015 — Dados abertos no lugar do Google

- **Motivo:** o app precisa continuar gratuito, inclusive depois de publicado. A Google Maps Platform exige conta de faturamento mesmo dentro da cota gratuita.
- **Decisão:** dados do OpenStreetMap, mapa com MapLibre GL JS + OpenFreeMap, nenhum backend. Toda fonte de hamburguerias implementa a interface `PlacesProvider` (`searchNearby` paginado + `getByIds`); trocar de fonte não muda nenhuma tela.
- **Boa convivência com serviços públicos:** nada de pedido a cada movimento do mapa, cache (memória + `sessionStorage`), tempo limite em todo pedido e **nenhuma nova tentativa automática** — quem tenta de novo é a pessoa, pelo botão. Erros viram `PlacesError` com um motivo (`network`, `timeout`, `rate-limited`, `unavailable`, `forbidden`, `not-configured`…) que a tela sabe explicar (RN12).
- **Sem promessas de custo zero em qualquer escala:** os planos gratuitos têm limites e podem mudar; a documentação aponta as páginas oficiais.

### ADR-016 — Geoapify como fonte principal

- **Por quê:** os servidores públicos da Overpass falharam (timeouts/504) na rede de desenvolvimento. A Geoapify serve os mesmos dados OSM, com plano gratuito sem cartão.
- **Busca principal:** categorias `catering.fast_food.burger` e `catering.restaurant.burger`, 40 por página (≤ 2 créditos), paginação real por `offset`. A busca **complementar** (lanchonetes e restaurantes em geral, mantendo só os com evidência de hambúrguer em categoria, cozinha ou nome) só roda quando a pessoa pede, pelo botão.
- **IDs no formato OSM** (`node-123`, `way-456`): Detalhes buscam pelo `osm_id`, e favoritos antigos continuam válidos se a fonte mudar. Locais sem nome são descartados.
- **Chave pública:** `VITE_GEOAPIFY_API_KEY` vai para o navegador; a proteção é a lista de domínios permitidos no painel da Geoapify. Nenhuma mensagem de erro inclui a URL (que leva a chave).
- **Atribuição:** `DataAttribution` mostra "© colaboradores do OpenStreetMap" e "Busca por Geoapify" onde os dados aparecem.
- **Overpass:** o provider continua no código temporariamente (`VITE_PLACES_PROVIDER=overpass`).

### ADR-017 — Mapa com MapLibre GL JS + OpenFreeMap

- **MapLibre GL JS** (código aberto) desenha o mapa; o estilo padrão é o "liberty" do **OpenFreeMap** (sem chave, sem limite de visualizações, uso comercial permitido, sem SLA). Trocar de estilo: `VITE_MAP_STYLE_URL`.
- **Carregamento sob demanda:** `BurgerMap` e `LiveMiniMap` são `lazy`, então a biblioteca só é baixada nas telas com mapa. `lib/maplibreSetup.ts` concentra o CSS e o web worker.
- **Fallback ilustrativo:** o `MiniMap` desenhado em CSS aparece enquanto o minimapa real carrega e fora do desktop (onde o painel não baixa a biblioteca).

### ADR-018 — Busca de região: lista local + Nominatim sob confirmação

- **Lista local** (`mocks/regions.mock.ts`) responde a cada tecla, sem rede.
- **Nominatim** só é chamado quando a pessoa **confirma** (opção "Buscar em todo o mapa" ou Enter sem sugestão local): a política do servidor público proíbe autocomplete. O cliente espaça os pedidos (≥ 1,1 s), tem tempo limite de 10 s, não repete sozinho e guarda as respostas da sessão. O crédito ao OSM aparece junto dos resultados.
- No modo demonstração a opção não aparece (sem rede). Servidor configurável por `VITE_NOMINATIM_URL`.

### ADR-019 — Swipe com Pointer Events, sem biblioteca (Etapa 5)

- **Por quê não Hammer.js (previsto no escopo):** sem manutenção desde 2016. Pointer Events é nativo em todos os navegadores modernos e cobre dedo, mouse e caneta com o mesmo código.
- **Gestos:** direita = curtir (RN05), esquerda = pular (RN06), cima = abrir os Detalhes (sem decidir: o card continua no baralho). Para baixo não faz nada.
- **Regras puras e testadas** em `features/discovery/utils/swipeGesture.ts`: vale passar de 35% da largura (lateral) ou 25% da altura (cima), ou um peteleco rápido (> 0,6 px/ms) de pelo menos 60 px. Velocidade medida nos últimos 100 ms do gesto. O eixo dominante decide.
- **Toque continua sendo clique:** `useSwipe` só captura o ponteiro depois de 8 px de movimento; o clique que o navegador dispara ao soltar um arrasto é cancelado. O arrastar-e-soltar nativo de links/imagens é bloqueado.
- **Visual:** o card segue o dedo e inclina até 15°; selos "Curtir"/"Pular"/"Detalhes" aparecem conforme o progresso; ao valer, o card sai da tela em 200 ms. Com `prefers-reduced-motion`, sem inclinação nem animação de saída.
- **Botões e teclado também animam:** `SwipeableCard` expõe `fly(direção)` (via `ref`); ←/→/↑ e os botões ✕/❤ fazem o mesmo voo do gesto e a ação (curtir, pular, abrir Detalhes) só acontece no fim do voo. Toques repetidos durante o voo são ignorados (nada de curtir dois de uma vez).
- **`touch-action: none`** no card: no celular o arrasto não rola a página. Botões e setas do teclado seguem como alternativa (acessibilidade).

### ADR-020 — Favoritos no localStorage (Etapa 6)

- **Só os IDs** (`node-123`, `way-456`), como pede o escopo (§7): os dados do lugar vêm do serviço (com o cache da sessão). Nada de localização é salvo.
- **Formato versionado:** `burgermatch:favorites:v1` → `{ "version": 1, "ids": [...] }`. Mudou o formato? Nova versão de chave, com migração.
- **Tudo validado ao ler:** só IDs no formato esperado, sem repetidos (RN08), no máximo 500. JSON corrompido vira lista vazia, sem quebrar.
- **Armazenamento indisponível** (bloqueado, modo privado, cota cheia): o app segue com os favoritos só na memória.
- **Várias abas:** o evento `storage` atualiza as outras abas na hora.
- **Modo demonstração:** chave própria (`burgermatch:favorites:demo:v1`), para IDs `mock-…` não se misturarem aos reais.
- **Desfazer (RN07)** continua valendo: remover o favorito também remove do armazenamento.
- **Não salvo de propósito:** região, raio e histórico do baralho (privacidade e simplicidade). Depois de recarregar, um lugar já curtido pode reaparecer no baralho; curtir de novo não duplica.

### ADR-021 — PWA com vite-plugin-pwa (Etapa 7)

- **Instalável:** manifest (`pt-BR`, `standalone`, cor creme) com ícones 192/512, um ícone _maskable_ (desenho dentro da zona segura, fundo creme) e `apple-touch-icon` para iOS. Ícones gerados a partir de `src/assets/logos/burgermatch-icone.png`.
- **Service worker (Workbox, `generateSW`):** pré-carrega o app (~900 KB: HTML, JS, CSS, fontes latinas, ícones) → abre sem internet. Rotas do SPA caem no `index.html` (`navigateFallback`).
- **MapLibre fora do pré-cache:** o pedaço `maplibre-*` (~1,5 MB com o worker) só é baixado e guardado na primeira vez que um mapa abre (`CacheFirst`). Quem nunca abre o mapa não paga esse download.
- **Mapa offline parcial:** tiles já vistos (até 600, 7 dias) e estilo/fontes do OpenFreeMap ficam guardados.
- **Dados não passam pelo service worker** (Geoapify, Nominatim, Overpass): já existe o cache da sessão, e assim as regras de cada serviço continuam valendo num lugar só. Sem internet, as telas mostram o erro de conexão (RN12).
- **Atualização com aviso:** `registerType: 'prompt'` + `UpdatePrompt` ("Nova versão disponível · Atualizar / Agora não"). Não recarregamos sozinhos para não perder baralho e região no meio do uso.
- **Falhas de carregamento isoladas:** `ErrorBoundary` em volta dos mapas sob demanda (minimapa vira o ilustrativo; Mapa mostra "Mapa indisponível" com a lista funcionando) e `RouteError` como tela de erro das rotas (Recarregar / Voltar ao início), no lugar da mensagem técnica do React Router.
- **Peso:** ícone da marca no app agora em WebP 640 px (27 KB, antes PNG 1024 px / 126 KB); favicon de 64 px (7 KB).
- **`npm audit`:** 12 alertas moderados, todos em ferramentas de build/lint (`minimatch`/`glob` via ESLint e workbox-build) — não vão para o app publicado.

## Pontos de atenção conhecidos

- `react-router@8` declara `engines.node >=22.22.0`; o ambiente atual usa Node 22.19.0. Funciona para SPA, mas recomenda-se atualizar o Node para a LTS mais recente.
- `npm audit` aponta 10 vulnerabilidades moderadas com origem única no `minimatch` (dependência do ESLint, apenas em desenvolvimento; não vai para o bundle).
- `burgermatch-logo.png` e `burgermatch-logo-sem-slogan.png` (~300 KB) não são usados no app; ficam como arquivos originais da marca.
