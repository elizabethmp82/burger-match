import { useId } from 'react'
import type { SearchRadiusKm } from '@/types/location.types'
import { cn } from '@/utils/cn'

interface RadiusPickerProps {
  options: readonly SearchRadiusKm[]
  value: SearchRadiusKm | undefined
  onChange: (radiusKm: SearchRadiusKm) => void
  /** Alinhamento do título "Raio de busca". */
  legendAlign?: 'left' | 'center'
  className?: string
}

/**
 * Escolha do raio de busca: rádios nativos com visual de botões.
 * Rádio nativo = setas do teclado, leitor de tela e formulário funcionam sem código extra.
 */
export function RadiusPicker({
  options,
  value,
  onChange,
  legendAlign = 'left',
  className,
}: RadiusPickerProps) {
  const name = useId()

  return (
    <fieldset className={cn('w-full', className)}>
      <legend
        className={cn('mb-2 w-full text-sm font-bold', legendAlign === 'center' && 'text-center')}
      >
        Raio de busca
      </legend>
      <div className="flex gap-3">
        {options.map((radius) => (
          <label
            key={radius}
            className={cn(
              'flex-1 cursor-pointer rounded-2xl border-2 border-tostado py-3 text-center font-bold transition',
              'has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ketchup',
              radius === value ? 'bg-tostado text-creme' : 'bg-superficie hover:bg-white',
            )}
          >
            <input
              type="radio"
              name={name}
              value={radius}
              checked={radius === value}
              onChange={() => onChange(radius)}
              className="sr-only"
            />
            {radius} km
          </label>
        ))}
      </div>
    </fieldset>
  )
}
