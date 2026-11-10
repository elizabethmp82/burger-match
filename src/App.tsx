import { RouterProvider } from 'react-router'
import { SearchAreaProvider } from '@/components/providers/SearchAreaProvider'
import { DiscoverySessionProvider } from '@/features/discovery/context/DiscoverySessionProvider'
import { FavoritesProvider } from '@/features/favorites/context/FavoritesProvider'
import { router } from '@/routes/AppRoutes'

/**
 * Os providers ficam acima do roteador para que o estado (região, favoritos,
 * decisões do baralho) sobreviva à troca de telas.
 */
export function App() {
  return (
    <SearchAreaProvider>
      <FavoritesProvider>
        <DiscoverySessionProvider>
          <RouterProvider router={router} />
        </DiscoverySessionProvider>
      </FavoritesProvider>
    </SearchAreaProvider>
  )
}
