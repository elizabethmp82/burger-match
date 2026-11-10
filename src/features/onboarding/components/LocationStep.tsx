import { ChevronLeft, Hamburger, Navigation, Search } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { MapPinShape } from '@/components/ui/MapPinShape'
import { useGoBack } from '@/hooks/useGoBack'
import { paths } from '@/routes/paths'
import { BrandIllustration } from './BrandIllustration'

/**
 * "Onde você está?" — Etapa 2: apenas a interface.
 * Os dois caminhos levam a Descobrir com a região simulada (Pinheiros).
 * Na Etapa 3: o botão pedirá a permissão do navegador (RN02) e a busca
 * definirá a região manualmente (RN03).
 */
export function LocationStep() {
  const navigate = useNavigate()
  const goBack = useGoBack(paths.welcome)
  const searchInputId = useId()
  const searchHintId = useId()
  const [query, setQuery] = useState('')

  function goToDiscover() {
    void navigate(paths.discover)
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (query.trim()) {
      goToDiscover()
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
            onClick={goToDiscover}
            className={buttonClasses('primary', 'mt-8 w-full')}
          >
            <Navigation aria-hidden="true" className="size-5" strokeWidth={2.5} />
            Usar minha localização
          </button>

          <div className="my-6 flex items-center gap-4 text-sm text-texto-suave" aria-hidden="true">
            <span className="h-0.5 flex-1 bg-pao/30" />
            ou
            <span className="h-0.5 flex-1 bg-pao/30" />
          </div>

          <form role="search" onSubmit={handleSearch} className="flex flex-col gap-2">
            <label htmlFor={searchInputId} className="text-sm font-bold">
              Buscar por cidade ou bairro
            </label>
            <div className="flex items-center gap-3 rounded-2xl border-2 border-tostado bg-superficie px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ketchup">
              <Search aria-hidden="true" className="size-5 shrink-0 text-texto-suave" />
              <input
                id={searchInputId}
                type="search"
                enterKeyHint="search"
                autoComplete="address-level2"
                placeholder="Ex.: Pinheiros, São Paulo"
                aria-describedby={searchHintId}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-lg outline-none placeholder:text-texto-suave/70"
              />
            </div>
            <p id={searchHintId} className="text-sm text-texto-suave">
              Se você negar a permissão no navegador, é só buscar aqui.
            </p>
          </form>
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
