import { MapPinOff } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { googleMapsConfig } from '@/config/env'
import { loadMapsLibrary, loadMarkerLibrary } from '@/services/google/googleMapsLoader'
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { describePlaceShort } from '../utils/describePlace'

/** Paleta oficial (os marcadores do Google não leem as variáveis CSS do Tailwind). */
const COLORS = { ketchup: '#E63B2E', tostado: '#2B1A12', mostarda: '#FFB627', creme: '#FFF4E0' }

declare global {
  interface Window {
    /** Chamado pelo Google quando a chave é inválida, restrita ou sem faturamento. */
    gm_authFailure?: () => void
  }
}

interface GoogleMapViewProps {
  center: Coordinates
  places: readonly BurgerPlace[]
  /** Pontos do enquadramento inicial (padrão: centro + locais). */
  fitTo?: readonly Coordinates[]
  selectedId: string | undefined
  /** Sem ele, os marcadores não são clicáveis (ex.: minimapa). */
  onSelect?: (placeId: string) => void
  showSelectedLabel?: boolean
  /** false = minimapa: sem gestos nem controles. */
  interactive?: boolean
  /** Espaço (px) coberto por algo sobre a base do mapa (ex.: card flutuante no celular). */
  bottomInset?: number
  className?: string
}

interface MapLibraries {
  map: google.maps.Map
  LatLngBounds: typeof google.maps.LatLngBounds
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
  PinElement: typeof google.maps.marker.PinElement
}

const toLatLng = ({ latitude, longitude }: Coordinates) => ({ lat: latitude, lng: longitude })

/** Ponto azul "você está aqui", como no app do Google Maps. */
function createUserDot(): HTMLElement {
  const dot = document.createElement('div')
  dot.className = 'size-5 rounded-full border-3 border-white bg-blue-600 shadow-md'
  return dot
}

/** Balão do selecionado. textContent (e não innerHTML): nomes vindos da API não viram HTML. */
function createLabel(place: BurgerPlace): HTMLElement {
  const box = document.createElement('div')
  box.className =
    'mb-16 w-max max-w-56 rounded-2xl border-2 border-tostado bg-superficie px-3.5 py-2 font-sans text-tostado shadow-offset'
  const name = document.createElement('p')
  name.className = 'truncate font-bold'
  name.textContent = place.name
  box.append(name)
  const details = describePlaceShort(place)
  if (details) {
    const line = document.createElement('p')
    line.className = 'text-sm text-texto-suave'
    line.textContent = details
    box.append(line)
  }
  return box
}

/**
 * Mapa real do Google (Maps JavaScript API) com marcadores avançados.
 * Mesmas props do MockMap: as telas trocam um pelo outro sem outras mudanças.
 *
 * O mapa é criado UMA vez; os efeitos seguintes só atualizam marcadores,
 * enquadramento e seleção (criar mapas de novo é lento e cada carga é cobrada).
 */
