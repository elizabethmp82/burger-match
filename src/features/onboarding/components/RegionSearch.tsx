import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Globe, LoaderCircle, MapPin, Search } from 'lucide-react'
import { useId, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  canSearchOnline,
  MIN_QUERY_LENGTH,
  normalizeText,
  searchRegionsOnline,
  suggestRegions,
} from '@/services/location/regionSearchService'
import { describePlacesError } from '@/services/places/PlacesError'
import type { RegionSuggestion } from '@/types/location.types'
import { cn } from '@/utils/cn'

/** A lista local responde na hora: sem espera entre as teclas. */
const TYPING_DELAY_MS = 0

/** Itens da lista: uma região, ou a ação de buscar no mapa todo (Nominatim). */
type Option = { kind: 'region'; region: RegionSuggestion } | { kind: 'search-online' }

const linkClasses =
  'underline underline-offset-2 hover:text-tostado focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ketchup'

interface RegionSearchProps {
  onSelect: (region: RegionSuggestion) => void
  /** true enquanto a região escolhida está sendo carregada. */
  busy?: boolean
  inputRef?: Ref<HTMLInputElement>
}

/**
 * Busca manual de bairro/cidade (RN03) no padrão "combobox" do WAI-ARIA:
 * o foco fica no campo e as setas destacam as sugestões (aria-activedescendant).
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Duas fontes:
 * 1. lista local: responde a cada tecla, sem rede;
 * 2. Nominatim (OpenStreetMap): SÓ quando a pessoa confirma, pela opção "Buscar em
 *    todo o mapa" ou Enter sem sugestão local. A política do serviço proíbe autocomplete.
 */
