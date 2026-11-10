import { Hamburger, ImageIcon } from 'lucide-react'
import type { PlacePhoto } from '@/types/place.types'
import { cn } from '@/utils/cn'

/** Tons da paleta para diferenciar os placeholders (os mockups usam o mesmo recurso). */
const PLACEHOLDER_TONES = ['bg-pao/55', 'bg-pao/75', 'bg-pao/40', 'bg-mostarda/45', 'bg-pao/90']

interface PhotoTileProps {
  /** Ausente = o local não tem fotos ("Sem foto"). */
  photo?: PlacePhoto | undefined
  /** Posição da foto; escolhe o tom do placeholder. */
  index?: number
  /** Texto alternativo quando houver imagem real. */
  alt: string
  /** Texto dentro do placeholder (ex.: "Foto do local"). */
  label?: string | undefined
  iconClassName?: string
  className?: string
}

/**
 * Foto de um local. Na Etapa 2 as fotos não têm URL, então mostramos um
 * placeholder colorido; com `photo.url` (Etapa 4) exibimos a imagem real.
 */
export function PhotoTile({
  photo,
  index = 0,
  alt,
  label,
  iconClassName = 'size-8',
  className,
}: PhotoTileProps) {
  if (photo?.url) {
    return (
      <img src={photo.url} alt={alt} loading="lazy" className={cn('object-cover', className)} />
    )
  }

  const hasPhoto = photo !== undefined
  const Icon = hasPhoto ? ImageIcon : Hamburger
  const text = label ?? (hasPhoto ? undefined : 'Sem foto')

  return (
    <div
      role="img"
      aria-label={hasPhoto ? alt : 'Sem foto disponível'}
      className={cn(
        'flex flex-col items-center justify-center gap-2 text-tostado/80',
        hasPhoto ? PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length] : 'bg-tostado/8',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(iconClassName, !hasPhoto && 'fill-pao text-tostado')}
        strokeWidth={2}
      />
      {text && <span className="text-xs font-semibold">{text}</span>}
    </div>
  )
}
