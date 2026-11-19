# BurgerMatch — Documento de Escopo do Projeto

**Versão:** 1.1  
**Data:** 10/11/2026 (revisado em 18/11/2026)  
**Status:** Em desenvolvimento

> **Revisão 1.1 — dados abertos no lugar do Google.** Para o app continuar gratuito (sem conta de faturamento obrigatória), a Google Maps Platform foi substituída por dados do OpenStreetMap (Geoapify Places API, Nominatim) e mapa com MapLibre GL JS + OpenFreeMap. Do Google ficou só o _link_ de rotas, sem API. Decisões em [architecture.md](architecture.md) (ADR-014 a ADR-018); configuração em [data-services.md](data-services.md).

## 1. Visão geral

| Item           | Definição                                       |
| -------------- | ----------------------------------------------- |
| Nome           | BurgerMatch                                     |
| Tipo           | Progressive Web App (PWA)                       |
| Plataformas    | Web responsiva, Android e iOS via navegador/PWA |
| Arquitetura    | SPA — Single Page Application                   |
| Frontend       | React + TypeScript                              |
| Estilização    | Tailwind CSS                                    |
| Integração     | OpenStreetMap (Geoapify, Nominatim)             |
| Banco de dados | Não utilizado no MVP                            |
| Autenticação   | Não necessária                                  |
| Armazenamento  | localStorage                                    |

### Objetivo

Permitir que o usuário descubra hamburguerias próximas, avalie opções por cards interativos, deslize para favoritar ou descartar e consulte estabelecimentos em um mapa, sem cadastro.

## 2. Identidade visual

A identidade oficial utiliza um logotipo de hambúrguer em um card com coração, tipografia expressiva e cores inspiradas em ingredientes.

| Cor      | Hexadecimal | Uso sugerido                |
| -------- | ----------- | --------------------------- |
| Ketchup  | `#E63B2E`   | Botões e ações principais   |
| Mostarda | `#FFB627`   | Destaques e detalhes        |
| Pão      | `#F29E38`   | Elementos decorativos       |
| Tostado  | `#2B1A12`   | Títulos e textos principais |
| Alface   | `#3FA65A`   | Status positivo / aberto    |
| Creme    | `#FFF4E0`   | Fundo da interface          |

**Diretrizes:** mobile-first; cards arredondados; textos legíveis; endereços e distâncias com contraste adequado; estados claros de interação. O logotipo original será incorporado como arquivo de design na implementação.

## 3. Telas e rotas

### 3.1 Boas-vindas — `/`

- Apresentar logo, proposta do aplicativo e botão **Começar agora**.
- Solicitar geolocalização após interação do usuário.
- Oferecer escolha manual de região se a permissão for negada.

### 3.2 Descobrir — `/discover`

- Exibir pilha de cards com foto, nome, avaliação, endereço, distância e **Aberto agora**, quando disponível.
- Deslizar à direita para favoritar; à esquerda para descartar.
- Botões acessíveis equivalentes aos gestos.
- Botão **Desfazer** para reverter a última ação de swipe.
- Acesso à tela de detalhes.

### 3.3 Favoritos — `/favorites`

- Listar locais salvos no dispositivo.
- Tocar na linha abre os detalhes.
- Permitir remover um favorito por ação identificada.
- Não usar coração redundante sobre as fotos nem ícone de link externo ambíguo.

### 3.4 Mapa — `/map`

- Exibir hamburguerias próximas em marcadores.
- Ao tocar em um marcador, destacar o card correspondente.
- Permitir abrir detalhes e consultar a localização.
- Evitar uma lista duplicada de favoritos abaixo do mapa.

### 3.5 Detalhes — `/place/:placeId`

- Exibir fotos, nome, avaliação, endereço, distância e horário/status, quando disponíveis.
- Permitir favoritar/desfavoritar e abrir rota no Google Maps.

**Navegação inferior:** Descobrir, Favoritos e Mapa. Boas-vindas e Detalhes ficam fora da barra principal.

## 4. Tecnologias

