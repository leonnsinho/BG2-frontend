import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { toast } from 'react-hot-toast'
import {
  X,
  Wrench,
  Check,
  Ban,
  RotateCcw,
  BarChart,
  Target,
  LayoutGrid,
  Compass,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertCircle
} from 'lucide-react'

const TOOL_ICONS = {
  'bar-chart': BarChart,
  'target': Target,
  'layout-grid': LayoutGrid,
  'compass': Compass,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'tool': Wrench
}

const CATEGORY_COLORS = {
  'strategic': { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  'financial': { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  'operational': { bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  'default': { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' }
}

const CATEGORY_LABELS = {
  'strategic': 'Estratégico',
  'financial': 'Financeiro',
  'operational': 'Operacional'
}

export default function ToolManagementModal({ user, onClose, companyId }) {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    setTimeout(() => setAnimating(true), 10)
    if (companyId) {
      loadTools()
    } else {
      console.error('Company ID não fornecido')
      toast.error('Erro: Empresa não identificada')
      setLoading(false)
    }
  }, [])

  const loadTools = async () => {
    try {
      setLoading(true)

      // Buscar todas as ferramentas ativas
      const { data: toolsData, error: toolsError } = await supabase
        .from('system_tools')
        .select('*')
        .eq('is_active', true)
        .order('order_index')
        .order('name')

      if (toolsError) throw toolsError

      // Buscar permissões do usuário para esta empresa
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_tool_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId)

      if (permissionsError) throw permissionsError

      // Combinar dados
      const permissionsMap = {}
      permissionsData?.forEach(perm => {
        permissionsMap[perm.tool_id] = perm
      })

      const combinedTools = toolsData?.map(tool => ({
        tool_id: tool.id,
        tool_name: tool.name,
        tool_slug: tool.slug,
        tool_route: tool.route,
        tool_icon: tool.icon,
        tool_category: tool.category,
        has_access: permissionsMap[tool.id]?.permission_type === 'allow' || !permissionsMap[tool.id],
        permission_type: permissionsMap[tool.id]?.permission_type || 'default',
        is_explicit: !!permissionsMap[tool.id]
      })) || []

      setTools(combinedTools)
    } catch (error) {
      console.error('Erro ao carregar ferramentas:', error)
      toast.error('Erro ao carregar ferramentas')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = async (toolSlug, permissionType) => {
    try {
      setSaving(true)

      // Buscar ID da ferramenta
      const { data: toolData, error: toolError } = await supabase
        .from('system_tools')
        .select('id')
        .eq('slug', toolSlug)
        .single()

      if (toolError) throw toolError

      if (permissionType === 'remove') {
        // Remover permissão personalizada
        const { error: deleteError } = await supabase
          .from('user_tool_permissions')
          .delete()
          .eq('user_id', user.id)
          .eq('tool_id', toolData.id)
          .eq('company_id', companyId)

        if (deleteError) throw deleteError
        toast.success('Permissão personalizada removida')
      } else {
        // Inserir ou atualizar permissão
        const { error: upsertError } = await supabase
          .from('user_tool_permissions')
          .upsert({
            user_id: user.id,
            tool_id: toolData.id,
            company_id: companyId,
            permission_type: permissionType,
            granted_by: (await supabase.auth.getUser()).data.user?.id
          }, {
            onConflict: 'user_id,tool_id,company_id'
          })

        if (upsertError) throw upsertError
        toast.success(`Permissão definida como: ${permissionType === 'allow' ? 'Permitir' : 'Negar'}`)
      }
      
      // Recarregar lista
      await loadTools()
    } catch (error) {
      console.error('Erro ao alterar permissão:', error)
      toast.error('Erro ao alterar permissão')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setAnimating(false)
    setTimeout(onClose, 200)
  }

  const getToolIcon = (iconName) => {
    const Icon = TOOL_ICONS[iconName] || Tool
    return Icon
  }

  const getCategoryColors = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default
  }

  const getPermissionStatus = (tool) => {
    if (!tool.is_explicit) {
      return {
        label: tool.has_access ? 'Permitido (Padrão)' : 'Negado (Padrão)',
        color: tool.has_access ? 'text-gray-500' : 'text-gray-400',
        icon: tool.has_access ? Check : Ban,
        isDefault: true
      }
    }

    if (tool.permission_type === 'allow') {
      return {
        label: 'Permitido',
        color: 'text-green-600',
        icon: Check,
        isDefault: false
      }
    }

    return {
      label: 'Bloqueado',
      color: 'text-red-600',
      icon: Ban,
      isDefault: false
    }
  }

  // Agrupar por categoria
  const groupedTools = tools.reduce((acc, tool) => {
    const category = tool.tool_category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(tool)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 overflow-hidden">
      <div
        className={`bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col transform transition-all duration-200 overflow-hidden ${
          animating ? 'translate-y-0 sm:scale-100 opacity-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EBA500] to-[#d49400] flex items-center justify-center shadow-lg flex-shrink-0">
                <Wrench className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Gerenciar Ferramentas</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
                  {user.full_name || user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-all flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EBA500]"></div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Aviso informativo */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-900">
                  <p className="font-semibold mb-1">Como funcionam as permissões:</p>
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-blue-800">
                    <li className="leading-tight sm:leading-normal"><strong>Permitido (Padrão):</strong> Ferramenta acessível pela função do usuário</li>
                    <li className="leading-tight sm:leading-normal"><strong>Permitido:</strong> Acesso explicitamente concedido</li>
                    <li className="leading-tight sm:leading-normal"><strong>Bloqueado:</strong> Acesso explicitamente negado</li>
                  </ul>
                </div>
              </div>

              {/* Ferramentas agrupadas por categoria */}
              {Object.entries(groupedTools).map(([category, categoryTools]) => {
                const colors = getCategoryColors(category)
                
                return (
                  <div key={category} className="space-y-2 sm:space-y-3">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <div className={`h-0.5 sm:h-1 w-6 sm:w-8 rounded-full bg-gradient-to-r ${colors.bg}`}></div>
                      {CATEGORY_LABELS[category] || 'Outros'}
                    </h3>

                    <div className="grid gap-2 sm:gap-3">
                      {categoryTools.map((tool) => {
                        const Icon = getToolIcon(tool.tool_icon)
                        const status = getPermissionStatus(tool)
                        const StatusIcon = status.icon

                        return (
                          <div
                            key={tool.tool_id}
                            className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 hover:shadow-md w-full max-w-full overflow-hidden`}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-4 w-full max-w-full">
                              {/* Icon */}
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                  {tool.tool_name}
                                </h4>
                                <p className="text-xs text-gray-600 truncate hidden sm:block">
                                  {tool.tool_description || tool.tool_route}
                                </p>
                                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                  <StatusIcon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0 ${status.color}`} />
                                  <span className={`text-[10px] sm:text-xs font-medium ${status.color} truncate`}>
                                    {status.label}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {/* Permitir */}
                                <button
                                  onClick={() => handlePermissionChange(tool.tool_slug, 'allow')}
                                  disabled={saving || (tool.is_explicit && tool.permission_type === 'allow')}
                                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all active:scale-95 ${
                                    tool.is_explicit && tool.permission_type === 'allow'
                                      ? 'bg-green-600 text-white shadow-md'
                                      : 'bg-white hover:bg-green-50 text-green-600 border border-green-200 hover:border-green-300'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Permitir acesso"
                                >
                                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>

                                {/* Bloquear */}
                                <button
                                  onClick={() => handlePermissionChange(tool.tool_slug, 'deny')}
                                  disabled={saving || (tool.is_explicit && tool.permission_type === 'deny')}
                                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all active:scale-95 ${
                                    tool.is_explicit && tool.permission_type === 'deny'
                                      ? 'bg-red-600 text-white shadow-md'
                                      : 'bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  title="Bloquear acesso"
                                >
                                  <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </button>

                                {/* Resetar para padrão */}
                                {tool.is_explicit && (
                                  <button
                                    onClick={() => handlePermissionChange(tool.tool_slug, 'remove')}
                                    disabled={saving}
                                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Voltar ao padrão"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              {tools.length} ferramenta{tools.length !== 1 ? 's' : ''} disponível{tools.length !== 1 ? 'is' : ''}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 sm:py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d49400] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
