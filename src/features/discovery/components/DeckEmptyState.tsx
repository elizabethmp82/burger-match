import { Hamburger } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { paths } from '@/routes/paths'
import { SEARCH_RADII_KM, type SearchRadiusKm } from '@/types/location.types'
import { cn } from '@/utils/cn'
import { pluralize } from '@/utils/formatters'

interface DeckEmptyStateProps {
  /** Quantas hamburguerias existiam no raio atual. */
  totalInRadius: number
  radiusKm: SearchRadiusKm
  favoritesCount: number
  canUndo: boolean
  onUndo: () => void
  onExpandRadius: (radiusKm: SearchRadiusKm) => void
  onRestart: () => void
}

/** Fim do baralho (mockup 4) ou nenhum resultado no raio (RN12). */
export function DeckEmptyState({
  totalInRadius,
  radiusKm,
  favoritesCount,
  canUndo,
  onUndo,
  onExpandRadius,
  onRestart,
}: DeckEmptyStateProps) {
  const largerRadii = SEARCH_RADII_KM.filter((radius) => radius > radiusKm)
  const [selectedRadius, setSelectedRadius] = useState<SearchRadiusKm | undefined>(largerRadii[0])

  const title = totalInRadius === 0 ? 'Nenhuma hamburgueria por perto' : 'Você viu todas por perto'
  const summary =
    totalInRadius === 0
      ? `Não encontramos hamburguerias num raio de ${radiusKm} km.`
      : `Foram ${pluralize(totalInRadius, 'hamburgueria', 'hamburguerias')} num raio de ${radiusKm} km.`

  return (
    <section
      aria-labelledby="deck-empty-title"
      className="flex flex-1 flex-col items-center gap-5 md:mx-auto md:w-full md:max-w-[25rem] md:flex-none"
    >
      <EmptyDeckIllustration />

      <div className="text-center">
        <h2 id="deck-empty-title" className="text-3xl tracking-logo">
          {title}
        </h2>
        <p className="mt-2 text-texto-suave">
          {summary} {largerRadii.length > 0 && 'Quer procurar mais longe?'}
        </p>
      </div>

      {selectedRadius !== undefined ? (
        <>
          <fieldset className="w-full">
            <legend className="mb-2 w-full text-center text-sm font-bold">Raio de busca</legend>
            <div className="flex gap-3">
              {largerRadii.map((radius) => (
                <label
                  key={radius}
                  className={cn(
                    'flex-1 cursor-pointer rounded-2xl border-2 border-tostado py-3 text-center font-bold transition',
                    'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ketchup',
                    radius === selectedRadius
                      ? 'bg-tostado text-creme'
                      : 'bg-superficie hover:bg-white',
                  )}
                >
                  <input
                    type="radio"
                    name="search-radius"
                    value={radius}
                    checked={radius === selectedRadius}
                    onChange={() => setSelectedRadius(radius)}
                    className="sr-only"
                  />
                  {radius} km
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="button"
            onClick={() => onExpandRadius(selectedRadius)}
            className={buttonClasses('primary', 'w-full')}
          >
            Buscar em {selectedRadius} km
          </button>
        </>
      ) : (
        totalInRadius > 0 && (
          <button type="button" onClick={onRestart} className={buttonClasses('primary', 'w-full')}>
            Ver todas de novo
          </button>
        )
      )}

      <div className="flex flex-col items-center gap-3">
        {favoritesCount > 0 && (
          <Link to={paths.favorites} className="font-bold underline underline-offset-4">
            Ver minhas {pluralize(favoritesCount, 'favorita', 'favoritas')}
          </Link>
        )}
        {canUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="text-sm font-semibold text-texto-suave underline underline-offset-4"
          >
            Desfazer última ação
          </button>
        )}
      </div>
    </section>
  )
}

function EmptyDeckIllustration() {
  return (
    <div aria-hidden="true" className="relative mt-4 h-44 w-40">
      <div className="absolute inset-0 -rotate-12 rounded-3xl border-2 border-dashed border-pao bg-superficie/50" />
      <div className="absolute inset-0 rotate-6 rounded-3xl border-2 border-dashed border-pao bg-superficie">
        <Hamburger
          className="absolute top-1/2 left-1/2 size-14 -translate-1/2 fill-pao text-tostado"
          strokeWidth={2}
        />
      </div>
    </div>
  )
}
