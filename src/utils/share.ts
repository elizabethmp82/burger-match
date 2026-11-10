export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/**
 * Compartilha um link: usa o menu nativo do sistema quando existe (celulares,
 * Safari, Edge) e, senão, copia o link para a área de transferência.
 */
export async function shareLink(title: string, url: string): Promise<ShareResult> {
  // navigator.share não existe em todos os navegadores (ex.: Firefox desktop).
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch {
      return 'cancelled' // o usuário fechou a janela de compartilhamento
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/** Mensagem para o leitor de tela (vazia quando não há nada a anunciar). */
export function shareResultMessage(result: ShareResult): string {
  if (result === 'copied') return 'Link copiado.'
  if (result === 'failed') return 'Não foi possível copiar o link.'
  return ''
}
