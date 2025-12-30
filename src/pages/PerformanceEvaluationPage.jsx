import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  Grid3x3, 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Save,
  X,
  ChevronRight,
  FileText,
  Calendar,
  Plus,
  Search,
  Filter,
  User,
  Building2,
  ThumbsUp,
  Target,
  Lightbulb,
  History,
  Clock,
  Trash2,
  UserX
} from 'lucide-react'

const CLASSIFICATIONS = {
  star: { label: 'Estrela', color: '#10B981', description: 'Alto potencial + Alto desempenho' },
  promise: { label: 'Promessa', color: '#3B82F6', description: 'Alto potencial + Médio desempenho' },
  enigma: { label: 'Enigma', color: '#F59E0B', description: 'Alto potencial + Baixo desempenho' },
  pillar: { label: 'Pilar', color: '#059669', description: 'Médio potencial + Alto desempenho' },
  core: { label: 'Core Player', color: '#6366F1', description: 'Médio potencial + Médio desempenho' },
  risk: { label: 'Risco', color: '#EF4444', description: 'Médio potencial + Baixo desempenho' },
  specialist: { label: 'Especialista', color: '#8B5CF6', description: 'Baixo potencial + Alto desempenho' },
  maintainer: { label: 'Mantenedor', color: '#64748B', description: 'Baixo potencial + Médio desempenho' },
  low_performer: { label: 'Baixo Desempenho', color: '#DC2626', description: 'Baixo potencial + Baixo desempenho' }
}

