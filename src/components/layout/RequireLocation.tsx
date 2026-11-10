import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSearchArea } from '@/hooks/useSearchArea'
import { locationStepPath } from '@/routes/paths'

/** Estado de navegação levado à tela "Onde você está?" para voltar depois. */
export interface LocationRedirectState {
  from: string
}

/**
 * Telas que dependem da localização (Descobrir, Mapa): sem região escolhida,
 * manda para "Onde você está?" (RN02). Depois da escolha, o usuário volta para
 * a tela que tentou abrir.
 */
export function RequireLocation({ children }: { children: ReactNode }) {
  const { hasChosenLocation } = useSearchArea()
  const location = useLocation()

  if (!hasChosenLocation) {
    const state: LocationRedirectState = { from: location.pathname }
    return <Navigate to={locationStepPath} replace state={state} />
  }

  return children
}
