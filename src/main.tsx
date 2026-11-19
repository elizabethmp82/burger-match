import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
// Fontes oficiais (licença SIL OFL) servidas pelo próprio app — funcionam offline
// e não enviam visitas a terceiros. Só o alfabeto latino (português incluso).
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './styles/globals.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado em index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
