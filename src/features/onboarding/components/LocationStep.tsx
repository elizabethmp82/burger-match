import { ChevronLeft, Hamburger, Navigation, Search } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { buttonClasses, iconButtonClasses } from '@/components/ui/buttonStyles'
import { MapPinShape } from '@/components/ui/MapPinShape'
import { useGoBack } from '@/hooks/useGoBack'
import { paths } from '@/routes/paths'

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-6 pb-8">
      <button
        type="button"
        onClick={goBack}
        aria-label="Voltar"
        className={iconButtonClasses('size-11 rounded-xl bg-superficie hover:bg-white')}
      >
        <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </button>

      <LocationIllustration />

      <h1 className="mt-8 text-center text-4xl tracking-logo">Onde você está?</h1>
      <p className="mt-3 text-center text-lg text-texto-suave">
        Usamos sua localização só para encontrar hamburguerias perto de você. Ela não é salva nem
        compartilhada.
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
    </main>
  )
}

function LocationIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-6 size-52">
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-pao" />
      <div className="absolute inset-7 grid place-items-center rounded-full border-2 border-tostado bg-pao/20">
        <div className="relative w-20">
          <MapPinShape withDot={false} className="w-full" />
          <Hamburger
            className="absolute top-3.5 left-1/2 size-10 -translate-x-1/2 fill-pao text-tostado"
            strokeWidth={2.25}
          />
        </div>
      </div>
      <span className="absolute top-12 left-1 size-5 rounded-full border-2 border-tostado bg-mostarda" />
      <span className="absolute top-6 right-8 size-4 rounded-full border-2 border-tostado bg-mostarda" />
      <span className="absolute right-2 bottom-12 size-5 rounded-full border-2 border-tostado bg-mostarda" />
    </div>
  )
}
