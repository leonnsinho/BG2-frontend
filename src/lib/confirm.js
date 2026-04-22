/**
 * Confirmação customizada com modal React.
 *
 * Uso:
 *   import confirmDialog from '@/lib/confirm'
 *   const ok = await confirmDialog('Deseja deletar?')
 *   const ok = await confirmDialog('Excluir conta?', { danger: true, title: 'Atenção' })
 *
 * Requer <ConfirmDialogMount /> montado em App.jsx.
 */

let _openFn = null

/** Registrado pelo componente ConfirmDialogMount ao montar */
export function _registerConfirmOpen(fn) {
  _openFn = fn
}

export default function confirmDialog(message, options = {}) {
  if (!_openFn) {
    // Fallback para window.confirm caso o componente não esteja montado
    return Promise.resolve(window.confirm(message))
  }
  return new Promise((resolve) => {
    _openFn({ message, resolve, ...options })
  })
}
