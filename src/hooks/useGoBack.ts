import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

/**
 * "Voltar" que funciona mesmo quando a página foi aberta direto pelo link:
 * se houver histórico dentro do app, volta uma página; senão, vai para `fallback`.
 * (O React Router marca a primeira entrada do histórico com key === 'default'.)
 */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate()
  const location = useLocation()
  const hasAppHistory = location.key !== 'default'

  return useCallback(() => {
    if (hasAppHistory) {
      void navigate(-1)
    } else {
      void navigate(fallback, { replace: true })
    }
  }, [hasAppHistory, navigate, fallback])
}
