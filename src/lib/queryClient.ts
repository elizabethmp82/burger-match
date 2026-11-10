import { QueryClient } from '@tanstack/react-query'

/**
 * Cache das consultas (TanStack Query).
 *
 * Os valores priorizam ECONOMIA, já que cada chamada ao Google é cobrada:
 * - staleTime 30 min: dentro desse tempo, voltar a uma tela não chama a API de novo;
 * - sem refetch ao voltar o foco para a aba;
 * - só 1 nova tentativa em caso de erro (rede instável), não 3.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60_000,
      gcTime: 60 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
