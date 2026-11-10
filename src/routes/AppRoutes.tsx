import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireLocation } from '@/components/layout/RequireLocation'
import { DiscoverPage } from '@/features/discovery/pages/DiscoverPage'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'
import { MapPage } from '@/features/map/pages/MapPage'
import { WelcomePage } from '@/features/onboarding/pages/WelcomePage'
import { PlaceDetailsPage } from '@/features/place-details/pages/PlaceDetailsPage'
import { paths } from './paths'

/**
 * Boas-vindas fica fora do AppLayout (sem navegação).
 * Detalhes fica dentro: no tablet/desktop mostra a barra lateral, e no celular
 * o AppLayout esconde a navegação inferior nesta rota (docs/scope.md §3).
 */
export const router = createBrowserRouter([
  { path: paths.welcome, element: <WelcomePage /> },
  {
    element: <AppLayout />,
    children: [
      {
        path: paths.discover,
        element: (
          <RequireLocation>
            <DiscoverPage />
          </RequireLocation>
        ),
      },
      { path: paths.favorites, element: <FavoritesPage /> },
      {
        path: paths.map,
        element: (
          <RequireLocation>
            <MapPage />
          </RequireLocation>
        ),
      },
      { path: paths.placeDetails, element: <PlaceDetailsPage /> },
    ],
  },
  { path: '*', element: <Navigate to={paths.welcome} replace /> },
])
