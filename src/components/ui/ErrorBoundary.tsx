import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** O que mostrar no lugar quando algo dentro falhar. */
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  failed: boolean
}

/**
 * Isola uma parte da tela: se ela falhar, só ela é trocada pelo `fallback`.
 *
 * Uso principal: partes carregadas sob demanda (mapa). Sem internet, ou depois de
 * uma versão nova ser publicada, o arquivo pode não carregar — sem isto, o app
 * inteiro cairia na tela de erro.
 * (Error boundaries ainda precisam ser classes no React.)
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn(
      '[app] Parte da tela não carregou; usando a alternativa.',
      error,
      info.componentStack,
    )
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
