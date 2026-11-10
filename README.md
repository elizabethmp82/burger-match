# BurgerMatch

> Encontre sua hamburgueria ideal.

PWA para descobrir hamburguerias próximas com uma experiência de cards no estilo "swipe": direita para favoritar, esquerda para descartar.

## Status

| Etapa | Descrição               | Situação                                         |
| ----- | ----------------------- | ------------------------------------------------ |
| 1     | Configuração inicial    | ✅ Concluída                                     |
| 2     | Interfaces (dados mock) | ✅ Concluída                                     |
| 3     | Geolocalização          | ✅ Concluída                                     |
| 4     | Google Maps Platform    | 🧪 Implementada, aguardando teste com chave real |
| 5     | Swipe                   | ⏳                                               |
| 6     | Favoritos               | ⏳                                               |
| 7     | PWA                     | ⏳                                               |
| 8     | Testes e publicação     | ⏳                                               |

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

Copie `.env.example` para `.env.local`. **Sem chave**, o app roda em modo demonstração (dados simulados, sem custo). Para usar dados reais do Google, siga [docs/google-maps-setup.md](docs/google-maps-setup.md).

## Documentação

- [Escopo](docs/scope.md)
- [Requisitos](docs/requirements.md)
- [Arquitetura e decisões](docs/architecture.md)
- [Configurar o Google Maps](docs/google-maps-setup.md)
- [Mockups](docs/design/)

## Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query 5 · Google Maps JavaScript API + Places API (New) · Lucide React · ESLint · Prettier
