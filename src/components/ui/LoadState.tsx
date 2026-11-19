import { WifiOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AnimatedBrandIcon } from './Brand'
import { buttonClasses } from './buttonStyles'
import { EmptyState } from './EmptyState'

/**
 * Carregando (RN12): ícone da marca animado + texto.
 * role="status": o leitor de tela anuncia sem roubar o foco.
 */
export function LoadingState({
  label = 'Buscando hamburguerias…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      <AnimatedBrandIcon className="size-24" />
      <p className="font-semibold text-texto-suave">{label}</p>
    </div>
  )
}

/** Falha ao carregar (RN12): explica e oferece tentar de novo. */
export function ErrorState({
  onRetry,
  description = 'Verifique sua conexão com a internet e tente de novo.',
  className,
}: {
  onRetry: () => void
  /** `undefined` = mensagem padrão (problema de conexão). */
  description?: string | undefined
  className?: string
}) {
  return (
    <EmptyState
      icon={WifiOff}
      title="Não foi possível carregar"
      description={description}
      className={className}
    >
      <button type="button" onClick={onRetry} className={buttonClasses('primary', 'w-full')}>
        Tentar de novo
      </button>
    </EmptyState>
  )
}
