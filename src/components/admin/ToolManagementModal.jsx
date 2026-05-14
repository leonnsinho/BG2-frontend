import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { toast } from '@/lib/toast'
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
  AlertCircle,
  Kanban,
  Save,
  Users,
  Settings,
  Map,
  ArrowLeft
} from 'lucide-react'

const TOOL_ICONS = {
  'bar-chart': BarChart,
  'target': Target,
  'layout-grid': LayoutGrid,
  'compass': Compass,
  'dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'kanban': Kanban,
  'tool': Wrench,
  'users': Users,
  'settings': Settings
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

// Slugs dos sub-módulos de Políticas de Gestão (renderizados aninhados dentro do card pai)
const POLITICAS_CHILDREN_SLUGS = [
  'politicas-estrategica',
  'politicas-financeira',
  'politicas-pessoas-cultura',
  'politicas-receita',
  'politicas-operacional',
]

// Slugs dos sub-módulos de Performance (renderizados aninhados dentro do card pai)
const PERFORMANCE_CHILDREN_SLUGS = [
  'performance-reports',
]

const JOURNEY_META = {
  'estrategica':    { name: 'Jornada Estratégica',      icon: Target },
  'financeira':     { name: 'Jornada Financeira',       icon: DollarSign },
  'pessoas-cultura':{ name: 'Jornada Pessoas e Cultura', icon: Users },
  'receita':    { name: 'Jornada Receita',           icon: TrendingUp },
  'operacional':    { name: 'Jornada Operacional',       icon: Settings },
}

export default function ToolManagementModal({ user, onClose, companyId, onBack }) {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [animating, setAnimating] = useState(false)
  // { [toolSlug]: 'allow' | 'deny' | 'remove' } — changes not yet saved
  const [pendingChanges, setPendingChanges] = useState({})

  // Journey state
  const [journeyList, setJourneyList] = useState([]) // { id, name, slug, is_assigned }
  const [pendingJourneyChanges, setPendingJourneyChanges] = useState({}) // { [slug]: 'assign' | 'revoke' }

  useEffect(() => {
    setTimeout(() => setAnimating(true), 10)
    if (companyId) {
      loadTools()
      loadJourneys()
    } else {
      console.error('Company ID não fornecido')
      toast.error('Erro: Empresa não identificada')
      setLoading(false)
    }
  }, [])

  const loadTools = async () => {
    try {
      setLoading(true)

      // 1. Buscar todas as ferramentas ativas
      const { data: toolsData, error: toolsError } = await supabase
        .from('system_tools')
        .select('*')
        .eq('is_active', true)
        .order('order_index')
        .order('name')

      if (toolsError) {
        console.error('[ToolModal] Erro ao buscar system_tools:', toolsError)
        throw toolsError
      }

      // 2. Buscar permissões explícitas do usuário para esta empresa
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_tool_permissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId)

      if (permissionsError) {
        // RLS pode bloquear leitura para super_admin — continua com lista vazia
        console.warn('[ToolModal] Aviso ao buscar permissões (verificar RLS se vazio):', permissionsError)
      }

      console.log('[ToolModal] loadTools →', {
        userId: user.id,
        companyId,
        tools: toolsData?.length,
        permissions: permissionsData?.length ?? 0,
      })

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
        is_explicit: !!permissionsMap[tool.id],
      })) || []

      setTools(combinedTools)
    } catch (error) {
      console.error('[ToolModal] Erro crítico ao carregar ferramentas:', error)
      toast.error('Erro ao carregar ferramentas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Returns the tool state with any pending local changes applied
  const getEffectiveTool = (tool) => {
    const pending = pendingChanges[tool.tool_slug]
    if (!pending) return tool
    if (pending === 'remove') {
      return { ...tool, is_explicit: false, permission_type: 'default', has_access: true }
    }
    return { ...tool, is_explicit: true, permission_type: pending, has_access: pending === 'allow' }
  }

  // Update local state only — no Supabase call
  const handlePermissionChange = (toolSlug, permissionType) => {
    const tool = tools.find(t => t.tool_slug === toolSlug)
    if (!tool) return

    // Check if this action would revert to the original DB state (no-op)
    const isNoop = permissionType === 'remove'
      ? !tool.is_explicit
      : (tool.is_explicit && tool.permission_type === permissionType)

    setPendingChanges(prev => {
      const next = { ...prev }
      if (isNoop) {
        delete next[toolSlug]
      } else {
        next[toolSlug] = permissionType
      }
      return next
    })
  }

  const loadJourneys = async () => {
    try {
      const [{ data: journeysData }, { data: assignmentsData }] = await Promise.all([
        supabase.from('journeys').select('id, name, slug').order('name'),
        supabase
          .from('user_journey_assignments')
          .select('journey_id, is_active')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .eq('is_active', true),
      ])

      const activeIds = new Set((assignmentsData || []).map(a => a.journey_id))
      setJourneyList(
        (journeysData || []).map(j => ({ ...j, is_assigned: activeIds.has(j.id) }))
      )
    } catch (err) {
      console.error('[ToolModal] Erro ao carregar jornadas:', err)
    }
  }

  const getEffectiveJourneyAssigned = (journey) => {
    const pending = pendingJourneyChanges[journey.slug]
    if (!pending) return journey.is_assigned
    return pending === 'assign'
  }

  const handleJourneyAction = (journey, action) => {
    const isNoop = action === 'assign' ? journey.is_assigned : !journey.is_assigned
    setPendingJourneyChanges(prev => {
      const next = { ...prev }
      if (isNoop) {
        delete next[journey.slug]
      } else {
        next[journey.slug] = action
      }
      return next
    })
  }

  const handleSave = async () => {
    const entries = Object.entries(pendingChanges)
    const journeyEntries = Object.entries(pendingJourneyChanges)
    if (entries.length === 0 && journeyEntries.length === 0) {
      handleClose()
      return
    }
    try {
      setSaving(true)
      const currentUserId = (await supabase.auth.getUser()).data.user?.id

      console.log('[ToolModal] handleSave →', {
        targetUser: user.id,
        companyId,
        callerUserId: currentUserId,
        changes: pendingChanges,
      })

      for (const [toolSlug, permissionType] of entries) {
        // Buscar id da ferramenta pelo slug
        const { data: toolData, error: toolError } = await supabase
          .from('system_tools')
          .select('id')
          .eq('slug', toolSlug)
          .single()

        if (toolError) {
          console.error('[ToolModal] Erro ao buscar tool:', toolSlug, toolError)
          throw toolError
        }

        if (permissionType === 'remove') {
          const { error } = await supabase
            .from('user_tool_permissions')
            .delete()
            .eq('user_id', user.id)
            .eq('tool_id', toolData.id)
            .eq('company_id', companyId)
          if (error) {
            console.error('[ToolModal] Erro ao remover permissão:', error)
            throw error
          }
          console.log('[ToolModal] Removida permissão:', toolSlug)
        } else {
          // Upsert com .select() para detectar bloqueio silencioso de RLS
          const { data: upserted, error } = await supabase
            .from('user_tool_permissions')
            .upsert({
              user_id: user.id,
              tool_id: toolData.id,
              company_id: companyId,
              permission_type: permissionType,
              granted_by: currentUserId,
            }, { onConflict: 'user_id,tool_id,company_id' })
            .select('id')

          if (error) {
            console.error('[ToolModal] Erro no upsert:', toolSlug, error)
            throw error
          }

          if (!upserted || upserted.length === 0) {
            // RLS bloqueou sem lançar erro — sem permissão para salvar
            console.error('[ToolModal] RLS bloqueou o upsert silenciosamente para', toolSlug, { targetUser: user.id, companyId })
            throw new Error(
              `Sem permissão para alterar a ferramenta "${toolSlug}". ` +
              'Execute o script fix_user_tool_permissions_rls.sql no Supabase.'
            )
          }

          console.log('[ToolModal] Salva permissão:', toolSlug, '→', permissionType, upserted)
        }
      }

      // Save journey changes
      console.log('[ToolModal] Journey changes to save:', journeyEntries, 'journeyList:', journeyList.map(j => j.slug), 'companyId:', companyId)
      for (const [slug, action] of journeyEntries) {
        const journey = journeyList.find(j => j.slug === slug)
        if (!journey) {
          console.warn('[ToolModal] Journey not found in list:', slug, '— skipping')
          continue
        }
        console.log('[ToolModal] Saving journey:', slug, action, { journeyId: journey.id, userId: user.id, companyId })
        if (action === 'assign') {
          const { data: assignData, error } = await supabase.rpc('assign_journey_to_user', {
            p_user_id: user.id,
            p_journey_id: journey.id,
            p_company_id: companyId,
          })
          console.log('[ToolModal] assign_journey_to_user response:', { assignData, error })
          if (error) throw error
          if (!assignData) throw new Error(`assign_journey_to_user retornou null para jornada "${slug}"`)
          if (!assignData.success) throw new Error(assignData.error || `Falha ao atribuir jornada "${slug}"`)
        } else {
          const { data: rpcData, error } = await supabase.rpc('remove_journey_assignment', {
            p_user_id: user.id,
            p_journey_id: journey.id,
            p_company_id: companyId,
          })
          console.log('[ToolModal] remove_journey_assignment response:', { rpcData, error })
          if (error) throw error
          if (!rpcData) throw new Error(`remove_journey_assignment retornou null para jornada "${slug}"`)
          if (!rpcData.success) throw new Error(rpcData.error || `Falha ao remover jornada "${slug}"`)
        }
      }

      toast.success('Permissões salvas com sucesso!')
      setPendingChanges({})
      setPendingJourneyChanges({})
      await Promise.all([loadTools(), loadJourneys()])
    } catch (error) {
      console.error('[ToolModal] Erro ao salvar permissões:', error)
      toast.error(error.message || 'Erro ao salvar permissões')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setAnimating(false)
    setTimeout(onClose, 200)
  }

  const handleBack = () => {
    setAnimating(false)
    setTimeout(() => { onClose(); onBack?.() }, 200)
  }

  const getToolIcon = (iconName) => {
    const Icon = TOOL_ICONS[iconName] || Wrench
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

  const hasPendingChanges = Object.keys(pendingChanges).length > 0 || Object.keys(pendingJourneyChanges).length > 0

  const DFC_CHILDREN_SLUGS = ['dfc-entradas', 'dfc-saidas']
  const HIDDEN_SLUGS = [...DFC_CHILDREN_SLUGS, ...PERFORMANCE_CHILDREN_SLUGS, ...POLITICAS_CHILDREN_SLUGS]
  const flatTools = tools
    .map(getEffectiveTool)
    .filter(t => !HIDDEN_SLUGS.includes(t.tool_slug))

  // Grupos espelhando a estrutura do sidebar
  const MODULE_GROUPS = [
    {
      name: 'Estratégia',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      slugs: ['journey-overview', 'business-model'],
    },
    {
      name: 'Execução',
      icon: Kanban,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
      slugs: ['planejamento-estrategico', 'politicas-gestao'],
    },
    {
      name: 'Performance',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      slugs: ['modulo-performance'],
    },
    {
      name: 'Ferramentas',
      icon: LayoutGrid,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-700/40',
      borderColor: 'border-gray-200 dark:border-gray-600',
      slugs: ['crm', 'dfc-complete', 'performance-evaluation', 'management-indicators'],
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 overflow-hidden">
      <div
        className={`bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col transform transition-all duration-200 overflow-hidden ${
          animating ? 'translate-y-0 sm:scale-100 opacity-100' : 'translate-y-full sm:translate-y-0 sm:scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pr-2">
              {onBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex-shrink-0"
                  title="Voltar"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-400" />
                </button>
              )}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#EBA500] to-[#d49400] flex items-center justify-center shadow-lg flex-shrink-0">
                <Wrench className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Gerenciar Ferramentas</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {user.full_name || user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex-shrink-0"
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-semibold mb-1">Como funcionam as permissões:</p>
                  <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-blue-800 dark:text-blue-300">
                    <li className="leading-tight sm:leading-normal"><strong>Permitido (Padrão):</strong> Ferramenta acessível pela função do usuário</li>
                    <li className="leading-tight sm:leading-normal"><strong>Permitido:</strong> Acesso explicitamente concedido</li>
                    <li className="leading-tight sm:leading-normal"><strong>Bloqueado:</strong> Acesso explicitamente negado</li>
                  </ul>
                </div>
              </div>

              {/* Ferramentas por Módulo */}
              {MODULE_GROUPS.map((group) => {
                const groupTools = flatTools.filter(t => group.slugs.includes(t.tool_slug))
                if (groupTools.length === 0) return null
                const GroupIcon = group.icon
                return (
                  <div key={group.name} className="space-y-2 sm:space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${group.bgColor} ${group.borderColor}`}>
                      <GroupIcon className={`h-3.5 w-3.5 ${group.color} flex-shrink-0`} />
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${group.color}`}>{group.name}</h3>
                    </div>
                    <div className="grid gap-2 sm:gap-3 ml-1">
                      {groupTools.map((tool) => {
                  const Icon = getToolIcon(tool.tool_icon)
                  const status = getPermissionStatus(tool)
                  const StatusIcon = status.icon

                  // Sub-módulos aninhados (Políticas de Gestão, Performance ou DFC)
                  const childTools = tool.tool_slug === 'politicas-gestao'
                    ? tools.map(getEffectiveTool).filter(t => POLITICAS_CHILDREN_SLUGS.includes(t.tool_slug))
                    : tool.tool_slug === 'modulo-performance'
                    ? tools.map(getEffectiveTool).filter(t => PERFORMANCE_CHILDREN_SLUGS.includes(t.tool_slug))
                    : tool.tool_slug === 'dfc-complete'
                    ? tools.map(getEffectiveTool).filter(t => DFC_CHILDREN_SLUGS.includes(t.tool_slug))
                    : []

                  return (
                    <div
                      key={tool.tool_id}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 transition-all duration-200 hover:shadow-md w-full max-w-full overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-4 w-full max-w-full">
                        {/* Icon */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                            {tool.tool_name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate hidden sm:block">
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
                                : 'bg-white dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-700 hover:border-green-300'
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
                                : 'bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-700 hover:border-red-300'
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
                              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-gray-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Voltar ao padrão"
                            >
                              <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Jornadas — aninhadas em Planejamento Estratégico */}
                      {tool.tool_slug === 'planejamento-estrategico' && journeyList.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {journeyList.map((journey) => {
                            const isJourneyAssigned = getEffectiveJourneyAssigned(journey)
                            const isJourneyPending = !!pendingJourneyChanges[journey.slug]
                            const JourneyIcon = JOURNEY_META[journey.slug]?.icon || Map
                            return (
                              <div
                                key={journey.id}
                                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-2 flex items-center gap-2"
                              >
                                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                                  isJourneyAssigned ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-600 border-gray-100 dark:border-gray-500'
                                }`}>
                                  <JourneyIcon className={`h-3.5 w-3.5 ${isJourneyAssigned ? 'text-emerald-600' : 'text-gray-500'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{journey.name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {isJourneyAssigned ? (
                                      <Check className="h-2.5 w-2.5 flex-shrink-0 text-emerald-600" />
                                    ) : (
                                      <Ban className="h-2.5 w-2.5 flex-shrink-0 text-gray-400" />
                                    )}
                                    <span className={`text-[9px] font-medium truncate ${isJourneyAssigned ? 'text-emerald-600' : 'text-gray-400'}`}>
                                      {isJourneyAssigned ? 'Atribuída' : 'Não atribuída'}{isJourneyPending ? ' *' : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleJourneyAction(journey, 'assign')}
                                    disabled={saving || isJourneyAssigned}
                                    className={`p-1 rounded-lg transition-all active:scale-95 ${
                                      isJourneyAssigned
                                        ? 'bg-green-600 text-white shadow-sm'
                                        : 'bg-gray-50 dark:bg-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Atribuir jornada"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleJourneyAction(journey, 'revoke')}
                                    disabled={saving || !isJourneyAssigned}
                                    className={`p-1 rounded-lg transition-all active:scale-95 ${
                                      !isJourneyAssigned
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-gray-50 dark:bg-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Desatribuir jornada"
                                  >
                                    <Ban className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Sub-módulos aninhados (Políticas de Gestão) */}
                      {childTools.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {childTools.map((child) => {
                            const ChildIcon = getToolIcon(child.tool_icon)
                            const childStatus = getPermissionStatus(child)
                            const ChildStatusIcon = childStatus.icon

                            return (
                              <div
                                key={child.tool_id}
                                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-2 flex items-center gap-2"
                              >
                                {/* mini icon */}
                                <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-600 border border-gray-100 dark:border-gray-500 flex items-center justify-center flex-shrink-0">
                                  <ChildIcon className="h-3.5 w-3.5 text-gray-500" />
                                </div>

                                {/* name + status */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{child.tool_name}</p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <ChildStatusIcon className={`h-2.5 w-2.5 flex-shrink-0 ${childStatus.color}`} />
                                    <span className={`text-[9px] font-medium ${childStatus.color} truncate`}>{childStatus.label}</span>
                                  </div>
                                </div>

                                {/* mini actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handlePermissionChange(child.tool_slug, 'allow')}
                                    disabled={saving || (child.is_explicit && child.permission_type === 'allow')}
                                    className={`p-1 rounded-lg transition-all active:scale-95 ${
                                      child.is_explicit && child.permission_type === 'allow'
                                        ? 'bg-green-600 text-white shadow-sm'
                                      : 'bg-gray-50 dark:bg-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Permitir acesso"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handlePermissionChange(child.tool_slug, 'deny')}
                                    disabled={saving || (child.is_explicit && child.permission_type === 'deny')}
                                    className={`p-1 rounded-lg transition-all active:scale-95 ${
                                      child.is_explicit && child.permission_type === 'deny'
                                        ? 'bg-red-600 text-white shadow-sm'
                                      : 'bg-gray-50 dark:bg-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-700'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title="Bloquear acesso"
                                  >
                                    <Ban className="h-3 w-3" />
                                  </button>
                                  {child.is_explicit && (
                                    <button
                                      onClick={() => handlePermissionChange(child.tool_slug, 'remove')}
                                      disabled={saving}
                                      className="p-1 rounded-lg bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Voltar ao padrão"
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
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
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-3xl">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              {hasPendingChanges
                ? (() => {
                    const total = Object.keys(pendingChanges).length + Object.keys(pendingJourneyChanges).length
                    return <span className="text-amber-600 font-medium">{total} alteraç{total === 1 ? 'ão' : 'ões'} não salva{total === 1 ? '' : 's'}</span>
                  })()
                : <>{tools.length} ferramenta{tools.length !== 1 ? 's' : ''} · {journeyList.length} jornada{journeyList.length !== 1 ? 's' : ''}</>
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-5 py-3 sm:py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 sm:py-2.5 bg-gradient-to-r from-[#EBA500] to-[#d49400] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:transform-none"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
