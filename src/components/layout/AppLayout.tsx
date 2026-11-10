import { Outlet, useMatch } from 'react-router'
import { paths } from '@/routes/paths'
import { BottomNavigation } from './BottomNavigation'
import { SideNavigation } from './SideNavigation'

/**
 * Layout das telas principais. Ocupa exatamente a altura da tela (h-dvh)
 * e só o <main> rola — assim telas como o Mapa podem usar h-full.
 *
 *   Celular (< 768px): coluna de até 448px, navegação inferior (exceto em Detalhes).
 *   Tablet/desktop:    barra lateral à esquerda + conteúdo na largura restante.
 *                      Cada página limita a própria largura (page-container).
 */
export function AppLayout() {
  // No celular, Detalhes não tem navegação inferior (tem o próprio botão Voltar).
  const isDetails = useMatch(paths.placeDetails) !== null

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col md:max-w-none md:flex-row">
      <SideNavigation />
      {/* relative: mantém elementos absolutos (ex.: avisos sr-only) dentro da área que rola. */}
      <main className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>
      {!isDetails && <BottomNavigation />}
    </div>
  )
}
