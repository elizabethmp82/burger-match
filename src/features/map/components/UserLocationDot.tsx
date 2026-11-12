import { cn } from '@/utils/cn'

/** Ponto azul do centro da busca (sua localização ou o bairro escolhido). */
export function UserLocationDot({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-full bg-blue-500/15',
        size === 'md' ? 'size-12' : 'size-8',
      )}
    >
      <span
        className={cn(
          'rounded-full border-white bg-blue-600 shadow',
          size === 'md' ? 'size-4 border-3' : 'size-3 border-2',
        )}
      />
      <span className="sr-only">Centro da busca</span>
    </span>
  )
}
