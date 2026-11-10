import { Heart, Undo2, X } from 'lucide-react'
import { iconButtonClasses } from '@/components/ui/buttonStyles'

interface SwipeActionsProps {
  placeName: string
  canUndo: boolean
  onUndo: () => void
  onSkip: () => void
  onLike: () => void
}

/**
 * Botões equivalentes aos gestos (acessibilidade: teclado e leitores de tela).
 * Os rótulos incluem o nome do local para deixar claro o que será curtido/pulado.
 */
export function SwipeActions({ placeName, canUndo, onUndo, onSkip, onLike }: SwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Desfazer última ação"
        className={iconButtonClasses('size-13 bg-superficie text-tostado enabled:hover:bg-white')}
      >
        <Undo2 aria-hidden="true" className="size-6" strokeWidth={2.25} />
      </button>
      <button
        type="button"
        onClick={onSkip}
        aria-label={`Pular ${placeName}`}
        className={iconButtonClasses(
          'size-18 bg-superficie text-tostado shadow-offset hover:bg-white active:translate-y-1 active:shadow-none',
        )}
      >
        <X aria-hidden="true" className="size-8" strokeWidth={2.75} />
      </button>
      <button
        type="button"
        onClick={onLike}
        aria-label={`Curtir ${placeName}`}
        className={iconButtonClasses(
          'size-18 bg-ketchup-forte text-white shadow-offset active:translate-y-1 active:shadow-none',
        )}
      >
        <Heart aria-hidden="true" className="size-8 fill-current" strokeWidth={2} />
      </button>
    </div>
  )
}
