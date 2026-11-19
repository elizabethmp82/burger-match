# Serviços de dados e mapa

O BurgerMatch não tem backend: o navegador conversa direto com serviços gratuitos baseados no OpenStreetMap. Nenhum deles exige cartão de crédito ou conta de faturamento.

> Planos gratuitos têm limites e podem mudar. Antes de publicar, confira sempre as páginas oficiais linkadas abaixo.

| Serviço                                         | Para quê                           | Precisa de chave? |
| ----------------------------------------------- | ---------------------------------- | ----------------- |
| [Geoapify Places API](https://www.geoapify.com) | Hamburguerias próximas e detalhes  | Sim (gratuita)    |
| [Nominatim](https://nominatim.org)              | Bairro/cidade fora da lista local  | Não               |
| [OpenFreeMap](https://openfreemap.org)          | Estilo e imagens (tiles) do mapa   | Não               |
| [Overpass API](https://overpass-api.de) (temp.) | Fonte alternativa de hamburguerias | Não               |

Os dados vêm do [OpenStreetMap](https://www.openstreetmap.org/copyright) (licença ODbL): o app mostra o crédito "© colaboradores do OpenStreetMap" sempre que exibe esses dados.

## Modo demonstração (sem nenhum serviço)

Para desenvolver ou apresentar sem acessar a rede:

```dotenv
VITE_PLACES_PROVIDER=mock
```

Hamburguerias simuladas aparecem em volta de qualquer região escolhida; a busca de bairro usa só a lista local.

## Geoapify (fonte principal)

1. Crie uma conta em <https://myprojects.geoapify.com> (plano gratuito, sem cartão).
2. Crie um projeto e copie a **API key**.
3. No `.env.local`:

   ```dotenv
   VITE_PLACES_PROVIDER=geoapify
   VITE_GEOAPIFY_API_KEY=sua-chave-aqui
   ```

4. **Restrinja a chave.** Ela vai no JavaScript do navegador, então qualquer pessoa pode vê-la. No painel do projeto, em _API keys → Allowed origins_ (ou equivalente), libere só:
   - `http://localhost:5173` (desenvolvimento)
   - `http://localhost:4173` (`npm run preview`)
   - o domínio publicado, quando existir (Etapa 8)

5. Reinicie o `npm run dev` (variáveis só são lidas na inicialização).

Sem chave, o app não chama a API: as telas avisam que a busca não está configurada.

**Como o app economiza créditos:** 40 locais por página (≤ 2 créditos), página seguinte só pelo botão, busca complementar só sob pedido, cache de 30 min na memória e na aba (`sessionStorage`), nenhum pedido repetido automaticamente. Limites atuais do plano: <https://www.geoapify.com/pricing/>.

## Nominatim (busca de bairro/cidade)

Usado só quando a pessoa confirma "Buscar em todo o mapa" (ou aperta Enter sem sugestão na lista local). O servidor público tem [regras de uso](https://operations.osmfoundation.org/policies/nominatim/) que o app segue: no máximo 1 pedido por segundo, sem autocomplete, cache dos resultados e crédito ao OSM.

Não precisa de configuração. Para usar outro servidor (próprio ou de um provedor):

```dotenv
VITE_NOMINATIM_URL=https://seu-servidor-nominatim.exemplo.com
```

## Mapa (MapLibre + OpenFreeMap)

O estilo padrão é o "liberty" do OpenFreeMap: sem chave, sem limite de visualizações, uso comercial permitido, mas sem garantia de disponibilidade (SLA). Para trocar:

```dotenv
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/positron
```

Qualquer estilo compatível com MapLibre funciona (outros provedores podem exigir chave).

## Overpass (alternativa temporária)

```dotenv
VITE_PLACES_PROVIDER=overpass
VITE_OVERPASS_URL=   # vazio = https://overpass-api.de/api/interpreter
```

Os servidores públicos da Overpass costumam ficar sobrecarregados; por isso a Geoapify é a principal. Este provider será reavaliado antes da publicação.

## Segurança

- Toda variável `VITE_*` é **pública** (vai para o bundle). Nunca coloque segredos de verdade nelas.
- URLs de serviço configuráveis só aceitam `https` (ou `http` em `localhost`); valores inválidos são ignorados.
- A chave da Geoapify nunca aparece em mensagens de erro ou logs do app.
