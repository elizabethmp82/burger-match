import { MapPinOff } from 'lucide-react'
import { useState } from 'react'
import { PlaceRow } from '@/components/place/PlaceRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { useNearbyPlaces } from '@/hooks/usePlaces'
import { useSearchArea } from '@/hooks/useSearchArea'
import { MockMap } from '../components/MockMap'

export function MapPage() {
  const { area } = useSearchArea()
  const places = useNearbyPlaces()
  const [selectedId, setSelectedId] = useState<string>()

  // Sem seleção (ou se o selecionado saiu do raio), destaca o mais próximo.
  const selected = places.find((place) => place.placeId === selectedId) ?? places[0]

  return (
    <div className="relative h-full min-h-[28rem] overflow-hidden">
      <h1 className="sr-only">Mapa</h1>

      <MockMap
        center={area.center}
        places={places}
        selectedId={selected?.placeId}
        onSelect={setSelectedId}
      />

      <p className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-tostado bg-superficie px-3 py-1 text-xs font-semibold whitespace-nowrap">
        Mapa ilustrativo · {area.label}, {area.radiusKm} km
      </p>

      {selected ? (
        <div className="absolute inset-x-4 bottom-4 z-30" aria-live="polite">
          <PlaceRow place={selected} showReviewCount className="shadow-offset" />
        </div>
      ) : (
        <div className="absolute inset-x-4 bottom-4 z-30 rounded-3xl border-2 border-tostado bg-superficie px-4">
          <EmptyState
            icon={MapPinOff}
            title="Nada por aqui"
            description={`Nenhuma hamburgueria num raio de ${area.radiusKm} km.`}
            className="py-6"
          />
        </div>
      )}
    </div>
  )
}
