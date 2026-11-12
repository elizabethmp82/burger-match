import { Hamburger } from 'lucide-react'
import { cn } from '@/utils/cn'

/**
 * Faixa na cor da marca, no lugar da foto, para locais SEM fotos (a Geoapify não
 * fornece imagens). Decorativa: não finge ser foto e não diz "Sem foto" — a
 * informação útil (nome, distância, horário) vem logo abaixo, em texto.
 */
export function BrandBand({
  className,
  iconClassName = 'size-9',
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <div
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center bg-mostarda', className)}
    >
      <Hamburger className={cn('fill-pao text-tostado', iconClassName)} strokeWidth={2} />
    </div>
  )
}
