import { useCallback, useEffect, useState } from 'react'
import {
  GeolocationError,
  getCurrentPosition,
  getGeolocationPermission,
  type GeolocationErrorCode,
} from '@/services/location/geolocationService'
import type { Coordinates } from '@/types/location.types'

export type GeolocationStatus = 'idle' | 'locating' | 'error'

/**
 * Pedido de localização com estados para a interface:
 *   idle → locating → (sucesso: devolve as coordenadas) | error
 *
 * `blocked` indica, antes de qualquer clique, que a permissão já foi negada
 * (Permissions API). Assim a tela pode sugerir a busca manual de cara (RN03).
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [errorCode, setErrorCode] = useState<GeolocationErrorCode>()
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    let active = true
    void getGeolocationPermission().then((state) => {
      if (active) setBlocked(state === 'denied')
    })
    return () => {
      active = false
    }
  }, [])

  /** Pede a posição. Devolve as coordenadas, ou undefined se falhar (veja `errorCode`). */
  const request = useCallback(async (): Promise<Coordinates | undefined> => {
    setStatus('locating')
    setErrorCode(undefined)
    try {
      const coordinates = await getCurrentPosition()
      setStatus('idle')
      return coordinates
    } catch (error) {
      const code = error instanceof GeolocationError ? error.code : 'unavailable'
      setErrorCode(code)
      setStatus('error')
      if (code === 'denied') setBlocked(true)
      return undefined
    }
  }, [])

  return { status, errorCode, blocked, request }
}
