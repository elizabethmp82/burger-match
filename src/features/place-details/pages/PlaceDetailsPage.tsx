import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { paths } from '@/routes/paths'

/** Placeholder da Etapa 1 — conteúdo completo na Etapa 2. */
export function PlaceDetailsPage() {
  const { placeId } = useParams<{ placeId: string }>()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pt-6">
      <Link
        to={paths.discover}
        className="inline-flex items-center gap-2 font-semibold text-texto-suave hover:text-tostado"
      >
        <ArrowLeft aria-hidden="true" className="size-5" />
        Voltar
      </Link>
      <h1 className="text-4xl tracking-logo">Detalhes</h1>
      <p className="text-texto-suave">placeId: {placeId}</p>
    </main>
  )
}
