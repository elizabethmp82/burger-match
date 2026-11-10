# BurgerMatch — Requisitos

Fonte: briefing do projeto e [scope.md](./scope.md). Este documento não acrescenta requisitos; apenas os consolida para rastreamento.

## Requisitos funcionais (telas)

| ID   | Tela        | Rota              | Requisito                                                                                      | Etapa |
| ---- | ----------- | ----------------- | ---------------------------------------------------------------------------------------------- | ----- |
| RF01 | Boas-vindas | `/`               | Logo, slogan, breve explicação, funcionalidades e botão **Começar agora**                      | 2     |
| RF02 | Descobrir   | `/discover`       | Localização atual; cards com foto, nome, avaliação, endereço, distância, status "Aberto agora" | 2     |
| RF03 | Descobrir   | `/discover`       | Botões curtir, descartar e desfazer; gestos por toque e mouse                                  | 2 / 5 |
| RF04 | Favoritos   | `/favorites`      | Lista de favoritos; tocar abre detalhes; remover; estado vazio; sem ícones redundantes         | 2 / 6 |
| RF05 | Mapa        | `/map`            | Mapa interativo, localização do usuário, marcadores, destaque do selecionado, card e detalhes  | 2 / 4 |
| RF06 | Detalhes    | `/place/:placeId` | Nome, fotos, avaliação, endereço, distância, horário/status, favoritar, rota no Google Maps    | 2 / 4 |
| RF07 | Navegação   | —                 | Barra inferior com Descobrir, Favoritos e Mapa (fora de Boas-vindas e Detalhes)                | 1 ✅  |

## Regras de negócio

| Código | Regra                                                                     |
| ------ | ------------------------------------------------------------------------- |
| RN01   | O aplicativo não exige cadastro.                                          |
| RN02   | A localização depende da autorização do usuário.                          |
| RN03   | Se a localização for negada, permitir selecionar uma região manualmente.  |
| RN04   | O raio inicial de busca é de 5 km.                                        |
| RN05   | Swipe para a direita adiciona aos favoritos.                              |
| RN06   | Swipe para a esquerda descarta o estabelecimento da sessão atual.         |
| RN07   | O botão desfazer reverte a última ação (inclusive alteração de favorito). |
| RN08   | Não permitir favoritos duplicados.                                        |
| RN09   | Os favoritos persistem localmente.                                        |
| RN10   | A seleção de um marcador no mapa destaca o card correspondente.           |
| RN11   | Exibir informações de funcionamento somente quando disponíveis.           |
| RN12   | Tratar estados de erro, carregamento e ausência de resultados.            |

## Requisitos não funcionais

Ver [scope.md §9](./scope.md#9-requisitos-não-funcionais): responsividade, acessibilidade, segurança, desempenho, compatibilidade, persistência, PWA, privacidade e custos.
