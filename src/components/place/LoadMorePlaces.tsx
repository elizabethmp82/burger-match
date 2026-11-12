import { LoaderCircle } from 'lucide-react'
import { buttonClasses } from '@/components/ui/buttonStyles'
import type { LoadMore } from '@/hooks/usePlaces'
import { cn } from '@/utils/cn'

interface LoadMorePlacesProps {
  loadMore: LoadMore
  /** Quantos locais novos a última busca trouxe (para avisar quando não veio nenhum). */
  lastLoadAdded: number | undefined
  className?: string
}

/**
 * Botão para buscar mais lugares. Cada clique é UMA consulta (até 2 créditos do plano
 * gratuito da Geoapify): por isso só acontece quando a pessoa pede.
 */
export function LoadMorePlaces({ loadMore, lastLoadAdded, className }: LoadMorePlacesProps) {
  const isExtended = loadMore.scope === 'extended'

  return (
    <div className={cn('flex w-full flex-col items-center gap-2 text-center', className)}>
      <button
        type="button"
        onClick={loadMore.load}
        disabled={loadMore.isLoading}
        aria-busy={loadMore.isLoading}
        className={buttonClasses('secondary', 'w-full')}
      >
        {loadMore.isLoading && (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" strokeWidth={2.5} />
        )}
        {loadMore.isLoading
          ? 'Procurando…'
          : isExtended
            ? 'Procurar mais lugares'
            : 'Carregar mais hamburguerias'}
      </button>
      {isExtended && !loadMore.isLoading && (
        <p className="text-xs text-texto-suave">
          Inclui lanchonetes e restaurantes que também servem hambúrguer.
        </p>
      )}
      <p role="status" className="text-sm text-texto-suave empty:hidden">
        {lastLoadAdded === 0 && !loadMore.isLoading ? 'Nenhum lugar novo nessa busca.' : ''}
      </p>
      {loadMore.errorMessage && (
        <p role="alert" className="text-sm font-semibold text-ketchup-forte">
          {loadMore.errorMessage}
        </p>
      )}
    </div>
  )
}
