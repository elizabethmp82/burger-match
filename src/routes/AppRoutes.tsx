import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { DiscoverPage } from '@/features/discovery/pages/DiscoverPage'
import { FavoritesPage } from '@/features/favorites/pages/FavoritesPage'
import { MapPage } from '@/features/map/pages/MapPage'
import { WelcomePage } from '@/features/onboarding/pages/WelcomePage'
import { PlaceDetailsPage } from '@/features/place-details/pages/PlaceDetailsPage'
import { paths } from './paths'

/**
 * Boas-vindas e Detalhes ficam fora do AppLayout (sem navegação inferior),
 * conforme docs/scope.md §3.
 */
export const router = createBrowserRouter([
  { path: paths.welcome, element: <WelcomePage /> },
  {
    element: <AppLayout />,
    children: [
      { path: paths.discover, element: <DiscoverPage /> },
      { path: paths.favorites, element: <FavoritesPage /> },
      { path: paths.map, element: <MapPage /> },
    ],
  },
  { path: paths.placeDetails, element: <PlaceDetailsPage /> },
  { path: '*', element: <Navigate to={paths.welcome} replace /> },
])
