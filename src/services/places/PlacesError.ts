/**
 * Erro de busca de hamburguerias, com um motivo que a interface sabe explicar (RN12).
 * Independente do provedor: as telas não precisam saber que é a Overpass.
 */
export type PlacesErrorKind =
  /** Sem internet ou servidor inalcançável. */
  | 'network'
  /** Demorou demais (cliente ou servidor). */
  | 'timeout'
  /** Limite de uso atingido (HTTP 429): é preciso esperar. */
  | 'rate-limited'
  /** Servidor fora do ar ou sobrecarregado (5xx). */
  | 'unavailable'
  /** Resposta em formato inesperado. */
  | 'invalid-response'
  /** Acesso recusado (chave inválida, domínio não autorizado ou cliente bloqueado). */
  | 'forbidden'
  /** Falta configuração (ex.: chave da Geoapify ausente no .env.local). */
  | 'not-configured'

export class PlacesError extends Error {
  readonly kind: PlacesErrorKind

  constructor(kind: PlacesErrorKind, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'PlacesError'
    this.kind = kind
  }
}

const MESSAGES: Readonly<Record<PlacesErrorKind, string>> = {
  network: 'Verifique sua conexão com a internet e tente de novo.',
  timeout: 'O serviço de mapas demorou para responder. Tente de novo em instantes.',
  'rate-limited':
    'O serviço gratuito de mapas recebeu muitos pedidos. Aguarde um minuto e tente de novo.',
  unavailable: 'O serviço de mapas está instável agora. Tente de novo em alguns minutos.',
  'invalid-response': 'O serviço de mapas respondeu de um jeito inesperado. Tente de novo.',
  forbidden: 'O serviço de mapas recusou o acesso deste app. Tente de novo mais tarde.',
  'not-configured': 'A busca de hamburguerias ainda não foi configurada neste app.',
}

/** Texto para a pessoa usuária, a partir de qualquer erro. */
export function describePlacesError(error: unknown): string {
  return error instanceof PlacesError ? MESSAGES[error.kind] : MESSAGES.network
}
