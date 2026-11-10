import type { PlacePhoto } from '@/types/place.types'

/**
 * "Foto: Nome do autor" — crédito obrigatório das fotos vindas do Google.
 * Quando o Google informa o perfil do autor, o nome vira link (nova aba).
 */
export function PhotoCredit({ photo, suffix }: { photo: PlacePhoto; suffix?: string }) {
  return (
    <>
      Foto:{' '}
      {photo.authorUrl ? (
        <a
          href={photo.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
        >
          {photo.authorName}
          <span className="sr-only"> (perfil no Google Maps, abre em nova aba)</span>
        </a>
      ) : (
        photo.authorName
      )}
      {suffix}
    </>
  )
}