| Categoria    | Tecnologia                   | Finalidade                                         |
| ------------ | ---------------------------- | -------------------------------------------------- |
| Linguagem    | TypeScript                   | Tipagem estática                                   |
| UI           | React                        | Componentes e gerenciamento de estado              |
| Build        | Vite                         | Ambiente e compilação                              |
| CSS          | Tailwind CSS v4              | Design responsivo                                  |
| Navegação    | React Router                 | Rotas SPA                                          |
| Ícones       | Lucide React                 | Ícones consistentes                                |
| Gestos       | Hammer.js                    | Swipes, com integração isolada em componente React |
| Mapas        | MapLibre GL JS + OpenFreeMap | Mapa interativo                                    |
| Busca        | Geoapify Places API          | Pesquisa de estabelecimentos (dados OSM)           |
| Regiões      | Nominatim                    | Bairros e cidades fora da lista local              |
| Localização  | Geolocation API              | Latitude e longitude                               |
| Persistência | localStorage                 | IDs dos favoritos e preferências                   |
| PWA          | vite-plugin-pwa              | Manifest, service worker e cache                   |
| Testes       | Vitest + Testing Library     | Testes unitários e de componentes                  |
| E2E          | Playwright                   | Testes de fluxos                                   |
| Qualidade    | ESLint + Prettier            | Padronização                                       |

**Integração de dados:** serviços gratuitos chamados direto do navegador, sem backend. A chave da Geoapify é pública por natureza e fica restrita aos domínios do app. Respeitar as políticas dos serviços públicos (sem pedido a cada movimento do mapa, cache, tempo limite, sem novas tentativas agressivas). Não expor segredos no frontend.

## 5. Arquitetura

Fluxo conceitual:

```text
Usuário/PWA
    ↓
React Pages → Components
    ↓
Custom Hooks
    ↓
Services
    ├── Geoapify / Nominatim (dados OpenStreetMap)
    ├── Geolocation API
    └── localStorage
```

Separar apresentação, comportamento reutilizável, integração externa e tipos. Evitar lógica concentrada em `App.tsx`.

## 6. Estrutura de pastas

