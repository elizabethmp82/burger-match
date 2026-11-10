import { ChevronLeft, Hamburger, LoaderCircle, Navigation, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import type { LocationRedirectState } from '@/components/layout/RequireLocation'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { MapPinShape } from '@/components/ui/MapPinShape'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useGoBack } from '@/hooks/useGoBack'
import { useSearchArea } from '@/hooks/useSearchArea'
import { paths } from '@/routes/paths'
import type { GeolocationErrorCode } from '@/services/location/geolocationService'
import { resolveRegion } from '@/services/location/regionSearchService'
import type { RegionSuggestion } from '@/types/location.types'
import { cn } from '@/utils/cn'
import { BrandIllustration } from './BrandIllustration'
import { RegionSearch } from './RegionSearch'

/** O que dizer em cada falha — sempre apontando a alternativa (RN03, RN12). */
const ERROR_MESSAGES: Record<GeolocationErrorCode, string> = {
  denied:
    'Você não permitiu o acesso à localização. Tudo bem: busque seu bairro ou cidade abaixo. Se mudar de ideia, libere a permissão nas configurações do site, no navegador.',
  unavailable:
    'Não conseguimos descobrir sua localização agora. Tente de novo ou busque seu bairro ou cidade abaixo.',
  timeout:
    'A localização demorou demais para responder. Tente de novo ou busque seu bairro ou cidade abaixo.',
  unsupported: 'Este navegador não oferece localização. Busque seu bairro ou cidade abaixo.',
}

/** Para onde ir depois da escolha: a tela que pediu a localização, ou Descobrir. */
function useDestination(): string {
  const { state } = useLocation()
  const from = (state as Partial<LocationRedirectState> | null)?.from
  return typeof from === 'string' && from.startsWith('/') ? from : paths.discover
}

/**
 * "Onde você está?" — RN02 (permissão só após o clique) e RN03 (busca manual).
 * A localização fica só na memória da aba: não é salva nem compartilhada.
 */
export function LocationStep() {
  const navigate = useNavigate()
  const goBack = useGoBack(paths.welcome)
  const destination = useDestination()
  const { setLocation } = useSearchArea()
  const geolocation = useGeolocation()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locating = geolocation.status === 'locating'

  async function handleUseMyLocation() {
    if (locating) return
    const coordinates = await geolocation.request()
    if (coordinates) {
      setLocation('Sua localização', coordinates, 'gps')
      void navigate(destination)
    } else {
      // A mensagem de erro é anunciada (role="alert"); o foco vai para a alternativa.
      searchInputRef.current?.focus()
    }
  }

  const [resolvingRegion, setResolvingRegion] = useState(false)
  const [regionFailed, setRegionFailed] = useState(false)

  async function handleSelectRegion(region: RegionSuggestion) {
    setResolvingRegion(true)
    setRegionFailed(false)
    try {
      const center = await resolveRegion(region)
      setLocation(region.name, center, 'manual')
      void navigate(destination)
    } catch {
      setRegionFailed(true)
    } finally {
      setResolvingRegion(false)
    }
  }

  return (
    // Celular: coluna única (layout aprovado).
    // Tablet: mesma coluna, um pouco mais larga e centralizada na vertical.
    // Desktop: ilustração à esquerda, conteúdo à direita.
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-6 pb-8 md:max-w-lg md:px-8 lg:max-w-6xl lg:px-12 lg:pt-10 lg:pb-12">
      <button
        type="button"
        onClick={goBack}
        aria-label="Voltar"
        className={iconButtonClasses('size-11 rounded-xl bg-superficie hover:bg-white')}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </button>

      <div className="flex flex-col md:my-auto lg:grid lg:grid-cols-2 lg:items-center lg:gap-16 xl:gap-24">
        <BrandIllustration className="mx-auto mt-6 w-52 lg:mt-0 lg:w-full lg:max-w-md">
          <BurgerPin />
        </BrandIllustration>

        <div className="flex flex-col lg:max-w-md">
          <h1 className="mt-8 text-center text-4xl tracking-logo lg:mt-0 lg:text-left lg:text-5xl">
            Onde você está?
          </h1>
          <p className="mt-3 text-center text-lg text-texto-suave lg:text-left">
            Usamos sua localização só para encontrar hamburguerias perto de você. Ela não é salva
            nem compartilhada.
          </p>

          <button
            type="button"
            onClick={() => void handleUseMyLocation()}
            aria-disabled={locating}
            className={buttonClasses('primary', cn('mt-8 w-full', locating && 'cursor-progress'))}
          >
            {locating ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Navigation aria-hidden="true" className="size-5" strokeWidth={2.5} />
            )}
            {locating ? 'Localizando…' : 'Usar minha localização'}
          </button>

          {/* role="alert": o leitor de tela lê a mensagem assim que ela aparece. */}
          <div role="alert">
            {geolocation.status === 'error' && geolocation.errorCode ? (
              <LocationNotice tone="error">{ERROR_MESSAGES[geolocation.errorCode]}</LocationNotice>
            ) : null}
          </div>
          {geolocation.blocked && geolocation.status !== 'error' && (
            <LocationNotice tone="info">
              A localização está bloqueada neste navegador. Busque seu bairro ou cidade abaixo, ou
              libere a permissão nas configurações do site.
            </LocationNotice>
          )}

          <div className="my-6 flex items-center gap-4 text-sm text-texto-suave" aria-hidden="true">
            <span className="h-0.5 flex-1 bg-pao/30" />
            ou
            <span className="h-0.5 flex-1 bg-pao/30" />
          </div>

          <RegionSearch
            onSelect={(region) => void handleSelectRegion(region)}
            busy={resolvingRegion}
            inputRef={searchInputRef}
          />
          {regionFailed && (
            <LocationNotice tone="error">
              Não foi possível carregar esse lugar agora. Verifique a conexão e tente de novo.
            </LocationNotice>
          )}
        </div>
      </div>
    </main>
  )
}

/** Pino com hambúrguer. Proporcional ao círculo: no celular mede 80px, como antes. */
function BurgerPin() {
  return (
    <div className="relative w-[53%]">
      <MapPinShape withDot={false} className="w-full" />
      <Hamburger
        className="absolute top-[13.5%] left-1/2 h-auto w-1/2 -translate-x-1/2 fill-pao text-tostado"
        strokeWidth={2.25}
      />
    </div>
  )
}

function LocationNotice({ tone, children }: { tone: 'error' | 'info'; children: string }) {
  return (
    <p
      className={cn(
        'mt-4 flex items-start gap-3 rounded-2xl border-2 p-4 text-sm',
        tone === 'error'
          ? 'border-ketchup-forte bg-ketchup/8 text-tostado'
          : 'border-tostado/20 bg-superficie text-texto-suave',
      )}
    >
      <TriangleAlert
        aria-hidden="true"
        className={cn(
          'mt-0.5 size-5 shrink-0',
          tone === 'error' ? 'text-ketchup-forte' : 'text-pao',
        )}
        strokeWidth={2.25}
      />
      {children}
    </p>
  )
}
