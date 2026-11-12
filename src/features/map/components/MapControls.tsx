import { LocateFixed, Minus, Plus, type LucideIcon } from 'lucide-react'
import { iconButtonClasses } from '@/components/ui/buttonStyles'
import { cn } from '@/utils/cn'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  /** Volta ao enquadramento da região escolhida (localização ou bairro). */
  onRecenter: () => void
  className?: string | undefined
}

/** Botões do mapa no estilo da marca (os do MapLibre seriam cinza e pequenos para o dedo). */
export function MapControls({ onZoomIn, onZoomOut, onRecenter, className }: MapControlsProps) {
  return (
    <div className={cn('absolute z-10 flex flex-col gap-2', className)}>
      <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-tostado bg-superficie shadow-offset">
        <ControlButton icon={Plus} label="Aproximar" onClick={onZoomIn} />
        <span aria-hidden="true" className="h-0.5 bg-tostado/15" />
        <ControlButton icon={Minus} label="Afastar" onClick={onZoomOut} />
      </div>
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Centralizar na região escolhida"
        title="Centralizar"
        className={iconButtonClasses('size-11 bg-superficie shadow-offset hover:bg-white')}
      >
        <LocateFixed aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-11 place-items-center transition hover:bg-white focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-ketchup"
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={2.5} />
    </button>
  )
}