export function RegionSearch({ onSelect, busy = false, inputRef }: RegionSearchProps) {
  const inputId = useId()
  const listId = useId()
  const hintId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [notFound, setNotFound] = useState(false)
  /** Texto confirmado para a busca no mapa todo (null = mostrando a lista local). */
  const [onlineTerm, setOnlineTerm] = useState<string | null>(null)

  const term = useDebouncedValue(query.trim(), TYPING_DELAY_MS)
  const searchable = normalizeText(term).length >= MIN_QUERY_LENGTH
  const suggestionsQuery = useQuery({
    queryKey: ['regions', normalizeText(term)],
    queryFn: () => suggestRegions(term),
    enabled: searchable,
    staleTime: 5 * 60_000,
    // Mantém as sugestões anteriores na tela enquanto as novas chegam (sem "piscar").
    placeholderData: keepPreviousData,
  })
  const onlineQuery = useQuery({
    queryKey: ['regions-online', normalizeText(onlineTerm ?? '')],
    queryFn: ({ signal }) => searchRegionsOnline(onlineTerm ?? '', signal),
    enabled: onlineTerm !== null,
    // Bairros e cidades não mudam durante o uso: um pedido por texto, por sessão.
    staleTime: Infinity,
    retry: false,
  })
  const isOnline = onlineTerm !== null
  const suggestions = searchable ? (suggestionsQuery.data ?? []) : []
  const onlineResults = isOnline ? (onlineQuery.data ?? []) : []
  const searching =
    (searchable && suggestionsQuery.isFetching) || (isOnline && onlineQuery.isFetching)
  const typing = query.trim() !== term
  const onlineEmpty = isOnline && onlineQuery.isSuccess && onlineResults.length === 0
  const onlineFailed = isOnline && onlineQuery.isError

  const options: Option[] = isOnline
    ? onlineResults.map((region) => ({ kind: 'region', region }))
    : [
        ...suggestions.map((region): Option => ({ kind: 'region', region })),
        ...(canSearchOnline && searchable && !typing ? [{ kind: 'search-online' } as const] : []),
      ]

  const showList = open && options.length > 0
  const optionId = (index: number) => `${listId}-opcao-${index}`

  function choose(region: RegionSuggestion) {
    setQuery(region.name)
    setOpen(false)
    onSelect(region)
  }

  /** A pessoa confirmou: agora sim, busca no Nominatim. */
  function searchOnline() {
    setOnlineTerm(term)
    setOpen(true)
    setActiveIndex(-1)
    setNotFound(false)
  }

  function activate(option: Option) {
    if (option.kind === 'region') choose(option.region)
    else searchOnline()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    // Ainda digitando ou buscando: as sugestões na tela podem ser de um texto anterior.
    if (typing || searching) return

    const highlighted = options[activeIndex]
    if (highlighted) {
      activate(highlighted)
      return
    }
    if (onlineFailed) {
      void onlineQuery.refetch()
      return
    }
    // Enter sem sugestão destacada escolhe a primeira (a mais relevante).
    const region = isOnline ? onlineResults[0] : suggestions[0]
    if (region) {
      choose(region)
    } else if (!isOnline && canSearchOnline && searchable) {
      // Nada na lista local: Enter é a confirmação para buscar no mapa todo.
      searchOnline()
    } else if (query.trim()) {
      setNotFound(true)
    }
  }

  const statusMessage =
    !open || !searchable
      ? ''
      : searching || typing
        ? isOnline
          ? 'Buscando no mapa todo…'
          : 'Buscando lugares…'
        : onlineFailed
          ? describePlacesError(onlineQuery.error)
          : onlineEmpty
            ? 'Nenhum lugar encontrado no mapa.'
            : isOnline
              ? `${onlineResults.length} ${onlineResults.length === 1 ? 'resultado' : 'resultados'} do mapa. Use as setas para escolher.`
              : suggestionsQuery.isError
                ? 'Não foi possível buscar agora. Tente de novo.'
                : suggestions.length === 0
                  ? canSearchOnline
                    ? 'Nenhum lugar na lista. Escolha buscar em todo o mapa.'
                    : 'Nenhum lugar encontrado.'
                  : `${suggestions.length} ${suggestions.length === 1 ? 'sugestão' : 'sugestões'}. Use as setas para escolher.`

  const SearchIcon = searching || busy ? LoaderCircle : Search

  return (
    <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-bold">
        Buscar por cidade ou bairro
      </label>

      <div className="relative">
        <div className="flex items-center gap-3 rounded-2xl border-2 border-tostado bg-superficie px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ketchup">
          <SearchIcon
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0 text-texto-suave',
              (searching || busy) && 'animate-spin motion-reduce:animate-none',
            )}
          />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            aria-describedby={hintId}
            aria-invalid={notFound || onlineEmpty || undefined}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="Ex.: Pinheiros, São Paulo"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setActiveIndex(-1)
              setNotFound(false)
              setOnlineTerm(null)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-lg outline-none placeholder:text-texto-suave/70"
          />
        </div>

        <div
          hidden={!showList}
          // mousedown + preventDefault: o campo não perde o foco antes do clique.
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border-2 border-tostado bg-superficie shadow-offset"
        >
          <ul
            id={listId}
            role="listbox"
            aria-label={isOnline ? 'Resultados do mapa' : 'Sugestões de lugares'}
            className="max-h-72 overflow-y-auto py-1"
          >
            {options.map((option, index) => (
              <li
                key={option.kind === 'region' ? option.region.id : 'buscar-no-mapa'}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => activate(option)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 px-4 py-3',
                  option.kind === 'search-online' && index > 0 && 'border-t-2 border-pao/20',
                  index === activeIndex ? 'bg-mostarda/25' : 'hover:bg-mostarda/15',
                )}
              >
                {option.kind === 'region' ? (
                  <>
                    <MapPin aria-hidden="true" className="size-4 shrink-0 text-ketchup-forte" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{option.region.name}</span>
                      {option.region.context && (
                        <span className="block truncate text-sm text-texto-suave">
                          {option.region.context}
                        </span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Globe aria-hidden="true" className="size-4 shrink-0 text-ketchup-forte" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        Buscar “{term}” em todo o mapa
                      </span>
                      <span className="block truncate text-sm text-texto-suave">
                        Bairros e cidades do OpenStreetMap
                      </span>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
          {isOnline && (
            // Crédito exigido pela política do Nominatim e pela licença do OSM (ODbL).
            <p className="border-t-2 border-pao/20 px-4 py-2 text-xs text-texto-suave">
              Dados ©{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClasses}
              >
                colaboradores do OpenStreetMap
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </p>
          )}
        </div>
      </div>

      <p
        id={hintId}
        className={cn(
          'text-sm',
          notFound || onlineEmpty || onlineFailed
            ? 'font-semibold text-ketchup-forte'
            : 'text-texto-suave',
        )}
      >
        {notFound
          ? `Não encontramos “${query.trim()}”. Tente o nome de um bairro ou de uma cidade.`
          : onlineEmpty
            ? `Não encontramos “${onlineTerm ?? ''}” no mapa. Confira a grafia ou tente uma cidade próxima.`
            : onlineFailed
              ? describePlacesError(onlineQuery.error)
              : suggestionsQuery.isError
                ? 'Não foi possível buscar agora. Verifique a conexão e tente de novo.'
                : 'Se você negar a permissão no navegador, é só buscar aqui.'}
        {onlineFailed && !onlineQuery.isFetching && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => void onlineQuery.refetch()}
              className={linkClasses}
            >
              Tentar de novo
            </button>
          </>
        )}
      </p>

      <p role="status" className="sr-only">
        {statusMessage}
      </p>
    </form>
  )
}
