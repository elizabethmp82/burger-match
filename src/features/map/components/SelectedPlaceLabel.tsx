import type { BurgerPlace } from '@/types/place.types'
import { describePlaceShort } from '../utils/describePlace'

/**
 * Balão acima do marcador selecionado (mockup Desktop · Mapa).
 * Decorativo para o mouse: a mesma informação está na lista ao lado, então
 * fica escondido de leitores de tela para não ser lido duas vezes.
 */
export function SelectedPlaceLabel({ place }: { place: BurgerPlace }) {
  const details = describePlaceShort(place)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-56 -translate-x-1/2 rounded-2xl border-2 border-tostado bg-superficie px-3.5 py-2 shadow-offset"
    >
      <p className="truncate font-bold">{place.name}</p>
      {details && <p className="text-sm text-texto-suave">{details}</p>}
    </div>
  )
}
