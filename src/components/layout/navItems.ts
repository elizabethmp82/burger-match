import { Compass, Heart, MapPin, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * Itens da navegação principal. Fonte única para a barra inferior (celular)
 * e a barra lateral (tablet/desktop): mesma ordem e mesmos ícones em todas as telas.
 */
export const navItems: readonly NavItem[] = [
  { to: paths.discover, label: 'Descobrir', icon: Compass },
  { to: paths.favorites, label: 'Favoritos', icon: Heart },
  { to: paths.map, label: 'Mapa', icon: MapPin },
]
