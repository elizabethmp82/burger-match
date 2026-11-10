import { useSearchParams } from 'react-router'
import { LocationStep } from '../components/LocationStep'
import { WelcomeIntro } from '../components/WelcomeIntro'

/**
 * Boas-vindas em duas etapas na mesma rota "/":
 *   /                → apresentação + "Começar agora"
 *   /?step=location  → "Onde você está?" (permissão ou busca manual — RN02/RN03)
 */
export function WelcomePage() {
  const [searchParams] = useSearchParams()

  return searchParams.get('step') === 'location' ? <LocationStep /> : <WelcomeIntro />
}
