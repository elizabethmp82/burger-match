# BurgerMatch

> Encontre sua hamburgueria ideal.

PWA para descobrir hamburguerias próximas com uma experiência de cards no estilo "swipe": direita para favoritar, esquerda para descartar.

## Status

| Etapa | Descrição               | Situação     |
| ----- | ----------------------- | ------------ |
| 1     | Configuração inicial    | ✅ Concluída |
| 2     | Interfaces (dados mock) | ✅ Concluída |
| 3     | Geolocalização          | ⏳           |
| 4     | Google Maps Platform    | ⏳           |
| 5     | Swipe                   | ⏳           |
| 6     | Favoritos               | ⏳           |
| 7     | PWA                     | ⏳           |
| 8     | Testes e publicação     | ⏳           |

## Telas por tamanho

| Faixa           | Navegação              | Destaques                                                                |
| --------------- | ---------------------- | ------------------------------------------------------------------------ |
| Celular (< 768) | Barra inferior         | Layout dos mockups mobile                                                |
| Tablet (768+)   | Barra lateral compacta | Conteúdo centralizado, cards com tamanho controlado                      |
| Desktop (1024+) | Barra lateral completa | Descobrir com painel e atalhos; Mapa com lista; Boas-vindas em 2 colunas |
| Desktop (1280+) | Barra lateral completa | Favoritos com lista + detalhe                                            |

Mockups em [`docs/design/`](docs/design/) (mobile e `Desktop · *.png`).

## Requisitos

- Node.js `^20.19.0 || >=22.12.0` (recomendado: LTS mais recente, ≥ 22.22)
- npm 10+

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script                 | O que faz                             |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento com HMR   |
| `npm run build`        | Verificação de tipos + build produção |
| `npm run preview`      | Serve o build de `dist/` localmente   |
| `npm run typecheck`    | Verificação de tipos (TypeScript)     |
| `npm run lint`         | ESLint                                |
| `npm run lint:fix`     | ESLint com correções automáticas      |
| `npm run format`       | Formata o código com Prettier         |
| `npm run format:check` | Verifica formatação sem alterar       |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. A chave do Google Maps será configurada na Etapa 4.

## Documentação

- [Escopo](docs/scope.md)
- [Requisitos](docs/requirements.md)
- [Arquitetura e decisões](docs/architecture.md)
- [Mockups](docs/design/)

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 8 · Lucide React · ESLint · Prettier
