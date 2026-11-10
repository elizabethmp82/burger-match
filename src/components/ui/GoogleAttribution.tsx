import { isGoogleMapsEnabled } from '@/config/env'
import { cn } from '@/utils/cn'

/**
 * Atribuição exigida pelo Google ao exibir dados da Places API FORA de um mapa
 * do Google (cards, listas, detalhes). Só aparece quando os dados vêm do Google.
 * Política: https://developers.google.com/maps/documentation/places/web-service/policies
 */
export function GoogleAttribution({ className }: { className?: string }) {
  if (!isGoogleMapsEnabled) return null

  return (
    <p className={cn('text-xs text-texto-suave', className)}>
      Dados de{' '}
      <span
        translate="no"
        className="font-medium"
        style={{ fontFamily: 'Roboto, Arial, sans-serif' }}
      >
        Google Maps
      </span>
    </p>
  )
}
