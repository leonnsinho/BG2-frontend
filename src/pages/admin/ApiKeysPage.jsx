import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Zap,
  Clock,
  Check,
  Code,
  Link as LinkIcon,
  Lock,
  Construction
} from 'lucide-react'

// ─── FEATURE FLAG ─────────────────────────────────────────────────────────────
const EM_DESENVOLVIMENTO = true

// ── Coming Soon Screen ───────────────────────────────────────────────────────
function EmDesenvolvimentoScreen() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gray-100 mb-6">
          <Construction className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Em Desenvolvimento</h1>
        <p className="text-gray-500 mb-8">
          O módulo de API externa está sendo preparado.<br />
          Em breve estará disponível para uso.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full text-sm font-medium text-yellow-700">
          <Lock className="h-4 w-4" />
          Acesso bloqueado
        </div>
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────────────────────
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => chars[b % chars.length])
    .join('')
  return `pk_bg2_${random}`
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

// ── sub-components ───────────────────────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ApiKeysPage() {
  if (EM_DESENVOLVIMENTO) return <EmDesenvolvimentoScreen />

  const { profile } = useAuth()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)

  // create form state
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formExpires, setFormExpires] = useState('')
  const [creating, setCreating] = useState(false)

  // newly created key — shown once
  const [newKeyValue, setNewKeyValue] = useState(null)
  const [showNewKey, setShowNewKey] = useState(false)

  // delete confirm
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchKeys = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_hash, description, is_active, created_at, last_used_at, expires_at, created_by')
      .order('created_at', { ascending: false })
    if (error) { toast.error('Erro ao carregar chaves'); console.error(error) }
    else setKeys(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  // ── toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (key) => {
    const next = !key.is_active
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: next })
      .eq('id', key.id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    toast.success(next ? 'Chave ativada' : 'Chave revogada')
    setKeys(prev => prev.map(k => k.id === key.id ? { ...k, is_active: next } : k))
  }

  // ── create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formName.trim()) { toast.error('Nome é obrigatório'); return }
    setCreating(true)

    const keyValue = generateApiKey()
    const payload = {
      name: formName.trim(),
      key_hash: keyValue,
      description: formDesc.trim() || null,
      is_active: true,
      created_by: profile?.id ?? null,
      expires_at: formExpires ? new Date(formExpires).toISOString() : null
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert([payload])
      .select('*')
      .single()

    if (error) {
      toast.error('Erro ao criar chave: ' + error.message)
      setCreating(false)
      return
    }

    toast.success('Chave criada com sucesso!')
    setKeys(prev => [data, ...prev])
    setNewKeyValue(keyValue)
    setShowNewKey(true)
    setShowForm(false)
    setFormName('')
    setFormDesc('')
    setFormExpires('')
    setCreating(false)
  }

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const { error } = await supabase.from('api_keys').delete().eq('id', deleteId)
    if (error) { toast.error('Erro ao excluir chave'); setDeleting(false); return }
    toast.success('Chave excluída')
    setKeys(prev => prev.filter(k => k.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const baseUrl = 'https://ecmgbinyotuxhiniadom.supabase.co/functions/v1/external-api'

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBA500]/10">
              <Key className="h-6 w-6 text-[#EBA500]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Externa</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gerencie chaves de acesso para integrações externas (n8n, Zapier, Make…)</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#EBA500] hover:bg-[#d49500] text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Nova Chave
            </button>
          )}
        </div>

        {/* === Nova chave criada — mostrar UMA VEZ === */}
        {showNewKey && newKeyValue && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle className="h-5 w-5" />
                Chave criada — copie agora, não será mostrada novamente
              </div>
              <button onClick={() => { setShowNewKey(false); setNewKeyValue(null) }}
                className="p-1 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3">
              <code className="flex-1 text-sm text-gray-800 break-all font-mono">{newKeyValue}</code>
              <CopyButton value={newKeyValue} />
            </div>
          </div>
        )}

        {/* === Formulário de criação === */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#EBA500]" /> Nova Chave de API
              </h2>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da chave *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Ex: n8n Produção"
                    required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Ex: Automação de tarefas via n8n"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiração (opcional)</label>
                  <input
                    type="date"
                    value={formExpires}
                    onChange={e => setFormExpires(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Deixe em branco para não expirar</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#EBA500] hover:bg-[#d49500] text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60">
                  {creating
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Criando...</>
                    : <><Key className="h-4 w-4" />Gerar Chave</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === Tabela de chaves === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Chaves Ativas — <span className="text-gray-400 font-normal">{keys.length} no total</span>
            </h2>
            <button onClick={fetchKeys} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Recarregar">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Carregando…</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center">
              <Key className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhuma chave criada ainda.</p>
              <button onClick={() => setShowForm(true)}
                className="mt-3 text-sm text-[#EBA500] font-medium hover:underline">
                Criar primeira chave
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Nome</th>
                    <th className="text-left px-5 py-3 hidden sm:table-cell">Chave</th>
                    <th className="text-left px-5 py-3 hidden md:table-cell">Criada em</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Último uso</th>
                    <th className="text-left px-5 py-3 hidden lg:table-cell">Expiração</th>
                    <th className="text-center px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {keys.map(key => {
                    const isExpired = key.expires_at && new Date(key.expires_at) < new Date()
                    const effectiveActive = key.is_active && !isExpired
                    return (
                      <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{key.name}</p>
                          {key.description && <p className="text-xs text-gray-400 mt-0.5">{key.description}</p>}
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1 font-mono text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1 w-fit max-w-[200px]">
                            <span className="truncate">{key.key_hash.slice(0, 24)}…</span>
                            <CopyButton value={key.key_hash} />
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-gray-500 text-xs whitespace-nowrap">
                          {fmtDate(key.created_at)}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-gray-500 text-xs whitespace-nowrap">
                          {fmtDate(key.last_used_at)}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-xs whitespace-nowrap">
                          {isExpired ? (
                            <span className="text-red-500 font-medium">Expirada</span>
                          ) : key.expires_at ? (
                            <span className="text-gray-500">{fmtDate(key.expires_at)}</span>
                          ) : (
                            <span className="text-gray-400">Sem expiração</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleActive(key)}
                            title={effectiveActive ? 'Revogar' : 'Ativar'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              effectiveActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {effectiveActive
                              ? <><CheckCircle className="h-3.5 w-3.5" />Ativa</>
                              : <><XCircle className="h-3.5 w-3.5" />{isExpired ? 'Expirada' : 'Revogada'}</>}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setDeleteId(key.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* === Referência rápida de endpoints === */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Code className="h-4 w-4 text-[#EBA500]" />
            <h2 className="text-base font-semibold text-gray-900">Referência de Endpoints</h2>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-gray-500 mb-4">
              Envie o header <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-700">x-api-key: SUA_CHAVE</code> em todas as requisições.
            </p>
            {[
              { method: 'GET',   color: 'blue',   path: '/companies',                      desc: 'Listar empresas' },
              { method: 'GET',   color: 'blue',   path: '/companies/:id',                  desc: 'Detalhes de uma empresa' },
              { method: 'GET',   color: 'blue',   path: '/companies/:id/users',             desc: 'Usuários da empresa' },
              { method: 'GET',   color: 'blue',   path: '/companies/:id/tasks',             desc: 'Tarefas (filtros: status, priority, limit)' },
              { method: 'POST',  color: 'green',  path: '/companies/:id/tasks',             desc: 'Criar tarefa' },
              { method: 'PATCH', color: 'yellow', path: '/tasks/:id',                      desc: 'Atualizar tarefa' },
              { method: 'GET',   color: 'blue',   path: '/companies/:id/evaluations',       desc: 'Avaliações de processos' },
              { method: 'GET',   color: 'blue',   path: '/journeys',                       desc: 'Listar jornadas' },
              { method: 'GET',   color: 'blue',   path: '/journeys/:id/processes',          desc: 'Processos de uma jornada' },
            ].map(({ method, color, path, desc }) => (
              <div key={path + method} className="flex items-center gap-3 text-sm">
                <span className={`text-xs font-bold w-14 text-center py-0.5 rounded-md shrink-0 ${
                  color === 'blue'   ? 'bg-blue-100 text-blue-700' :
                  color === 'green'  ? 'bg-green-100 text-green-700' :
                  color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{method}</span>
                <code className="text-gray-700 font-mono text-xs bg-gray-50 px-2 py-1 rounded-lg flex-1 truncate">{baseUrl}{path}</code>
                <span className="text-gray-400 text-xs hidden md:block shrink-0">{desc}</span>
                <CopyButton value={`${baseUrl}${path}`} />
              </div>
            ))}
          </div>
        </div>

        {/* === n8n Quick Start === */}
        <div className="bg-gradient-to-br from-[#EBA500]/5 to-yellow-50 border border-[#EBA500]/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-[#EBA500]" />
            <h2 className="text-base font-semibold text-gray-900">Configurar no n8n</h2>
          </div>
          <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
            <li>Adicione um nó <strong>HTTP Request</strong></li>
            <li>Defina o <strong>Method</strong> e a <strong>URL</strong> do endpoint desejado</li>
            <li>Em <strong>Headers</strong>, adicione <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono text-xs">x-api-key</code> com o valor da chave criada acima</li>
            <li>Em <strong>Body</strong> (para POST/PATCH), envie um JSON com os campos necessários</li>
          </ol>
          <div className="mt-4 bg-white border border-gray-200 rounded-xl p-4 text-xs font-mono text-gray-600 space-y-1">
            <div><span className="text-purple-600">POST</span> <span className="text-blue-600">{baseUrl}/companies/{'<id>'}/tasks</span></div>
            <div className="text-gray-400">Headers:</div>
            <div className="pl-2 text-green-700">  x-api-key: pk_bg2_...</div>
            <div className="pl-2 text-green-700">  Content-Type: application/json</div>
            <div className="text-gray-400">Body:</div>
            <div className="pl-2">{'{'} "title": "Revisão mensal", "priority": "high" {'}'}</div>
          </div>
        </div>
      </div>

      {/* === Modal confirmação de exclusão === */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Excluir chave?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              A chave será permanentemente excluída. Integrações que a utilizam vão parar de funcionar imediatamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-60 transition-colors"
              >
                {deleting
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
