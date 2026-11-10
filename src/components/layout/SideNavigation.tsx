import { Heart, MapPin } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { BrandIcon, Wordmark } from '@/components/ui/Brand'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { useSearchArea } from '@/hooks/useSearchArea'
import { locationStepPath, paths } from '@/routes/paths'
import { cn } from '@/utils/cn'
import { navItems } from './navItems'

const focusRing =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup'

/**
 * Navegação do tablet e do desktop (oculta no celular, que usa a BottomNavigation).
 *
 *   md (768–1023px): barra compacta — ícone com rótulo pequeno embaixo.
 *   lg (≥ 1024px):   barra completa — logo, região, itens com rótulo e contador.
 *
 * Mesma ordem, ícones e destaque do item ativo nas duas larguras.
 */
export function SideNavigation() {
  const { area } = useSearchArea()
  const { favoriteIds } = useFavorites()
  const favoritesCount = favoriteIds.length

  return (
    <aside className="hidden w-24 shrink-0 flex-col gap-6 overflow-y-auto border-r-2 border-tostado bg-superficie px-3 py-6 md:flex lg:w-64 lg:px-5">
      <Link
        to={paths.discover}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl lg:justify-start',
          focusRing,
        )}
      >
        <BrandIcon className="size-10 lg:size-9" />
        <span className="sr-only text-2xl lg:not-sr-only">
          <Wordmark />
        </span>
      </Link>

      {/* Região de busca: leva à tela "Onde você está?" para trocar. */}
      <Link
        to={locationStepPath}
        className={cn(
          'flex flex-col items-center gap-1 rounded-2xl border-2 border-tostado bg-creme px-2 py-2 text-center',
          'hover:bg-white lg:flex-row lg:gap-3 lg:px-4 lg:text-left',
          focusRing,
        )}
      >
        <MapPin
          aria-hidden="true"
          className="size-5 shrink-0 text-ketchup-forte"
          strokeWidth={2.25}
        />
        <span className="flex flex-col leading-tight">
          <span className="sr-only text-xs text-texto-suave lg:not-sr-only">Buscando em</span>
          <span className="text-xs font-bold lg:text-sm">
            <span className="sr-only lg:not-sr-only">{area.label} · </span>
            {area.radiusKm} km
          </span>
          <span className="sr-only"> — alterar região</span>
        </span>
      </Link>

      <nav aria-label="Navegação principal">
        <ul className="flex flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon }) => {
            const badge = to === paths.favorites && favoritesCount > 0 ? favoritesCount : undefined

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-xs font-bold transition-colors',
                      'lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-base',
                      isActive ? 'bg-tostado text-creme' : 'text-tostado hover:bg-tostado/8',
                      focusRing,
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className="size-6 shrink-0 lg:size-5"
                        strokeWidth={2.25}
                        fill={isActive && Icon === Heart ? 'currentColor' : 'none'}
                      />
                      <span className="lg:flex-1">{label}</span>
                      {badge !== undefined && (
                        <span
                          className={cn(
                            'absolute top-1 right-3 min-w-5 rounded-full px-1.5 text-center text-[0.6875rem] leading-5 font-bold',
                            'lg:static lg:text-xs',
                            isActive
                              ? 'bg-ketchup-forte text-white'
                              : 'bg-ketchup/12 text-ketchup-forte',
                          )}
                        >
                          {badge}
                          <span className="sr-only"> salvas</span>
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
