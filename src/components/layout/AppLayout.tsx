import { Outlet } from 'react-router'
import { BottomNavigation } from './BottomNavigation'

/**
 * Layout das telas principais: conteúdo rolável + navegação inferior fixa.
 * A largura é limitada para manter a proporção mobile-first em telas grandes.
 */
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-4 pt-6 pb-24">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  )
}
