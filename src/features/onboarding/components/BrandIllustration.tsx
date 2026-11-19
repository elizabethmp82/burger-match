import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface BrandIllustrationProps {
  /** Conteúdo do círculo central (ícone da marca, pino...). */
  children: ReactNode
  /** Define a largura; a altura acompanha (quadrado). Ex.: "size-52" ou "w-full max-w-md". */
  className?: string
}

/**
 * Ilustração decorativa da marca: anel tracejado, círculo central e "gergelins" de mostarda.
 * Todas as medidas internas são proporcionais (%), então ela pode crescer no desktop
 * mantendo exatamente o desenho do celular.
 *
 * As bolinhas ficam sobre o anel tracejado e giram em volta do centro: andam em
 * órbita pelo anel (paradas com "reduzir movimento").
 */
const orbitDot =
  'absolute aspect-square rounded-full border-2 border-tostado bg-mostarda animate-orbit motion-reduce:animate-none'

export function BrandIllustration({ children, className }: BrandIllustrationProps) {
  return (
    <div aria-hidden="true" className={cn('relative aspect-square', className)}>
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-pao lg:border-3" />
      <div className="absolute inset-[13.5%] grid place-items-center rounded-full border-2 border-tostado bg-pao/20 lg:border-3">
        {children}
      </div>
      {/*
        Órbita: cada bolinha gira em volta do CENTRO da ilustração. O ponto de giro
        (origin) é a distância até o centro, em % do tamanho da própria bolinha.
        Ex.: bolinha em left 2%, largura 9,6% → (50 − 2) / 9,6 = 500%.
        Girar só as bolinhas (e não uma camada quadrada) evita que os cantos da
        camada saiam da tela e criem rolagem horizontal.
      */}
      <span className={cn(orbitDot, 'top-[23%] left-[2%] w-[9.6%] origin-[500%_281.25%]')} />
      <span className={cn(orbitDot, 'top-[11.5%] right-[15%] w-[7.7%] origin-[-354.5%_500%]')} />
      <span
        className={cn(orbitDot, 'right-[4%] bottom-[23%] w-[9.6%] origin-[-379.2%_-181.25%]')}
      />
    </div>
  )
}
