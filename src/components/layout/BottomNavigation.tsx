import { Compass, Heart, MapPin, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { paths } from '@/routes/paths'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: readonly NavItem[] = [
  { to: paths.discover, label: 'Descobrir', icon: Compass },
  { to: paths.favorites, label: 'Favoritos', icon: Heart },
  { to: paths.map, label: 'Mapa', icon: MapPin },
]

export function BottomNavigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-tostado bg-superficie pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 py-3 text-sm font-semibold transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ketchup',
                  isActive ? 'text-ketchup' : 'text-texto-suave hover:text-tostado',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    aria-hidden="true"
                    className="size-6"
                    strokeWidth={2.25}
                    fill={isActive && Icon === Heart ? 'currentColor' : 'none'}
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
