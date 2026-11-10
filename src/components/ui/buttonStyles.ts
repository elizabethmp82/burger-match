import { cn } from '@/utils/cn'

/*
 * Estilos de botão em uma função (e não em um componente) para servirem
 * igualmente em <button>, <Link> e <a>: cada um mantém a semântica correta.
 */

export type ButtonVariant = 'primary' | 'secondary'

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-tostado transition ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ketchup-forte px-5 py-4 text-lg font-bold text-white shadow-offset ' +
    'active:translate-y-1 active:shadow-none',
  secondary: 'bg-superficie px-4 py-3 font-semibold text-tostado hover:bg-white',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(base, variants[variant], className)
}

/** Botão redondo só com ícone (voltar, favoritar, desfazer...). */
export function iconButtonClasses(className?: string): string {
  return cn(
    'inline-grid shrink-0 place-items-center rounded-full border-2 border-tostado transition',
    'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ketchup',
    'disabled:cursor-not-allowed disabled:opacity-40',
    className,
  )
}
