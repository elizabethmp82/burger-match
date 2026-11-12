/**
 * Mapa real e interativo: MapLibre GL JS + estilo do OpenFreeMap (dados do OpenStreetMap).
 *
 * Este arquivo é carregado SÓ quando a pessoa abre a tela Mapa (React.lazy): a
 * biblioteca é grande e as outras telas não precisam dela.
 *
 * Regras importantes:
 * - Mover ou dar zoom NUNCA busca hamburguerias: a busca depende só da região
 *   escolhida (useNearbyPlaces), não da câmera.
 * - A câmera só se move sozinha em 3 casos: a região mudou (enquadra todos os
 *   locais), a pessoa escolheu um local NA LISTA (centraliza nele) ou tocou em
 *   "Centralizar". Tocar num pino não move a câmera — a pessoa já está olhando para ele.
 * - Os pinos são componentes React (PlaceMarker), "teleportados" (createPortal)
 *   para dentro dos marcadores do MapLibre: o mapa cuida da posição, o React do visual.
 */
import '../lib/maplibreSetup'
import { Map as MapLibreMap, Marker, type FitBoundsOptions, type PaddingOptions } from 'maplibre-gl'
import { MapPinOff } from 'lucide-react'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { mapConfig } from '@/config/env'
import type { Coordinates } from '@/types/location.types'
import type { BurgerPlace } from '@/types/place.types'
import { boundsOf, prefersReducedMotion } from '../utils/mapCamera'
import { MapControls } from './MapControls'
import { PlaceMarker } from './PlaceMarker'
import { UserLocationDot } from './UserLocationDot'

/** Zoom ao abrir, antes de os locais chegarem (~bairro). */
const INITIAL_ZOOM = 13
/** Ao enquadrar, não aproxima demais (um local só ficaria "colado" na tela). */
const FIT_MAX_ZOOM = 16
const ANIMATION_MS = 600

export interface FocusRequest {
  placeId: string
  /** Muda a cada pedido: tocar de novo no mesmo card centraliza de novo. */
  requestId: number
}

export interface BurgerMapProps {
  /** Centro da região escolhida (localização atual ou bairro buscado). */
  center: Coordinates
  /** Identifica a região; quando muda, o mapa reenquadra. */
  areaKey: string
  /** Locais com pino (já filtrados). */
  places: readonly BurgerPlace[]
  /** Todos os locais da região: definem o enquadramento (filtros não mexem na câmera). */
  fitTo: readonly Coordinates[]
  /** false enquanto a busca carrega (ainda não dá para enquadrar). */
  isReady: boolean
  selectedId: string | undefined
  /** Pedido para centralizar num local (vem da lista). */
  focus: FocusRequest | undefined
  onSelect: (placeId: string) => void
  /** Área livre da tela, em px (ex.: espaço do card flutuante no celular). */
  padding: PaddingOptions
  showSelectedLabel?: boolean
  controlsClassName?: string
}

function animation(): Pick<FitBoundsOptions, 'duration'> {
  return { duration: prefersReducedMotion() ? 0 : ANIMATION_MS }
}

/** Enquadra a região: o centro + todos os locais (ou só o centro, se não houver locais). */
function fitArea(
  map: MapLibreMap,
  center: Coordinates,
  fitTo: readonly Coordinates[],
  padding: PaddingOptions,
): void {
  const bounds = boundsOf([center, ...fitTo])
  if (!bounds || fitTo.length === 0) {
    map.easeTo({ center: [center.longitude, center.latitude], zoom: INITIAL_ZOOM, ...animation() })
    return
  }
  map.fitBounds(bounds, { padding, maxZoom: FIT_MAX_ZOOM, ...animation() })
}

