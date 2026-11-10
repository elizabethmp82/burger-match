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

## Estrutura atual (Etapa 1)

```text
src/
├── assets/logos/            Arquivos originais da identidade visual
├── components/layout/       AppLayout (Outlet + navegação), BottomNavigation
├── features/<feature>/pages Uma página por rota (placeholders na Etapa 1)
├── routes/                  AppRoutes (createBrowserRouter) e paths (constantes)
├── styles/globals.css       Tailwind v4 + tokens da identidade (@theme)
├── App.tsx                  RouterProvider
└── main.tsx                 Ponto de entrada
```

As pastas `hooks/`, `services/`, `types/`, `utils/`, `components/ui/` e `tests/` serão criadas junto com seu primeiro arquivo real.

## Rotas

| Rota              | Página           | Layout                  |
| ----------------- | ---------------- | ----------------------- |
| `/`               | WelcomePage      | Próprio (sem navegação) |
| `/discover`       | DiscoverPage     | AppLayout               |
| `/favorites`      | FavoritesPage    | AppLayout               |
| `/map`            | MapPage          | AppLayout               |
| `/place/:placeId` | PlaceDetailsPage | Próprio (sem navegação) |
| `*`               | → `/`            | —                       |

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

## Pontos de atenção conhecidos

- `react-router@8` declara `engines.node >=22.22.0`; o ambiente atual usa Node 22.19.0. Funciona para SPA, mas recomenda-se atualizar o Node para a LTS mais recente.
- `npm audit` aponta 10 vulnerabilidades moderadas com origem única no `minimatch` (dependência do ESLint, apenas em desenvolvimento; não vai para o bundle).
- `burgermatch-logo.png` tem ~300 KB; otimizar (WebP/tamanho adequado) nas etapas de PWA/publicação.
