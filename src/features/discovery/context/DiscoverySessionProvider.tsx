import { useMemo, useState, type ReactNode, type SetStateAction } from 'react'
import { useSearchArea } from '@/hooks/useSearchArea'
import {
  DiscoverySessionContext,
  type DiscoverySessionContextValue,
  type SwipeHistoryEntry,
} from '../hooks/useDiscoverySession'

const NO_ENTRIES: readonly SwipeHistoryEntry[] = []

interface SessionState {
  /** Região a que estas decisões pertencem. */
  areaKey: string
  entries: readonly SwipeHistoryEntry[]
}

/**
 * Guarda as decisões da sessão atual (RN06) acima das rotas: assim o baralho
 * não volta ao início quando o usuário abre Detalhes ou troca de aba.
 *
 * Trocar de região (outro bairro, GPS) começa uma sessão nova: as decisões
 * guardadas pertencem à região anterior e são ignoradas. Os favoritos ficam.
 * Mudar só o raio NÃO reinicia (ampliar o raio acrescenta cards ao baralho).
 */
export function DiscoverySessionProvider({ children }: { children: ReactNode }) {
  const { area } = useSearchArea()
  const areaKey = `${area.center.latitude},${area.center.longitude}`
  const [session, setSession] = useState<SessionState>({ areaKey, entries: NO_ENTRIES })

  // Estado derivado: se a região mudou, a sessão guardada é de outra região.
  const history = session.areaKey === areaKey ? session.entries : NO_ENTRIES

  const value = useMemo<DiscoverySessionContextValue>(
    () => ({
      history,
      setHistory: (action: SetStateAction<readonly SwipeHistoryEntry[]>) =>
        setSession((current) => {
          const base = current.areaKey === areaKey ? current.entries : NO_ENTRIES
          return {
            areaKey,
            entries: typeof action === 'function' ? action(base) : action,
          }
        }),
    }),
    [history, areaKey],
  )

  return <DiscoverySessionContext value={value}>{children}</DiscoverySessionContext>
}
