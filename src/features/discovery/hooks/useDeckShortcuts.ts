import { useEffect, useEffectEvent } from 'react'

interface DeckShortcutHandlers {
  onSkip: () => void
  onLike: () => void
  onDetails: () => void
  onUndo: () => void
}

/** Não sequestra as setas enquanto o usuário digita ou escolhe uma opção. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  )
}

/**
 * Atalhos de teclado do Descobrir (alternativa acessível aos gestos):
 *   ←  pular   ·   →  curtir   ·   ↑  detalhes   ·   Ctrl/⌘ + Z  desfazer
 */
export function useDeckShortcuts(handlers: DeckShortcutHandlers) {
  // useEffectEvent: a função sempre enxerga os handlers mais recentes,
  // sem precisar reinscrever o listener a cada renderização.
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat || isEditableTarget(event.target)) return

    const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z'
    if (isUndo && !event.shiftKey && !event.altKey) {
      event.preventDefault()
      handlers.onUndo()
      return
    }

    // As setas só valem sem modificadores (Alt+← é "voltar" no navegador).
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return

    const action = {
      ArrowLeft: handlers.onSkip,
      ArrowRight: handlers.onLike,
      ArrowUp: handlers.onDetails,
    }[event.key]

    if (action) {
      event.preventDefault() // evita rolar a página
      action()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
