import brandIcon from '@/assets/logos/burgermatch-icone.png'
import { cn } from '@/utils/cn'

/** Ícone da marca (decorativo: o nome do app sempre aparece ao lado, em texto). */
export function BrandIcon({ className }: { className?: string }) {
  return <img src={brandIcon} alt="" className={cn('shrink-0 object-contain', className)} />
}

/**
 * Logotipo em texto, na fonte oficial: "Burger" tostado + "Match" ketchup.
 * Em texto (e não imagem) fica nítido em qualquer tamanho e é lido por leitores de tela.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-display font-extrabold tracking-logo', className)}>
      Burger<span className="text-ketchup-forte">Match</span>
    </span>
  )
}
