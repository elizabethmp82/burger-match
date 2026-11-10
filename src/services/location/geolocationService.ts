/**
 * Geolocation API do navegador, embrulhada em uma Promise com erros tipados.
 * https://developer.mozilla.org/docs/Web/API/Geolocation_API
 *
 * Privacidade: as coordenadas só ficam na memória da aba. Não são salvas
 * nem enviadas a nenhum servidor nesta etapa.
 */
import type { Coordinates } from '@/types/location.types'

export type GeolocationErrorCode =
  /** O navegador não tem a API (ou a página não está em HTTPS/localhost). */
  | 'unsupported'
  /** O usuário (ou a configuração do navegador) negou a permissão. */
  | 'denied'
  /** O dispositivo não conseguiu determinar a posição (GPS/rede indisponível). */
  | 'unavailable'
  /** Demorou mais que o limite. */
  | 'timeout'

export class GeolocationError extends Error {
  readonly code: GeolocationErrorCode

  constructor(code: GeolocationErrorCode) {
    super(`Geolocalização falhou: ${code}`)
    this.name = 'GeolocationError'
    this.code = code
  }
}

const POSITION_OPTIONS: PositionOptions = {
  // Precisão de bairro basta para achar hamburguerias, e economiza bateria.
  enableHighAccuracy: false,
  timeout: 10_000,
  // Aceita uma posição obtida nos últimos 5 minutos (resposta instantânea).
  maximumAge: 5 * 60_000,
}

/** A API só existe em contextos seguros (HTTPS ou localhost). */
export function isGeolocationSupported(): boolean {
  return window.isSecureContext && 'geolocation' in navigator
}

/** Pede a posição atual. O navegador mostra o pedido de permissão, se necessário. */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new GeolocationError('unsupported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => {
        const code: GeolocationErrorCode =
          error.code === error.PERMISSION_DENIED
            ? 'denied'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'unavailable'
        reject(new GeolocationError(code))
      },
      POSITION_OPTIONS,
    )
  })
}

/**
 * Estado atual da permissão, sem perguntar nada ao usuário.
 * Permite avisar ANTES do clique que a localização está bloqueada.
 * Retorna 'unknown' em navegadores sem a Permissions API.
 */
export async function getGeolocationPermission(): Promise<PermissionState | 'unknown'> {
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' })
    return status.state
  } catch {
    return 'unknown'
  }
}
