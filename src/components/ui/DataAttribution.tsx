import { isDemoMode, placesProviderName } from '@/config/env'
import { cn } from '@/utils/cn'

const linkClasses =
  'underline underline-offset-2 hover:text-tostado focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ketchup'

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
      {children}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  )
}

/**
 * Créditos exigidos sempre que os dados aparecem (cards, listas, detalhes):
 * - OpenStreetMap: licença ODbL — https://www.openstreetmap.org/copyright
 * - Geoapify: obrigatório no plano gratuito — https://www.geoapify.com/term-and-conditions/
 * Não aparece no modo demonstração (dados simulados).
 */
export function DataAttribution({ className }: { className?: string }) {
  if (isDemoMode) return null

  return (
    <p className={cn('text-xs text-texto-suave', className)}>
      Dados ©{' '}
      <ExternalLink href="https://www.openstreetmap.org/copyright">
        colaboradores do OpenStreetMap
      </ExternalLink>
      {placesProviderName === 'geoapify' && (
        <>
          {' · '}Busca por <ExternalLink href="https://www.geoapify.com/">Geoapify</ExternalLink>
        </>
      )}
    </p>
  )
}
