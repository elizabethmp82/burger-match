/**
 * Junta classes CSS ignorando valores falsos.
 * cn('a', isActive && 'b', undefined) → 'a b' (ou 'a')
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
