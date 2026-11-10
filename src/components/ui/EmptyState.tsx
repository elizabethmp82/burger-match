import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  /** Ações (botões/links) exibidas abaixo do texto. */
  children?: ReactNode
  /** h1 quando o estado vazio É a página (ex.: "Local não encontrado"). */
  titleAs?: 'h1' | 'h2'
  className?: string
}

/** Estado vazio ou de erro (RN12): ícone, título, explicação e o que fazer a seguir. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  titleAs: Title = 'h2',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-10 text-center', className)}>
      <span className="grid size-20 place-items-center rounded-full border-2 border-tostado bg-superficie">
        <Icon aria-hidden="true" className="size-9 text-ketchup-forte" strokeWidth={2} />
      </span>
      <Title className="text-2xl tracking-logo">{title}</Title>
      <p className="max-w-xs text-texto-suave">{description}</p>
      {children && <div className="flex w-full flex-col items-center gap-3">{children}</div>}
    </div>
  )
}
