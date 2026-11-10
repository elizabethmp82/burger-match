import { Link } from 'react-router'
import logo from '@/assets/logos/burgermatch-logo.png'
import { paths } from '@/routes/paths'

/** Placeholder da Etapa 1 — conteúdo completo na Etapa 2. */
export function WelcomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-10 px-6">
      <img src={logo} alt="BurgerMatch — Encontre sua hamburgueria ideal" className="w-full" />
      <Link
        to={paths.discover}
        className="w-full rounded-2xl border-2 border-tostado bg-ketchup py-4 text-center text-lg font-bold text-white shadow-offset transition-transform active:translate-y-1 active:shadow-none"
      >
        Começar agora
      </Link>
    </main>
  )
}
