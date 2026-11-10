import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { describePlaceShort } from '../utils/describePlace'
import type { BoxPosition } from '../utils/projectToBox'

/**
 * Balão sobre o marcador selecionado (mockup Desktop · Mapa).
 * Decorativo para o mouse: a mesma informação está na lista ao lado, então
 * fica escondido de leitores de tela para não ser lido duas vezes.
 */
export function SelectedPlaceLabel({
  place,
  position,
}: {
  place: BurgerPlace
  position: BoxPosition
}) {
  // Perto da borda direita, o balão abre para a esquerda do marcador.
  const opensLeft = position.x > 65
  const details = describePlaceShort(place)

  return (
    <div
      aria-hidden="true"
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      className={cn(
        'pointer-events-none absolute z-30 w-max max-w-56 rounded-2xl border-2 border-tostado bg-superficie px-3.5 py-2 shadow-offset',
        // Acima da ponta do pino (que mede ~80px) e ao lado dele.
        '-translate-y-[calc(100%+3rem)]',
        opensLeft ? '-translate-x-[calc(100%+1.75rem)]' : 'translate-x-7',
      )}
    >
      <p className="truncate font-bold">{place.name}</p>
      {details && <p className="text-sm text-texto-suave">{details}</p>}
    </div>
  )
}