Estrutura planejada. A estrutura real, sempre atualizada, está em [architecture.md](architecture.md#estrutura-atual).

```text
burger-match/
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── maskable-icon.png
│   └── images/
│       └── fallback-burger.webp
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── logos/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── EmptyState.tsx
│   │   └── layout/
│   │       ├── AppLayout.tsx
│   │       ├── Header.tsx
│   │       └── BottomNavigation.tsx
│   ├── features/
│   │   ├── onboarding/pages/WelcomePage.tsx
│   │   ├── discovery/
│   │   │   ├── components/
│   │   │   │   ├── BurgerCard.tsx
│   │   │   │   ├── SwipeDeck.tsx
│   │   │   │   └── SwipeActions.tsx
│   │   │   ├── hooks/useSwipe.ts
│   │   │   └── pages/DiscoverPage.tsx
│   │   ├── favorites/
│   │   │   ├── components/FavoriteCard.tsx
│   │   │   ├── hooks/useFavorites.ts
│   │   │   └── pages/FavoritesPage.tsx
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── BurgerMap.tsx
│   │   │   │   └── PlaceMarker.tsx
│   │   │   └── pages/MapPage.tsx
│   │   └── place-details/
│   │       ├── components/PhotoGallery.tsx
│   │       └── pages/PlaceDetailsPage.tsx
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   ├── places/           (PlacesProvider: Geoapify, Overpass, mock)
│   │   ├── location/         (GPS e busca de região)
│   │   └── storage/favoritesStorage.ts
│   ├── types/
│   │   ├── place.types.ts
│   │   └── location.types.ts
│   ├── utils/
│   │   ├── distance.ts
│   │   └── formatters.ts
│   ├── styles/globals.css
│   ├── routes/AppRoutes.tsx
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/
│   ├── scope.md
│   ├── requirements.md
│   └── architecture.md
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Responsabilidades

- `components`: elementos de interface reutilizáveis.
- `features`: funcionalidades, componentes específicos e telas.
- `hooks`: estado e comportamentos compartilháveis.
- `services`: APIs e armazenamento.
- `types`: contratos TypeScript.
- `utils`: funções auxiliares puras.
- `routes`: configuração de navegação.
- `tests`: testes automatizados.
- `docs`: documentação do projeto.

## 7. Modelo de dados

```ts
export interface BurgerPlace {
  placeId: string
  name: string
  address: string
  location: {
    latitude: number
    longitude: number
  }
  rating?: number
  reviewCount?: number
  distanceMeters?: number
  openNow?: boolean
  googleMapsUrl?: string
}
```

Dados opcionais podem não estar disponíveis. Os dados do OpenStreetMap exigem o crédito "© colaboradores do OpenStreetMap" (licença ODbL) e o plano gratuito da Geoapify exige atribuição. Guardar preferencialmente os identificadores permitidos dos locais favoritos e buscar novamente os detalhes quando necessário.

## 8. Regras de negócio

| Código | Regra                                                                 |
| ------ | --------------------------------------------------------------------- |
| RN01   | Não exigir cadastro.                                                  |
| RN02   | Solicitar permissão antes de usar geolocalização.                     |
| RN03   | Permitir escolha manual de região quando a permissão for negada.      |
| RN04   | Utilizar raio inicial de 5 km.                                        |
| RN05   | Swipe à direita adiciona aos favoritos.                               |
| RN06   | Swipe à esquerda descarta da sessão atual.                            |
| RN07   | Desfazer reverte a última ação, inclusive alteração de favorito.      |
| RN08   | Não permitir favoritos duplicados.                                    |
| RN09   | Persistir favoritos enquanto o armazenamento local existir.           |
| RN10   | Destacar no mapa o card do marcador selecionado.                      |
| RN11   | Exibir status de funcionamento apenas quando disponível e atualizado. |
| RN12   | Tratar erros de conexão, permissão e ausência de resultados.          |

## 9. Requisitos não funcionais

| Categoria       | Requisito                                                 |
| --------------- | --------------------------------------------------------- |
| Responsividade  | Celulares, tablets e desktops                             |
| Acessibilidade  | Contraste adequado, teclado e alternativas aos gestos     |
| Segurança       | HTTPS, chave Geoapify restrita, sem segredos no frontend  |
| Desempenho      | Carregamento sob demanda e otimização de imagens próprias |
| Compatibilidade | Navegadores modernos Chrome, Edge, Firefox e Safari       |
| Persistência    | Favoritos locais sujeitos à limpeza do navegador          |
| PWA             | Instalação e funcionamento offline parcial                |
| Privacidade     | Uso da localização somente quando necessário              |
| Custos          | Monitoramento de uso, quotas e campos solicitados da API  |

## 10. Etapas de implementação

### Fase 1 — Configuração e identidade

- [ ] Criar projeto React + TypeScript + Vite.
- [ ] Configurar Tailwind, fontes e identidade visual.
- [ ] Adicionar logo, ícones e paleta oficial.
- [ ] Configurar React Router.

### Fase 2 — Telas com dados simulados

- [ ] Boas-vindas.
- [ ] Descobrir e cards.
- [ ] Favoritos.
- [ ] Mapa e Detalhes.

### Fase 3 — Funcionalidades reais

- [ ] Geolocalização e escolha manual.
- [ ] Integração com dados reais (OpenStreetMap) e mapa.
- [ ] Swipe e desfazer.
- [ ] Favoritos em localStorage.

### Fase 4 — PWA e qualidade

- [ ] Manifest e Service Worker.
- [ ] Testes unitários e E2E.
- [ ] Acessibilidade e responsividade.
- [ ] Deploy, monitoramento e validação de custos.

## 11. Critérios de aceite do MVP

O usuário deverá conseguir:

1. Abrir o aplicativo e autorizar localização ou selecionar região.
2. Encontrar hamburguerias reais próximas.
3. Visualizar cards com informações disponíveis e legíveis.
4. Curtir, descartar e desfazer o último swipe.
5. Consultar e remover favoritos persistidos localmente.
6. Visualizar marcadores no mapa e selecionar o card correspondente.
7. Abrir detalhes e rotas externas no Google Maps.
8. Instalar o PWA em dispositivos compatíveis.

Também devem ser validados os fluxos de erro, acessibilidade, funcionamento em dispositivos móveis e limites de uso dos serviços gratuitos.

## 12. Fora do escopo inicial

Não serão desenvolvidos no MVP: autenticação, cadastro de usuário, avaliações próprias, pedidos, pagamentos, painel administrativo, sincronização de favoritos entre dispositivos e banco de dados.

## 13. Próximo passo

Inicializar a base React + TypeScript + Vite, configurar Tailwind CSS e React Router, incorporar a identidade visual e montar as cinco telas com dados simulados antes da integração com dados reais.
