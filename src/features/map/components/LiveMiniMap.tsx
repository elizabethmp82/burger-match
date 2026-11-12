/**
 * Minimapa REAL do painel "Sobre este lugar" (Descobrir, desktop): mostra o ponto
 * da busca e o local do card atual sobre ruas de verdade (MapLibre + OpenFreeMap).
 *
 * - Só para ver: sem arrastar nem zoom (para explorar, há a tela Mapa e o
 *   "Ver rota no Maps"). Assim ele não "rouba" a rolagem da página.
 * - O mesmo mapa é reaproveitado ao passar os cards: só os marcadores e o
 *   enquadramento mudam, sem recriar nada.
 * - Não consulta a Geoapify: os tiles vêm do OpenFreeMap (gratuito, sem créditos).
 * - Carregado sob demanda (React.lazy) e só no desktop.
 */
import '../lib/maplibreSetup'
import { Map as MapLibreMap, Marker } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPinShape } from '@/components/ui/MapPinShape'
import { mapConfig } from '@/config/env'
import type { Coordinates } from '@/types/location.types'
import { cn } from '@/utils/cn'
import { boundsOf } from '../utils/mapCamera'
import { MiniMap } from './MiniMap'
import { UserLocationDot } from './UserLocationDot'

/** Folga em px: em cima, a altura do pino; nas laterais, respiro para os dois pontos. */
const PADDING = { top: 48, bottom: 20, left: 28, right: 28 }
const MAX_ZOOM = 16

interface LiveMiniMapProps {
  center: Coordinates
  destination: Coordinates
  className?: string
}

export default function LiveMiniMap({ center, destination, className }: LiveMiniMapProps) {
  const [map, setMap] = useState<MapLibreMap>()
  const [failed, setFailed] = useState(false)
  /** Enquadramento só na criação; depois, o efeito abaixo acompanha cada card. */
  const [initialBounds] = useState(() => boundsOf([center, destination]))

  const containerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return
      let instance: MapLibreMap
      try {
        instance = new MapLibreMap({
          container,
          style: mapConfig.styleUrl,
          ...(initialBounds && {
            bounds: initialBounds,
            fitBoundsOptions: { padding: PADDING, maxZoom: MAX_ZOOM },
          }),
          interactive: false,
          attributionControl: { compact: true },
        })
      } catch {
        setFailed(true) // sem WebGL: fica o minimapa ilustrativo
        return
      }
      // A atribuição compacta começa aberta e só fecha quando se arrasta o mapa — o que
      // nunca acontece aqui. Fechamos ao carregar: o ícone (i) continua visível e clicável.
      instance.once('load', () => {
        const attribution = container.querySelector('.maplibregl-ctrl-attrib')
        attribution?.classList.remove('maplibregl-compact-show')
        attribution?.removeAttribute('open')
      })
      instance.on('error', () => {
        if (!instance.isStyleLoaded()) setFailed(true)
      })
      const observer = new ResizeObserver(() => instance.resize())
      observer.observe(container)
      setMap(instance)

      return () => {
        observer.disconnect()
        instance.remove()
        setMap(undefined)
      }
    },
    [initialBounds],
  )

  const pinElement = useMemo(() => document.createElement('div'), [])
  const userElement = useMemo(() => document.createElement('div'), [])

  // Card novo: move os marcadores e reenquadra (sem animação, para não distrair no swipe).
  // Só números nas dependências: o efeito roda quando a POSIÇÃO muda, não a cada render.
  const { latitude: centerLat, longitude: centerLng } = center
  const { latitude: placeLat, longitude: placeLng } = destination
  useEffect(() => {
    if (!map) return
    const pin = new Marker({ element: pinElement, anchor: 'bottom' })
      .setLngLat([placeLng, placeLat])
      .addTo(map)
    const user = new Marker({ element: userElement }).setLngLat([centerLng, centerLat]).addTo(map)
    const bounds = boundsOf([
      { latitude: centerLat, longitude: centerLng },
      { latitude: placeLat, longitude: placeLng },
    ])
    if (bounds) map.fitBounds(bounds, { padding: PADDING, maxZoom: MAX_ZOOM, duration: 0 })
    return () => {
      pin.remove()
      user.remove()
    }
  }, [map, pinElement, userElement, centerLat, centerLng, placeLat, placeLng])

  if (failed) return <MiniMap center={center} destination={destination} className={className} />

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border-2 border-tostado', className)}>
      <div
        ref={containerRef}
        role="img"
        aria-label="Mapa com o centro da busca e a localização deste lugar"
        className="h-full w-full"
      />
      {createPortal(<MapPinShape className="w-8 drop-shadow-sm" />, pinElement)}
      {createPortal(<UserLocationDot size="sm" />, userElement)}
    </div>
  )
}