export default function PerformanceEvaluationPage() {
  const { user, profile } = useAuth()
  const [users, setUsers] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')
  const [companies, setCompanies] = useState([])
  const [userRole, setUserRole] = useState(null)

  // Obter empresa do usuário atual se for company_admin
  const getCurrentUserCompany = () => {
    if (!profile?.user_companies) return null
    return profile.user_companies.find(uc => uc.is_active)?.companies
  }

  // Verificar se o usuário atual é super_admin
  const isSuperAdmin = () => {
    return profile?.role === 'super_admin'
  }

  // Verificar se o usuário atual é company_admin
  const isCompanyAdmin = () => {
    return profile?.role === 'company_admin' || 
           profile?.user_companies?.some(uc => uc.is_active && uc.role === 'company_admin')
  }

  useEffect(() => {
    if (profile) {
      loadData()
    }
  }, [profile])

  // Form state
  const [evaluationForm, setEvaluationForm] = useState({
    performance_level: 2,
    potential_level: 2,
    evaluation_date: new Date().toISOString().split('T')[0],
    notes: '',
    strengths: '',
    areas_for_improvement: '',
    development_plan: ''
  })

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('🔍 Nine Box - Carregando dados')
      console.log('👤 Perfil atual:', {
        id: profile?.id,
        email: profile?.email,
        role: profile?.role,
        isSuperAdmin: isSuperAdmin(),
        isCompanyAdmin: isCompanyAdmin()
      })

      // Armazenar role no state
      setUserRole(profile?.role)

      // Buscar usuários da tabela profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })

      if (profilesError) throw profilesError

      // Buscar vinculações de usuários com empresas
      const { data: userCompaniesData, error: userCompaniesError } = await supabase
        .from('user_companies')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('is_active', true)

      if (userCompaniesError) throw userCompaniesError

      // Combinar dados
      let combinedUsers = profiles.map(p => {
        const userCompany = userCompaniesData?.find(uc => uc.user_id === p.id)
        
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: p.role,
          phone: p.phone,
          avatar_url: p.avatar_url,
          is_active: p.is_active,
          company_id: userCompany?.companies?.id,
          company_name: userCompany?.companies?.name || 'N/A',
          company_role: userCompany?.role
        }
      })

      console.log('📊 Usuários antes de filtrar:', combinedUsers.length)

      // Filtrar usuários baseado no perfil do usuário atual
      if (isCompanyAdmin() && !isSuperAdmin()) {
        const currentUserCompany = getCurrentUserCompany()
        console.log('🏢 Company Admin - Filtrando por empresa:', currentUserCompany?.name)
        
        if (currentUserCompany) {
          combinedUsers = combinedUsers.filter(user => 
            user.company_id === currentUserCompany.id
          )
          console.log('✅ Usuários após filtro:', combinedUsers.length)
        }
      }

      // Carregar todas as avaliações
      const { data: evalData, error: evalError } = await supabase
        .from('performance_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false })

      if (evalError) throw evalError

      // Filtrar apenas a avaliação mais recente de cada usuário
      const latestEvaluations = {}
      evalData?.forEach(evaluation => {
        if (!latestEvaluations[evaluation.user_id]) {
          latestEvaluations[evaluation.user_id] = evaluation
        }
      })

      // Carregar empresas para filtro (apenas super_admin)
      let companiesData = []
      if (isSuperAdmin()) {
        const { data: companiesResult } = await supabase
          .from('companies')
          .select('id, name')
          .order('name')
        companiesData = companiesResult || []
      }

      setUsers(combinedUsers || [])
      setEvaluations(Object.values(latestEvaluations) || [])
      setCompanies(companiesData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUserEvaluation = (userId) => {
    return evaluations.find(e => e.user_id === userId)
  }

  const getClassification = (performance, potential) => {
    if (performance === 3 && potential === 3) return 'star'
    if (performance === 3 && potential === 2) return 'pillar'
    if (performance === 3 && potential === 1) return 'specialist'
    if (performance === 2 && potential === 3) return 'promise'
    if (performance === 2 && potential === 2) return 'core'
    if (performance === 2 && potential === 1) return 'maintainer'
    if (performance === 1 && potential === 3) return 'enigma'
    if (performance === 1 && potential === 2) return 'risk'
    if (performance === 1 && potential === 1) return 'low_performer'
    return 'core'
  }

  const openEvaluationModal = (selectedUser) => {
    setSelectedUser(selectedUser)
    // Sempre começar com uma nova avaliação (data de hoje)
    setEvaluationForm({
      performance_level: 2,
      potential_level: 2,
      evaluation_date: new Date().toISOString().split('T')[0],
      notes: '',
      strengths: '',
      areas_for_improvement: '',
      development_plan: ''
    })
    setShowEvaluationModal(true)
  }

  const openHistoryModal = async (selectedUser) => {
    setSelectedUser(selectedUser)
    try {
      const { data, error } = await supabase
        .from('performance_evaluations')
        .select('*')
        .eq('user_id', selectedUser.id)
        .order('evaluation_date', { ascending: false })

      if (error) throw error
      setUserHistory(data || [])
      setShowHistoryModal(true)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      alert('Erro ao carregar histórico de avaliações')
    }
  }

  const saveEvaluation = async () => {
    if (!selectedUser || saving) return

    setSaving(true)
    try {
      const classification = getClassification(
        evaluationForm.performance_level,
        evaluationForm.potential_level
      )

      const evaluationData = {
        user_id: selectedUser.id,
        evaluator_id: user.id,
        company_id: selectedUser.company_id,
        performance_level: evaluationForm.performance_level,
        potential_level: evaluationForm.potential_level,
        classification,
        evaluation_date: evaluationForm.evaluation_date,
        notes: evaluationForm.notes,
        strengths: evaluationForm.strengths,
        areas_for_improvement: evaluationForm.areas_for_improvement,
        development_plan: evaluationForm.development_plan
      }

      // Sempre inserir uma nova avaliação (não atualizar)
      const { data: newEval, error } = await supabase
        .from('performance_evaluations')
        .insert(evaluationData)
        .select()
        .single()

      if (error) throw error

      // Buscar avaliação anterior para criar histórico
      const { data: previousEval } = await supabase
        .from('performance_evaluations')
        .select('*')
        .eq('user_id', selectedUser.id)
        .eq('company_id', selectedUser.company_id)
        .lt('evaluation_date', evaluationForm.evaluation_date)
        .order('evaluation_date', { ascending: false })
        .limit(1)
        .single()

      // Se houver avaliação anterior, criar registro de histórico
      if (previousEval) {
        await supabase.from('performance_evaluation_history').insert({
          evaluation_id: newEval.id,
          user_id: selectedUser.id,
          company_id: selectedUser.company_id,
          previous_performance: previousEval.performance_level,
          previous_potential: previousEval.potential_level,
          new_performance: evaluationForm.performance_level,
          new_potential: evaluationForm.potential_level,
          previous_classification: previousEval.classification,
          new_classification: classification,
          evaluator_id: user.id,
          change_reason: 'Nova avaliação periódica'
        })
      }

      // Fechar modal e recarregar dados
      setShowEvaluationModal(false)
      await loadData()
      alert('✅ Avaliação salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      alert('❌ Erro ao salvar avaliação: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteEvaluation = async (evaluationId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação?')) return

    try {
      // Deletar histórico relacionado
      await supabase
        .from('performance_evaluation_history')
        .delete()
        .eq('evaluation_id', evaluationId)

      // Deletar a avaliação
      const { error } = await supabase
        .from('performance_evaluations')
        .delete()
        .eq('id', evaluationId)

      if (error) throw error

      // Atualizar histórico do usuário
      const updatedHistory = userHistory.filter(e => e.id !== evaluationId)
      setUserHistory(updatedHistory)

      // Se não houver mais avaliações, fechar o modal
      if (updatedHistory.length === 0) {
        setShowHistoryModal(false)
      }

      await loadData()
      alert('✅ Avaliação excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error)
      alert('❌ Erro ao excluir avaliação. Tente novamente.')
    }
  }

  const removeUserFromNineBox = async () => {
    if (!selectedUser) return

    const confirmMsg = `Tem certeza que deseja remover ${selectedUser.full_name} da Nine Box?\n\nIsso excluirá TODAS as ${userHistory.length} avaliação(ões) deste usuário.`
    if (!window.confirm(confirmMsg)) return

    try {
      // Deletar todos os históricos do usuário
      await supabase
        .from('performance_evaluation_history')
        .delete()
        .eq('user_id', selectedUser.id)

      // Deletar todas as avaliações do usuário
      const { error } = await supabase
        .from('performance_evaluations')
        .delete()
        .eq('user_id', selectedUser.id)

      if (error) throw error

      setShowHistoryModal(false)
      await loadData()
      alert('✅ Usuário removido da Nine Box com sucesso!')
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      alert('❌ Erro ao remover usuário. Tente novamente.')
    }
  }

  // Agrupar usuários por posição na matriz
  const getUsersByPosition = () => {
    const matrix = {}
    
    for (let pot = 3; pot >= 1; pot--) {
      for (let perf = 1; perf <= 3; perf++) {
        const key = `${perf}-${pot}`
        matrix[key] = []
      }
    }

    const filteredUsers = users.filter(u => {
      const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCompany = filterCompany === 'all' || u.company_id === filterCompany
      return matchesSearch && matchesCompany
    })

    filteredUsers.forEach(u => {
      const userEval = getUserEvaluation(u.id)
      if (userEval) {
        const key = `${userEval.performance_level}-${userEval.potential_level}`
        matrix[key].push({ ...u, evaluation: userEval })
      }
    })

    return matrix
  }

  const matrix = getUsersByPosition()

  // Estatísticas
  const stats = {
    total: users.length,
    evaluated: evaluations.length,
    stars: evaluations.filter(e => e.classification === 'star').length,
    risks: evaluations.filter(e => e.classification === 'risk' || e.classification === 'low_performer').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avaliações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Simplificado */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500 rounded-2xl">
              <Grid3x3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nine Box - Avaliação de Desempenho</h1>
              <p className="text-gray-600 mt-1">Gestão de talentos e potencial da equipe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nine Box Matrix - DESTAQUE */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="grid grid-cols-4 gap-0">
            {/* Label lateral esquerdo - Potencial */}
            <div className="col-span-1 flex flex-col justify-center items-center border-r border-gray-300 pr-4">
              <div className="transform -rotate-90 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-lg font-bold text-gray-700">POTENCIAL</span>
                </div>
              </div>
            </div>

            {/* Matriz 3x3 */}
            <div className="col-span-3 grid grid-cols-3 gap-4">
              {/* Linha superior - Alto Potencial */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-3`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 3)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="aspect-square rounded-2xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-2">
                        <h3 className="font-bold text-sm" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Alto Potencial</p>
                        <p className="text-xs text-gray-600">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desempenho
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{u.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-2 py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Linha média - Médio Potencial */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-2`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 2)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="aspect-square rounded-2xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-2">
                        <h3 className="font-bold text-sm" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Médio Potencial</p>
                        <p className="text-xs text-gray-600">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desempenho
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{u.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-2 py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Linha inferior - Baixo Potencial */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-1`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 1)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="aspect-square rounded-2xl border-2 p-4 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-2">
                        <h3 className="font-bold text-sm" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">Baixo Potencial</p>
                        <p className="text-xs text-gray-600">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desempenho
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{u.full_name}</p>
                                <p className="text-xs text-gray-500 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-2 py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-center">
                        <span className="text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Label inferior - Desempenho */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 rounded-xl border border-blue-200">
              <ChevronRight className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-bold text-gray-700">DESEMPENHO</span>
            </div>
          </div>
        </div>

        {/* Filtros e Estatísticas - Abaixo da Matriz */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Filtros e Estatísticas</h2>
          
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filtro de empresa - apenas para super_admin */}
            {userRole === 'super_admin' && (
              <select
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todas as empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total de Usuários</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Avaliados</p>
                  <p className="text-2xl font-bold text-green-900">{stats.evaluated}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Estrelas</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.stars}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-red-600 font-medium">Em Risco</p>
                  <p className="text-2xl font-bold text-red-900">{stats.risks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de usuários não avaliados */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            Usuários Não Avaliados ({users.length - stats.evaluated})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users
              .filter(u => !getUserEvaluation(u.id))
              .filter(u => {
                const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                const matchesCompany = filterCompany === 'all' || u.company_id === filterCompany
                return matchesSearch && matchesCompany
              })
              .map(u => (
                <div
                  key={u.id}
                  onClick={() => openEvaluationModal(u)}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                >
                  <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                  <p className="text-sm text-gray-600 truncate">{u.email}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{u.companies?.name}</p>
                  <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Avaliar →
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal de Avaliação */}
      {showEvaluationModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative bg-primary-500 text-white px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{selectedUser.full_name}</h2>
                    <div className="flex items-center gap-2 text-primary-100">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm">{selectedUser.company_name}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form com Scroll */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Data de Avaliação em Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                  <Calendar className="h-5 w-5 text-primary-600" />
                  Data da Avaliação
                </label>
                <input
                  type="date"
                  value={evaluationForm.evaluation_date}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluation_date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Matriz de Avaliação */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <Grid3x3 className="h-5 w-5 text-primary-600" />
                  Avaliação Nine Box
                </h3>

                {/* Desempenho */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    Nível de Desempenho
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 1, label: 'Baixo', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-300', textColor: 'text-red-700', activeColor: 'from-red-500 to-red-600' },
                      { value: 2, label: 'Médio', bgColor: 'from-amber-50 to-amber-100', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeColor: 'from-amber-500 to-amber-600' },
                      { value: 3, label: 'Alto', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-300', textColor: 'text-green-700', activeColor: 'from-green-500 to-green-600' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setEvaluationForm({ ...evaluationForm, performance_level: option.value })}
                        className={`relative p-4 rounded-xl font-bold transition-all duration-200 ${
                          evaluationForm.performance_level === option.value
                            ? `bg-gradient-to-br ${option.activeColor} text-white shadow-lg scale-105 border-2 border-white ring-2 ${option.borderColor}`
                            : `bg-gradient-to-br ${option.bgColor} ${option.textColor} border-2 ${option.borderColor} hover:scale-102 hover:shadow-md`
                        }`}
                      >
                        {evaluationForm.performance_level === option.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                          </div>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Potencial */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    Nível de Potencial
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 1, label: 'Baixo', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-300', textColor: 'text-red-700', activeColor: 'from-red-500 to-red-600' },
                      { value: 2, label: 'Médio', bgColor: 'from-amber-50 to-amber-100', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeColor: 'from-amber-500 to-amber-600' },
                      { value: 3, label: 'Alto', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-300', textColor: 'text-green-700', activeColor: 'from-green-500 to-green-600' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setEvaluationForm({ ...evaluationForm, potential_level: option.value })}
                        className={`relative p-4 rounded-xl font-bold transition-all duration-200 ${
                          evaluationForm.potential_level === option.value
                            ? `bg-gradient-to-br ${option.activeColor} text-white shadow-lg scale-105 border-2 border-white ring-2 ${option.borderColor}`
                            : `bg-gradient-to-br ${option.bgColor} ${option.textColor} border-2 ${option.borderColor} hover:scale-102 hover:shadow-md`
                        }`}
                      >
                        {evaluationForm.potential_level === option.value && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                            <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                          </div>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Classificação resultante */}
                <div className="mt-6 p-5 bg-primary-50 rounded-2xl border-2 border-primary-200 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Classificação Nine Box</p>
                      <p 
                        className="text-2xl font-bold"
                        style={{ color: CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].color }}
                      >
                        {CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].label}
                      </p>
                    </div>
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ 
                        backgroundColor: `${CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].color}20`,
                        border: `3px solid ${CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].color}`
                      }}
                    >
                      <Award className="h-7 w-7" style={{ color: CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].color }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos de Texto */}
              <div className="space-y-4">
                {/* Pontos Fortes */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <ThumbsUp className="h-4 w-4 text-primary-600" />
                    Pontos Fortes
                  </label>
                  <textarea
                    value={evaluationForm.strengths}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Ex: Excelente comunicação, proatividade, capacidade analítica..."
                  />
                </div>

                {/* Áreas de Melhoria */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Target className="h-4 w-4 text-orange-600" />
                    Áreas para Desenvolvimento
                  </label>
                  <textarea
                    value={evaluationForm.areas_for_improvement}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, areas_for_improvement: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Ex: Gestão de tempo, delegação de tarefas, trabalho em equipe..."
                  />
                </div>

                {/* Plano de Desenvolvimento */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Lightbulb className="h-4 w-4 text-primary-600" />
                    Plano de Desenvolvimento
                  </label>
                  <textarea
                    value={evaluationForm.development_plan}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, development_plan: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={4}
                    placeholder="Ex: Treinamento em liderança até Q2, mentorias semanais, curso de Excel avançado..."
                  />
                </div>

                {/* Observações */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <FileText className="h-4 w-4 text-primary-600" />
                    Observações Gerais
                  </label>
                  <textarea
                    value={evaluationForm.notes}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Contexto adicional, situações específicas, feedback qualitativo..."
                  />
                </div>
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="px-8 py-5 bg-white border-t border-gray-200 rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={saveEvaluation}
                  disabled={saving}
                  className={`flex-1 px-6 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      Salvar Avaliação
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEvaluationModal(false)}
                  disabled={saving}
                  className={`px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all duration-200 border-2 border-gray-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative bg-primary-500 text-white px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <History className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Histórico de Avaliações</h2>
                    <p className="text-primary-100">{selectedUser.full_name} - {selectedUser.company_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Timeline de Avaliações */}
            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100">
              {userHistory.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Nenhuma avaliação encontrada</p>
                  <p className="text-gray-500 mt-2">Este usuário ainda não foi avaliado</p>
                </div>
              ) : (
                <>
                  {/* Gráfico de Evolução */}
                  {userHistory.length > 1 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-primary-100">
                          <TrendingUp className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Evolução ao Longo do Tempo</h3>
                          <p className="text-sm text-gray-600">Progressão de desempenho e potencial</p>
                        </div>
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={[...userHistory].reverse().map(ev => {
                              const [year, month, day] = ev.evaluation_date.split('-')
                              const date = new Date(year, month - 1, day)
                              return {
                                data: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                                Desempenho: ev.performance_level,
                                Potencial: ev.potential_level
                              }
                            })}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="data" 
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                            />
                            <YAxis 
                              domain={[0, 3]} 
                              ticks={[0, 1, 2, 3]}
                              stroke="#6b7280"
                              style={{ fontSize: '12px' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '2px solid #e5e7eb',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                              }}
                              labelStyle={{ fontWeight: 'bold', color: '#111827' }}
                            />
                            <Legend 
                              wrapperStyle={{ paddingTop: '20px' }}
                              iconType="line"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Desempenho" 
                              stroke="#EBA500" 
                              strokeWidth={3}
                              dot={{ fill: '#EBA500', strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Potencial" 
                              stroke="#3b82f6" 
                              strokeWidth={3}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legendas personalizadas */}
                      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                          <span className="text-gray-700">Desempenho</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-gray-700">Potencial</span>
                        </div>
                        <div className="flex items-center gap-4 ml-6 text-xs text-gray-500">
                          <span>1 = Baixo</span>
                          <span>2 = Médio</span>
                          <span>3 = Alto</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lista de Avaliações */}
                <div className="space-y-4">
                  {userHistory.map((evaluation, index) => {
                    const classInfo = CLASSIFICATIONS[evaluation.classification]
                    const isLatest = index === 0
                    
                    // Parse da data corretamente para evitar problema de timezone
                    const [year, month, day] = evaluation.evaluation_date.split('-')
                    const evaluationDate = new Date(year, month - 1, day)
                    
                    return (
                      <div
                        key={evaluation.id}
                        className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
                          isLatest ? 'border-primary-300 ring-2 ring-primary-200' : 'border-gray-200'
                        } transition-all`}
                      >
                        {/* Cabeçalho da Avaliação */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${classInfo.color}20` }}>
                              <Calendar className="h-5 w-5" style={{ color: classInfo.color }} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">
                                {evaluationDate.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                              {isLatest && (
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-semibold">
                                  Avaliação Atual
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-white shadow-md"
                              style={{ backgroundColor: classInfo.color }}
                            >
                              <Award className="h-5 w-5" />
                              {classInfo.label}
                            </div>
                            <button
                              onClick={() => deleteEvaluation(evaluation.id)}
                              className="p-2 hover:bg-red-100 rounded-xl transition-all duration-200 group"
                              title="Excluir esta avaliação"
                            >
                              <Trash2 className="h-5 w-5 text-gray-400 group-hover:text-red-600" />
                            </button>
                          </div>
                        </div>

                        {/* Níveis de Desempenho e Potencial */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary-600" />
                              <span className="text-sm font-bold text-gray-700">Desempenho</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {evaluation.performance_level === 1 ? 'Baixo' : evaluation.performance_level === 2 ? 'Médio' : 'Alto'}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary-600" />
                              <span className="text-sm font-bold text-gray-700">Potencial</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                              {evaluation.potential_level === 1 ? 'Baixo' : evaluation.potential_level === 2 ? 'Médio' : 'Alto'}
                            </p>
                          </div>
                        </div>

                        {/* Detalhes */}
                        {(evaluation.strengths || evaluation.areas_for_improvement || evaluation.notes) && (
                          <div className="space-y-3 pt-4 border-t border-gray-200">
                            {evaluation.strengths && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                  <ThumbsUp className="h-4 w-4 text-green-600" />
                                  Pontos Fortes
                                </p>
                                <p className="text-sm text-gray-600">{evaluation.strengths}</p>
                              </div>
                            )}
                            
                            {evaluation.areas_for_improvement && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-orange-600" />
                                  Áreas de Melhoria
                                </p>
                                <p className="text-sm text-gray-600">{evaluation.areas_for_improvement}</p>
                              </div>
                            )}
                            
                            {evaluation.notes && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  Observações
                                </p>
                                <p className="text-sm text-gray-600">{evaluation.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-white border-t border-gray-200 rounded-b-3xl flex justify-between items-center">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  <strong>{userHistory.length}</strong> avaliação(ões) registrada(s)
                </p>
                <button
                  onClick={removeUserFromNineBox}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 border-2 border-red-200 hover:border-red-300"
                  title="Remover usuário da Nine Box"
                >
                  <UserX className="h-4 w-4" />
                  Remover da Nine Box
                </button>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all duration-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
