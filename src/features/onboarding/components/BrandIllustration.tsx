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
 */
export function BrandIllustration({ children, className }: BrandIllustrationProps) {
  return (
    <div aria-hidden="true" className={cn('relative aspect-square', className)}>
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-pao lg:border-3" />
      <div className="absolute inset-[13.5%] grid place-items-center rounded-full border-2 border-tostado bg-pao/20 lg:border-3">
        {children}
      </div>
      <span className="absolute top-[23%] left-[2%] aspect-square w-[9.6%] rounded-full border-2 border-tostado bg-mostarda" />
      <span className="absolute top-[11.5%] right-[15%] aspect-square w-[7.7%] rounded-full border-2 border-tostado bg-mostarda" />
      <span className="absolute right-[4%] bottom-[23%] aspect-square w-[9.6%] rounded-full border-2 border-tostado bg-mostarda" />
    </div>
  )
}
