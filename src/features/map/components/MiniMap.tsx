import { MapPinShape } from '@/components/ui/MapPinShape'
import type { Coordinates } from '@/types/location.types'
import { cn } from '@/utils/cn'
import { createBoxProjection } from '../utils/projectToBox'

interface MiniMapProps {
  center: Coordinates
  destination: Coordinates
  className?: string
}

/**
 * Minimapa ILUSTRATIVO (não interativo): você e o local escolhido.
 * Decorativo — a informação útil (endereço e distância) está em texto ao lado.
 * Na Etapa 4 pode virar um mapa estático do Google.
 */
export function MiniMap({ center, destination, className }: MiniMapProps) {
  const project = createBoxProjection([center, destination], {
    top: 35,
    bottom: 75,
    left: 22,
    right: 78,
  })
  const user = project(center)
  const place = project(destination)

  return (
    <div
      aria-hidden="true"
      className={cn(
        'mock-map relative overflow-hidden rounded-2xl border-2 border-tostado',
        className,
      )}
    >
      <div className="absolute top-[12%] right-[8%] h-2/5 w-1/4 rounded-md bg-alface/20" />
      <span
        style={{ left: `${user.x}%`, top: `${user.y}%` }}
        className="absolute size-3.5 -translate-1/2 rounded-full border-2 border-white bg-blue-600 shadow"
      />
      <span
        style={{ left: `${place.x}%`, top: `${place.y}%` }}
        className="absolute w-8 -translate-x-1/2 -translate-y-full"
      >
        <MapPinShape className="w-full" />
      </span>
    </div>
  )
}
