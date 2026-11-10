import { ChevronDown, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { locationStepPath } from '@/routes/paths'
import type { SearchArea } from '@/types/location.types'

/** Região e raio atuais. Tocar leva à tela "Onde você está?" para trocar a região. */
export function AreaPill({ area }: { area: SearchArea }) {
  return (
    <Link
      to={locationStepPath}
      className="mx-auto inline-flex items-center gap-2 rounded-full border-2 border-tostado bg-superficie px-4 py-2 text-sm font-bold hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup md:hidden"
    >
      <MapPin aria-hidden="true" className="size-4 text-ketchup-forte" strokeWidth={2.5} />
      <span>
        {area.label} · raio de {area.radiusKm} km
        <span className="sr-only"> — alterar região</span>
      </span>
      <ChevronDown aria-hidden="true" className="size-4" strokeWidth={2.5} />
    </Link>
  )
}
