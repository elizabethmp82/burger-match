import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { SearchAreaProvider } from '@/components/providers/SearchAreaProvider'
import { DiscoverySessionProvider } from '@/features/discovery/context/DiscoverySessionProvider'
import { FavoritesProvider } from '@/features/favorites/context/FavoritesProvider'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes/AppRoutes'

/**
 * Os providers ficam acima do roteador para que o estado (cache de dados,
 * região, favoritos, decisões do baralho) sobreviva à troca de telas.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchAreaProvider>
        <FavoritesProvider>
          <DiscoverySessionProvider>
            <RouterProvider router={router} />
          </DiscoverySessionProvider>
        </FavoritesProvider>
      </SearchAreaProvider>
    </QueryClientProvider>
  )
}
