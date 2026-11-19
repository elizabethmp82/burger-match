import type { PlacePhoto } from '@/types/place.types'

/**
 * "Foto: Nome do autor" — crédito do autor de cada foto, quando a fonte informa.
 * Se houver link para o perfil do autor, o nome vira link (nova aba).
 * (As fontes atuais — OpenStreetMap/Geoapify — não trazem fotos; só os dados simulados.)
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
          <span className="sr-only"> (perfil do autor, abre em nova aba)</span>
        </a>
      ) : (
        photo.authorName
      )}
      {suffix}
    </>
  )
}
