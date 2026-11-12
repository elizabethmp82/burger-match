import { QueryClient } from '@tanstack/react-query'

/**
 * Cache das consultas (TanStack Query).
 *
 * Os serviços de dados são GRATUITOS e têm limites de uso (Geoapify: créditos
 * diários do plano gratuito). Por isso os valores priorizam poupar pedidos:
 * - staleTime 30 min: dentro desse tempo, voltar a uma tela não consulta de novo;
 * - pedidos iguais ao mesmo tempo viram um só (deduplicação automática da biblioteca);
 * - sem refetch ao voltar o foco para a aba;
 * - SEM novas tentativas automáticas: se falhar, a tela explica e oferece
 *   "Tentar de novo" — a pessoa decide (nada de insistir num servidor sobrecarregado).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60_000,
      gcTime: 60 * 60_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})