export function GoogleMapView({
  center,
  places,
  fitTo,
  selectedId,
  onSelect,
  showSelectedLabel = false,
  interactive = true,
  bottomInset = 0,
  className,
}: GoogleMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [libs, setLibs] = useState<MapLibraries>()
  const [failed, setFailed] = useState(false)
  const markersRef = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>())
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement>(null)
  const labelMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement>(null)
  const clickable = onSelect !== undefined
  const handleSelect = useEffectEvent((placeId: string) => onSelect?.(placeId))

  // 1) Carrega a API e cria o mapa.
  useEffect(() => {
    let cancelled = false
    window.gm_authFailure = () => setFailed(true)

    void Promise.all([loadMapsLibrary(), loadMarkerLibrary()])
      .then(([{ Map }, { AdvancedMarkerElement, PinElement }]) => {
        if (cancelled || !containerRef.current) return
        const map = new Map(containerRef.current, {
          center: toLatLng(center),
          zoom: 14,
          mapId: googleMapsConfig.mapId,
          clickableIcons: false,
          disableDefaultUI: true,
          zoomControl: interactive,
          gestureHandling: interactive ? 'greedy' : 'none',
          keyboardShortcuts: interactive,
        })
        setLibs({ map, LatLngBounds: google.maps.LatLngBounds, AdvancedMarkerElement, PinElement })
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
    // O mapa é criado uma única vez; mudanças de centro são tratadas nos efeitos abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) Enquadra a região (centro + locais) quando ela muda.
  const framingKey = JSON.stringify([center, fitTo ?? places.map((place) => place.location)])
  useEffect(() => {
    if (!libs) return
    const points = [center, ...(fitTo ?? places.map((place) => place.location))]
    if (points.length === 1) {
      libs.map.setCenter(toLatLng(center))
      libs.map.setZoom(15)
      return
    }
    const bounds = new libs.LatLngBounds()
    for (const point of points) bounds.extend(toLatLng(point))
    const edge = interactive ? 48 : 24
    libs.map.fitBounds(bounds, { top: edge, left: edge, right: edge, bottom: edge + bottomInset })
    // framingKey resume center/fitTo/places: refaz o enquadramento só quando eles mudam de fato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libs, framingKey, interactive, bottomInset])

  // 3) Ponto "você está aqui".
  useEffect(() => {
    if (!libs) return
    userMarkerRef.current ??= new libs.AdvancedMarkerElement({
      map: libs.map,
      content: createUserDot(),
      title: 'Você está aqui',
      zIndex: 0,
    })
    userMarkerRef.current.position = toLatLng(center)
  }, [libs, center])

  // 4) Marcadores: cria, atualiza o destaque do selecionado e remove os que saíram.
  useEffect(() => {
    if (!libs) return
    const markers = markersRef.current
    const visibleIds = new Set(places.map((place) => place.placeId))

    for (const [placeId, marker] of markers) {
      if (!visibleIds.has(placeId)) {
        marker.map = null
        markers.delete(placeId)
      }
    }

    for (const place of places) {
      const selected = place.placeId === selectedId
      const pin = new libs.PinElement({
        background: selected ? COLORS.tostado : COLORS.ketchup,
        borderColor: COLORS.tostado,
        glyphColor: selected ? COLORS.mostarda : COLORS.creme,
        scale: selected ? 1.35 : 1,
      })

      let marker = markers.get(place.placeId)
      if (!marker) {
        marker = new libs.AdvancedMarkerElement({
          map: libs.map,
          position: toLatLng(place.location),
          title: place.name,
          gmpClickable: clickable,
        })
        if (clickable) {
          const placeId = place.placeId
          marker.addEventListener('gmp-click', () => handleSelect(placeId))
        }
        markers.set(place.placeId, marker)
      }
      marker.content = pin.element
      marker.zIndex = selected ? 10 : 1
    }
  }, [libs, places, selectedId, clickable])

  // 5) Balão do selecionado + traz o selecionado para a área visível.
  useEffect(() => {
    if (!libs) return
    const selected = places.find((place) => place.placeId === selectedId)

    if (labelMarkerRef.current) labelMarkerRef.current.map = null
    labelMarkerRef.current = null
    if (!selected) return

    const position = toLatLng(selected.location)
    if (showSelectedLabel) {
      labelMarkerRef.current = new libs.AdvancedMarkerElement({
        map: libs.map,
        position,
        content: createLabel(selected),
        zIndex: 20,
        gmpClickable: false,
      })
    }
    if (interactive && !libs.map.getBounds()?.contains(position)) libs.map.panTo(position)
  }, [libs, places, selectedId, showSelectedLabel, interactive])

  // Limpeza ao sair da tela.
  useEffect(() => {
    const markers = markersRef.current
    return () => {
      for (const marker of markers.values()) marker.map = null
      markers.clear()
      if (userMarkerRef.current) userMarkerRef.current.map = null
      if (labelMarkerRef.current) labelMarkerRef.current.map = null
    }
  }, [])

  return (
    <div
      className={cn('relative overflow-hidden bg-creme', className)}
      {...(interactive
        ? { role: 'region', 'aria-label': 'Mapa de hamburguerias' }
        : { 'aria-hidden': true })}
    >
      <div ref={containerRef} className="absolute inset-0" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-creme p-6 text-center">
          <p className="flex max-w-xs flex-col items-center gap-2 text-sm text-texto-suave">
            <MapPinOff aria-hidden="true" className="size-8 text-ketchup-forte" />
            Não foi possível carregar o mapa. Verifique a conexão ou a configuração da chave do
            Google Maps.
          </p>
        </div>
      )}
    </div>
  )
}
