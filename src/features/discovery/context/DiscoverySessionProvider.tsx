import { useMemo, useState, type ReactNode } from 'react'
import {
  DiscoverySessionContext,
  type DiscoverySessionContextValue,
  type SwipeHistoryEntry,
} from '../hooks/useDiscoverySession'

/**
 * Guarda as decisões da sessão atual (RN06) acima das rotas: assim o baralho
 * não volta ao início quando o usuário abre Detalhes ou troca de aba.
 */
export function DiscoverySessionProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<readonly SwipeHistoryEntry[]>([])

  const value = useMemo<DiscoverySessionContextValue>(() => ({ history, setHistory }), [history])

  return <DiscoverySessionContext value={value}>{children}</DiscoverySessionContext>
}
