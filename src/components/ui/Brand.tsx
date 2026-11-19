// 640 px em WebP (27 KB): nítido até ~300 px na tela; o PNG original tem 1024 px / 126 KB.
import brandIcon from '@/assets/logos/burgermatch-icone.webp'
// Mesmo ícone em SVG, com a animação (CSS) dentro do próprio arquivo.
import animatedBrandIcon from '@/assets/logos/burgermatch-icone-animado.svg'
import { cn } from '@/utils/cn'

/** Ícone da marca (decorativo: o nome do app sempre aparece ao lado, em texto). */
export function BrandIcon({ className }: { className?: string }) {
  return <img src={brandIcon} alt="" className={cn('shrink-0 object-contain', className)} />
}

/**
 * Ícone da marca animado: a carta desliza como num "match", o coração pulsa e o
 * hambúrguer quica. Usado nas boas-vindas e sempre que o app está buscando algo.
 * Com "reduzir movimento" ligado no aparelho, o ícone fica parado (regra no SVG).
 * Decorativo: quem usa mostra também um texto ("Buscando…") para leitores de tela.
 */
export function AnimatedBrandIcon({ className }: { className?: string }) {
  return (
    <img
      src={animatedBrandIcon}
      alt=""
      draggable={false}
      className={cn('shrink-0 object-contain select-none', className)}
    />
  )
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
