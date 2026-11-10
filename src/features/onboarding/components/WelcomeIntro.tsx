import { Heart, Layers2, MapPin, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { BrandIcon, Wordmark } from '@/components/ui/Brand'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { locationStepPath } from '@/routes/paths'
import { cn } from '@/utils/cn'

interface Feature {
  icon: LucideIcon
  iconClassName: string
  title: string
  description: string
}

const features: readonly Feature[] = [
  {
    icon: MapPin,
    iconClassName: 'bg-ketchup/10 text-ketchup-forte',
    title: 'Perto de você.',
    description: 'Usamos sua localização para achar hamburguerias por perto.',
  },
  {
    icon: Layers2,
    iconClassName: 'bg-mostarda/25 text-tostado',
    title: 'Deslize.',
    description: 'Para a direita para curtir, para a esquerda para pular.',
  },
  {
    icon: Heart,
    iconClassName: 'bg-ketchup/10 text-ketchup-forte',
    title: 'Dê match.',
    description: 'Suas curtidas viram uma lista de favoritas.',
  },
]

export function WelcomeIntro() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-12 pb-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <BrandIcon className="size-32" />
        <h1 className="text-5xl">
          <Wordmark />
        </h1>
        <p className="text-lg font-medium text-texto-suave">Encontre sua hamburgueria ideal</p>
      </header>

      <ul className="mt-10 mb-8 flex flex-col gap-3">
        {features.map(({ icon: Icon, iconClassName, title, description }) => (
          <li
            key={title}
            className="flex items-center gap-4 rounded-2xl border-2 border-tostado bg-superficie p-4"
          >
            <span
              className={cn('grid size-12 shrink-0 place-items-center rounded-xl', iconClassName)}
            >
              <Icon aria-hidden="true" className="size-6" strokeWidth={2.25} />
            </span>
            <p>
              <strong className="font-bold">{title}</strong> {description}
            </p>
          </li>
        ))}
      </ul>

      <Link to={locationStepPath} className={buttonClasses('primary', 'mt-auto w-full')}>
        Começar agora
      </Link>
    </main>
  )
}
