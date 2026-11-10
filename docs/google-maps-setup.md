# Configurar a Google Maps Platform

Sem chave, o BurgerMatch roda em **modo demonstração** (dados simulados, mapa ilustrativo, custo zero). Com a chave, passa a usar hamburguerias reais do Google.

> Preços e cotas gratuitas mudam com o tempo. Confira sempre a página oficial: <https://mapsplatform.google.com/pricing/>

## 1. Projeto e faturamento

1. Acesse <https://console.cloud.google.com/> e crie um projeto (ex.: `burger-match`).
2. Em **Faturamento**, vincule uma conta de faturamento. O Google exige isso mesmo para o uso dentro da cota gratuita.
3. **Antes de continuar**, crie um alerta de orçamento: **Faturamento → Orçamentos e alertas → Criar orçamento** (ex.: R$ 20 por mês, com alertas em 50%, 90% e 100%).

## 2. Ativar as APIs

Em **APIs e serviços → Biblioteca**, ative:

| API                     | Para quê                                                   |
| ----------------------- | ---------------------------------------------------------- |
| **Maps JavaScript API** | Mapa interativo (tela Mapa e minimapa do Descobrir)        |
| **Places API (New)**    | Busca de hamburguerias, detalhes, fotos e busca de bairros |

Não ative a "Places API" antiga: o app usa a **New**.

## 3. Criar e RESTRINGIR a chave

1. **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
2. Abra a chave criada e configure:
   - **Restrições de aplicativo → Sites (referenciadores HTTP):**
     - `http://localhost:5173/*` (desenvolvimento)
     - o domínio de produção, quando existir (Etapa 8), ex.: `https://burgermatch.exemplo.com/*`
   - **Restrições de API → Restringir chave:** marque só **Maps JavaScript API** e **Places API (New)**.
3. Salve. A restrição pode levar alguns minutos para valer.

**Por que restringir?** A chave vai dentro do JavaScript do site — qualquer pessoa consegue vê-la. A restrição é o que impede que ela seja usada em outro site ou para outras APIs na sua conta.

## 4. Limitar o uso (recomendado)

Em **APIs e serviços → Places API (New) → Cotas e limites do sistema**, reduza os limites por dia (ex.: algumas centenas de requisições). Assim, mesmo um erro no código não gera uma conta alta.

## 5. Map ID (opcional)

Os marcadores do mapa exigem um Map ID. Sem configurar nada, o app usa `DEMO_MAP_ID`, válido para desenvolvimento. Para produção:
**Google Maps Platform → Gerenciamento de mapas → Criar ID do mapa** (tipo JavaScript).

## 6. Colocar no projeto

1. Copie `.env.example` para `.env.local` (este arquivo **não vai para o Git**).
2. Preencha:

   ```bash
   VITE_GOOGLE_MAPS_API_KEY=sua-chave-aqui
   # opcional:
   VITE_GOOGLE_MAPS_MAP_ID=seu-map-id
   ```

3. **Reinicie** o `npm run dev` (o Vite só lê o `.env.local` ao iniciar).

Nunca cole a chave em issues, prints, commits ou conversas.

## O que gera custo no app

| Ação no app                                   | Chamada                  |
| --------------------------------------------- | ------------------------ |
| Abrir Descobrir/Mapa numa região ou raio novo | 1 busca por proximidade  |
| Abrir Detalhes/Favorito que não veio da busca | 1 consulta de detalhes   |
| Cada foto exibida                             | 1 carregamento de foto   |
| Cada tela com mapa aberta                     | 1 carregamento de mapa   |
| Buscar bairro e escolher uma sugestão         | 1 sessão de Autocomplete |

O app reduz chamadas com cache de 30 minutos, busca única com todos os campos necessários, espera de 300 ms entre digitações e no máximo 10 fotos por local.
