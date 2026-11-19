import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { buttonClasses } from './buttonStyles'

/**
 * Registra o service worker (PWA) e avisa quando há uma versão nova do app.
 *
 * A atualização NÃO é automática: recarregar no meio do uso faria a pessoa perder
 * o baralho e a região escolhida. Ela decide quando atualizar.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      // Sem service worker o app funciona igual, só sem cache offline.
      console.warn('[pwa] Não foi possível registrar o service worker.', error)
    },
  })

  if (!needRefresh) return null

  return (
    // bottom-24 no celular: fica acima da barra de navegação inferior.
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border-2 border-tostado bg-superficie p-4 shadow-offset md:bottom-6"
    >
      <p className="flex items-center gap-2 font-semibold">
        <RefreshCw aria-hidden="true" className="size-4 shrink-0 text-ketchup-forte" />
        Nova versão do BurgerMatch disponível.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className={buttonClasses('primary', 'flex-1 py-2.5 text-base')}
        >
          Atualizar
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className={buttonClasses('secondary', 'flex-1')}
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
