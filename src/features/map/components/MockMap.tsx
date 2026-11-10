import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { createBoxProjection, type BoxInsets } from '../utils/projectToBox'
import { PlaceMarker } from './PlaceMarker'
import { SelectedPlaceLabel } from './SelectedPlaceLabel'

/** Área útil no celular/tablet: a parte de baixo fica livre para o card flutuante. */
const DEFAULT_INSETS: BoxInsets = { top: 22, bottom: 62, left: 12, right: 88 }

interface MockMapProps {
  center: Coordinates
  /** Locais com marcador. */
  places: readonly BurgerPlace[]
  /**
   * Pontos que definem o enquadramento. Passe TODOS os locais da região para que
   * os marcadores não mudem de lugar quando um filtro esconde alguns deles.
   */
  fitTo?: readonly Coordinates[]
  selectedId: string | undefined
  onSelect: (placeId: string) => void
  insets?: BoxInsets
  /** Balão com nome e nota sobre o marcador selecionado (desktop). */
  showSelectedLabel?: boolean
}

/**
 * Mapa ILUSTRATIVO da Etapa 2: posiciona os marcadores proporcionalmente às
 * coordenadas sobre um fundo desenhado. Na Etapa 4 vira o Google Maps (BurgerMap).
 */
export function MockMap({
  center,
  places,
  fitTo,
  selectedId,
  onSelect,
  insets = DEFAULT_INSETS,
  showSelectedLabel = false,
}: MockMapProps) {
  const project = createBoxProjection(
    [center, ...(fitTo ?? places.map((place) => place.location))],
    insets,
  )
  const userPosition = project(center)
  const selected = places.find((place) => place.placeId === selectedId)

  return (
    <div className="mock-map absolute inset-0" role="group" aria-label="Mapa de hamburguerias">
      {/* Parques decorativos */}
      <div
        aria-hidden="true"
        className="absolute top-[14%] right-[6%] h-28 w-32 rounded-lg bg-alface/20"
      />
      <div
        aria-hidden="true"
        className="absolute top-[50%] left-[5%] h-20 w-28 rounded-lg bg-alface/20"
      />

      {/* Você está aqui */}
      <div
        style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
        className="absolute grid size-20 -translate-1/2 place-items-center rounded-full bg-blue-500/15"
      >
        <span className="size-5 rounded-full border-3 border-white bg-blue-600 shadow" />
        <span className="sr-only">Você está aqui</span>
      </div>

      {places.map((place) => (
        <PlaceMarker
          key={place.placeId}
          place={place}
          position={project(place.location)}
          selected={place.placeId === selectedId}
          onSelect={onSelect}
        />
      ))}

      {showSelectedLabel && selected && (
        <SelectedPlaceLabel place={selected} position={project(selected.location)} />
      )}
    </div>
  )
}
