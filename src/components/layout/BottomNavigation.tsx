import { Heart } from 'lucide-react'
import { NavLink } from 'react-router'
import { navItems } from './navItems'

/** Navegação do celular. A partir de 768px (md) é substituída pela SideNavigation. */
export function BottomNavigation() {
  return (
    <nav
      aria-label="Navegação principal"
      className="shrink-0 border-t-2 border-tostado bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
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
