/**
 * Wrapper sobre react-hot-toast com deduplicação global.
 * Usar IDs fixos por tipo garante que uma nova notificação do mesmo
 * tipo substitui a anterior em vez de se acumular.
 */
import { toast as _toast } from 'react-hot-toast'

const toast = {
  success: (msg, opts) => _toast.success(msg, { id: 'toast-success', ...opts }),
  error:   (msg, opts) => _toast.error(msg,   { id: 'toast-error',   ...opts }),
  loading: (msg, opts) => _toast.loading(msg, { id: 'toast-loading', ...opts }),
  // Smart alert: detecta tipo pelo conteúdo da mensagem
  alert: (msg, opts) => {
    const m = String(msg)
    if (/erro|falha|falhou|❌|inválido|obrigatório|não.*permitiu|não.*possível/i.test(m)) {
      return _toast.error(m, { id: 'toast-error', ...opts })
    }
    if (/sucesso|criado|atualizado|deletado|excluído|desativado|ativado|✅|copiado|enviado|removido|limpo/i.test(m)) {
      return _toast.success(m, { id: 'toast-success', ...opts })
    }
    if (/⚠️|atenção|aviso/i.test(m)) {
      return _toast(m, { id: 'toast-warn', icon: '⚠️', style: { background: '#FEF3C7', color: '#92400E' }, ...opts })
    }
    return _toast(m, { id: 'toast-info', ...opts })
  },
  promise: (promise, msgs, opts) => _toast.promise(promise, msgs, opts),
  dismiss: (...args) => _toast.dismiss(...args),
  remove:  (...args) => _toast.remove(...args),
  custom:  (...args) => _toast(...args),
}

export default toast
export { toast }
