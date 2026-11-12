import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { LoaderCircle, MapPin, Search } from 'lucide-react'
import { useId, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  MIN_QUERY_LENGTH,
  normalizeText,
  suggestRegions,
} from '@/services/location/regionSearchService'
import type { RegionSuggestion } from '@/types/location.types'
import { cn } from '@/utils/cn'

/** A lista local responde na hora: sem espera entre as teclas. */
const TYPING_DELAY_MS = 0

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
 */
export function RegionSearch({ onSelect, busy = false, inputRef }: RegionSearchProps) {
  const inputId = useId()
  const listId = useId()
  const hintId = useId()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [notFound, setNotFound] = useState(false)

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
  const suggestions = searchable ? (suggestionsQuery.data ?? []) : []
  const searching = searchable && suggestionsQuery.isFetching
  const typing = query.trim() !== term

  const showList = open && suggestions.length > 0
  const optionId = (index: number) => `${listId}-opcao-${index}`

  function choose(region: RegionSuggestion) {
    setQuery(region.name)
    setOpen(false)
    onSelect(region)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1))
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
    // Enter sem sugestão destacada escolhe a primeira (a mais relevante).
    const region = suggestions[activeIndex] ?? suggestions[0]
    if (region) {
      choose(region)
    } else if (query.trim()) {
      setNotFound(true)
    }
  }

  const statusMessage =
    !open || !searchable
      ? ''
      : searching || typing
        ? 'Buscando lugares…'
        : suggestionsQuery.isError
          ? 'Não foi possível buscar agora. Tente de novo.'
          : suggestions.length === 0
            ? 'Nenhum lugar encontrado.'
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
            aria-invalid={notFound || undefined}
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
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="min-w-0 flex-1 bg-transparent py-3.5 text-lg outline-none placeholder:text-texto-suave/70"
          />
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões de lugares"
          hidden={!showList}
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border-2 border-tostado bg-superficie py-1 shadow-offset"
        >
          {suggestions.map((region, index) => (
            <li
              key={region.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              // mousedown + preventDefault: o campo não perde o foco antes do clique.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(region)}
              className={cn(
                'flex cursor-pointer items-center gap-3 px-4 py-3',
                index === activeIndex ? 'bg-mostarda/25' : 'hover:bg-mostarda/15',
              )}
            >
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-ketchup-forte" />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{region.name}</span>
                <span className="block truncate text-sm text-texto-suave">{region.context}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p
        id={hintId}
        className={cn(
          'text-sm',
          notFound ? 'font-semibold text-ketchup-forte' : 'text-texto-suave',
        )}
      >
        {notFound
          ? `Não encontramos “${query.trim()}”. Tente o nome de um bairro ou de uma cidade.`
          : suggestionsQuery.isError
            ? 'Não foi possível buscar agora. Verifique a conexão e tente de novo.'
            : 'Se você negar a permissão no navegador, é só buscar aqui.'}
      </p>

      <p role="status" className="sr-only">
        {statusMessage}
      </p>
    </form>
  )
}
