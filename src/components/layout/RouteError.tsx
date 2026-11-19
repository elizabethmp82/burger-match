import { TriangleAlert } from 'lucide-react'
import { useRouteError } from 'react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { EmptyState } from '@/components/ui/EmptyState'
import { paths } from '@/routes/paths'

/**
 * Tela de erro das rotas: substitui a mensagem técnica padrão do React Router.
 * Causa mais comum: um arquivo do app que não carregou (sem internet ou versão nova
 * publicada) — recarregar resolve.
 */
export function RouteError() {
  const error = useRouteError()
  console.error('[app] Erro inesperado na tela.', error)

  return (
    <main className="grid min-h-dvh place-items-center bg-creme px-6">
      <EmptyState
        icon={TriangleAlert}
        title="Algo deu errado"
        description="Não foi possível abrir esta tela. Verifique sua conexão e recarregue a página."
        titleAs="h1"
        className="max-w-sm"
      >
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={buttonClasses('primary', 'w-full')}
        >
          Recarregar
        </button>
        {/* <a> e não <Link>: recomeça o app do zero, sem o estado que falhou. */}
        <a href={paths.welcome} className={buttonClasses('secondary', 'w-full')}>
          Voltar ao início
        </a>
      </EmptyState>
    </main>
  )
}
