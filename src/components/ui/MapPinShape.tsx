import { cn } from '@/utils/cn'

interface MapPinShapeProps {
  /** Classe de preenchimento do pino, ex.: "fill-ketchup". */
  fillClassName?: string
  /** Mostra o círculo branco central (pinos comuns do mapa). */
  withDot?: boolean
  className?: string
}

/** Pino de mapa no estilo da marca: contorno tostado grosso, como nos mockups. */
export function MapPinShape({
  fillClassName = 'fill-ketchup',
  withDot = true,
  className,
}: MapPinShapeProps) {
  return (
    <svg viewBox="0 0 40 52" aria-hidden="true" className={cn('overflow-visible', className)}>
      <path
        d="M20 49C20 49 4 31.5 4 19.5a16 16 0 0 1 32 0C36 31.5 20 49 20 49Z"
        className={cn('stroke-tostado', fillClassName)}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {withDot && <circle cx="20" cy="19.5" r="6" className="fill-white" />}
    </svg>
  )
}