export default function BurgerMap({
  center,
  areaKey,
  places,
  fitTo,
  isReady,
  selectedId,
  focus,
  onSelect,
  padding,
  showSelectedLabel = false,
  controlsClassName,
}: BurgerMapProps) {
  const [map, setMap] = useState<MapLibreMap>()
  const [failure, setFailure] = useState<'webgl' | 'style'>()
  /** Última região enquadrada (ref: mudar não precisa redesenhar nada). */
  const fittedAreaKey = useRef<string>(undefined)
  /** Centro só na criação do mapa; depois, quem move a câmera são os efeitos abaixo. */
  const [initialCenter] = useState(center)

  // Cria o mapa quando o <div> aparece e o destrói quando ele sai (ref com limpeza, React 19).
  const containerRef = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return
      let instance: MapLibreMap
      try {
        const { latitude, longitude } = initialCenter
        instance = new MapLibreMap({
          container,
          style: mapConfig.styleUrl,
          center: [longitude, latitude],
          zoom: INITIAL_ZOOM,
          minZoom: 3,
          maxZoom: 19,
          // Sem girar nem inclinar: para achar hamburguerias, o norte sempre para cima.
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          // Atribuição (OpenFreeMap, OpenMapTiles, OpenStreetMap) sempre visível.
          attributionControl: { compact: true },
        })
      } catch {
        // Sem WebGL (aparelho/navegador antigo): a lista continua funcionando.
        setFailure('webgl')
        return
      }
      instance.touchZoomRotate.disableRotation()
      instance.keyboard.disableRotation()
      // Estilo indisponível (ex.: servidor do mapa fora do ar): avisa, sem quebrar a tela.
      instance.on('error', () => {
        if (!instance.isStyleLoaded()) setFailure('style')
      })
      instance.once('load', () => setFailure(undefined))

      // O mapa precisa saber quando o espaço dele muda (ex.: girar o celular, abrir a lista).
      const observer = new ResizeObserver(() => instance.resize())
      observer.observe(container)
      setMap(instance)

      return () => {
        observer.disconnect()
        instance.remove()
        setMap(undefined)
      }
    },
    [initialCenter],
  )

  // ----- Pinos -----

  // Um <div> por local: o MapLibre posiciona o <div>, o React desenha o pino dentro.
  // Recriado só quando o CONJUNTO de locais muda (não a cada renderização).
  const placeIdsKey = places.map((place) => place.placeId).join('|')
  const markerElements = useMemo(
    () =>
      new Map(
        placeIdsKey
          .split('|')
          .filter(Boolean)
          .map((placeId) => [placeId, document.createElement('div')]),
      ),
    [placeIdsKey],
  )
  const placesById = useMemo(() => new Map(places.map((place) => [place.placeId, place])), [places])

  const markerPosition = useEffectEvent((placeId: string): [number, number] | undefined => {
    const place = placesById.get(placeId)
    return place && [place.location.longitude, place.location.latitude]
  })

  /** Marcadores no mapa, por local (para trazer o selecionado para a frente). */
  const markersRef = useRef(new Map<string, Marker>())

  useEffect(() => {
    if (!map) return
    const markers = new Map<string, Marker>()
    for (const [placeId, element] of markerElements) {
      const position = markerPosition(placeId)
      if (position) {
        markers.set(
          placeId,
          new Marker({ element, anchor: 'bottom' }).setLngLat(position).addTo(map),
        )
      }
    }
    markersRef.current = markers
    return () => {
      for (const marker of markers.values()) marker.remove()
      markersRef.current = new Map()
    }
  }, [map, markerElements])

  // Pino selecionado por cima dos vizinhos.
  useEffect(() => {
    for (const [placeId, marker] of markersRef.current) {
      marker.getElement().style.zIndex = placeId === selectedId ? '2' : '1'
    }
  }, [map, markerElements, selectedId])

  // "Você está aqui" (ou o centro do bairro escolhido).
  const userElement = useMemo(() => document.createElement('div'), [])
  useEffect(() => {
    if (!map) return
    const marker = new Marker({ element: userElement })
      .setLngLat([center.longitude, center.latitude])
      .addTo(map)
    return () => void marker.remove()
  }, [map, userElement, center.latitude, center.longitude])

  // ----- Câmera -----

  const fitCurrentArea = useEffectEvent((target: MapLibreMap) => {
    fitArea(target, center, fitTo, padding)
  })

  // Região nova (ou a 1ª vez com os locais carregados): enquadra UMA vez.
  useEffect(() => {
    if (!map || !isReady || fittedAreaKey.current === areaKey) return
    fittedAreaKey.current = areaKey
    fitCurrentArea(map)
  }, [map, isReady, areaKey])

  /** Centraliza no local escolhido na lista, sem mudar o zoom (se já estiver perto). */
  const focusPlace = useEffectEvent((placeId: string) => {
    const place = placesById.get(placeId)
    if (!map || !place) return
    map.easeTo({
      center: [place.location.longitude, place.location.latitude],
      zoom: Math.max(map.getZoom(), 14),
      padding,
      ...animation(),
    })
  })

  useEffect(() => {
    if (focus) focusPlace(focus.placeId)
  }, [focus])

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        role="region"
        aria-label="Mapa de hamburguerias. Use as setas do teclado para mover e + ou − para zoom."
        // h-full/w-full (e não absolute): o CSS do MapLibre força position: relative aqui.
        className="burger-map h-full w-full"
      />

      {failure && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-creme/90 p-6 text-center">
          <div className="flex max-w-xs flex-col items-center gap-2">
            <MapPinOff aria-hidden="true" className="size-8 text-tostado" strokeWidth={2} />
            <p className="font-bold">
              {failure === 'webgl'
                ? 'Este aparelho não consegue exibir o mapa.'
                : 'O mapa não carregou agora.'}
            </p>
            <p className="text-sm text-texto-suave">
              {failure === 'webgl'
                ? 'Os lugares continuam na lista.'
                : 'Tente de novo em instantes. Os lugares continuam na lista.'}
            </p>
          </div>
        </div>
      )}

      {map && !failure && (
        <MapControls
          onZoomIn={() => map.zoomIn(animation())}
          onZoomOut={() => map.zoomOut(animation())}
          onRecenter={() => fitArea(map, center, fitTo, padding)}
          className={controlsClassName}
        />
      )}

      {/* Pinos e "você está aqui", desenhados pelo React dentro dos marcadores do mapa. */}
      {[...markerElements].map(([placeId, element]) => {
        const place = placesById.get(placeId)
        return (
          place &&
          createPortal(
            <PlaceMarker
              place={place}
              selected={placeId === selectedId}
              onSelect={onSelect}
              showLabel={showSelectedLabel}
            />,
            element,
            placeId,
          )
        )
      })}
      {createPortal(<UserLocationDot />, userElement)}
    </div>
  )
}
