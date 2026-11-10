import { Globe, Heart, Navigation, Phone, Share } from 'lucide-react'
import { useState } from 'react'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { useFavorites } from '@/features/favorites/hooks/useFavorites'
import { placeDetailsPath } from '@/routes/paths'
import type { BurgerPlace } from '@/types/place.types'
import { cn } from '@/utils/cn'
import { formatDistance } from '@/utils/formatters'
import { directionsUrl } from '@/utils/googleMaps'
import { shareLink, shareResultMessage } from '@/utils/share'
import { PhotoMosaic } from './PhotoMosaic'
import { RatingSummary } from './RatingSummary'

interface PlaceDetailsPanelProps {
  place: BurgerPlace
  /** Nível do título: h2 dentro de outra página (Favoritos); h1 na página de Detalhes. */
  titleAs?: 'h1' | 'h2'
  /**
   * Para onde enviar os avisos ao leitor de tela. Use quando o painel pode ser
   * recriado logo após a ação (ex.: remover o favorito selecionado troca o painel),
   * senão o aviso some antes de ser lido. Sem ele, o painel anuncia sozinho.
   */
  onAnnounce?: (message: string) => void
}

const infoBox = 'flex flex-col gap-1 rounded-2xl border-2 border-tostado bg-superficie p-4'
const secondaryAction = buttonClasses('secondary', 'px-5')

/**
 * Detalhe de um local para telas largas (mockup Desktop · Favoritos):
 * mosaico de fotos, nome + favoritar, nota, horários, endereço e ações.
 */
export function PlaceDetailsPanel({
  place,
  titleAs: Title = 'h2',
  onAnnounce,
}: PlaceDetailsPanelProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [ownAnnouncement, setOwnAnnouncement] = useState('')
  const setAnnouncement = onAnnounce ?? setOwnAnnouncement
  const favorite = isFavorite(place.placeId)
  const hasHours = place.openNow !== undefined || (place.openingHours?.length ?? 0) > 0

  function handleToggleFavorite() {
    toggleFavorite(place.placeId)
    setAnnouncement(
      favorite ? `${place.name} removida dos favoritos.` : `${place.name} salva nos favoritos.`,
    )
  }

  async function handleShare() {
    const url = new URL(placeDetailsPath(place.placeId), window.location.origin).href
    setAnnouncement(shareResultMessage(await shareLink(place.name, url)))
  }

  return (
    <article aria-labelledby={`panel-${place.placeId}`} className="flex flex-col gap-5">
      <PhotoMosaic place={place} />

      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <Title id={`panel-${place.placeId}`} className="text-4xl leading-tight tracking-logo">
            {place.name}
          </Title>
          <RatingSummary place={place} />
        </div>
        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={favorite}
          aria-label={
            favorite ? `Remover ${place.name} dos favoritos` : `Salvar ${place.name} nos favoritos`
          }
          className={iconButtonClasses(
            cn('size-12', favorite ? 'bg-ketchup-forte text-white' : 'bg-superficie text-tostado'),
          )}
        >
          <Heart
            aria-hidden="true"
            className={cn('size-5', favorite && 'fill-current')}
            strokeWidth={2.5}
          />
        </button>
      </header>

      <div className={cn('grid gap-4', hasHours && 'sm:grid-cols-2')}>
        {hasHours && (
          <section aria-label="Horário de funcionamento" className={infoBox}>
            {place.openNow !== undefined ? (
              <p
                className={cn(
                  'font-bold',
                  place.openNow ? 'text-alface-forte' : 'text-ketchup-forte',
                )}
              >
                {place.openNow ? 'Aberto agora' : 'Fechado agora'}
              </p>
            ) : (
              <p className="font-bold">Horários</p>
            )}
            {place.openingHours?.length ? (
              <ul className="text-texto-suave">
                {place.openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              place.nextStatusChange && (
                <p className="text-texto-suave">
                  {place.openNow ? 'Fecha' : 'Abre'} às {place.nextStatusChange}
                </p>
              )
            )}
          </section>
        )}

        <section aria-label="Endereço" className={infoBox}>
          <p className="font-bold">Endereço</p>
          <p className="text-texto-suave">{place.address}</p>
          {place.distanceMeters !== undefined && (
            <p className="text-texto-suave">{formatDistance(place.distanceMeters)} de você</p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={place.googleMapsUrl ?? directionsUrl(place.location)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses('primary', 'px-6')}
        >
          <Navigation aria-hidden="true" className="size-5" strokeWidth={2.5} />
          Ver rota no Maps
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        {place.phoneNumber && (
          <a href={`tel:${place.phoneNumber.replace(/[^\d+]/g, '')}`} className={secondaryAction}>
            <Phone aria-hidden="true" className="size-5" strokeWidth={2.25} />
            Ligar
          </a>
        )}
        {place.websiteUrl && (
          <a
            href={place.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryAction}
          >
            <Globe aria-hidden="true" className="size-5" strokeWidth={2.25} />
            Site
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        )}
        <button type="button" onClick={() => void handleShare()} className={secondaryAction}>
          <Share aria-hidden="true" className="size-5" strokeWidth={2.25} />
          Compartilhar
        </button>
      </div>

      <p className="text-xs text-texto-suave">Dados simulados para desenvolvimento.</p>

      {!onAnnounce && (
        <p role="status" className="sr-only">
          {ownAnnouncement}
        </p>
      )}
    </article>
  )
}
