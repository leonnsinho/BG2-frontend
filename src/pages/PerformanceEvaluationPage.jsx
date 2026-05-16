import React, { useState, useEffect } from 'react'
import toast from '@/lib/toast'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import SuperAdminBanner from '../components/SuperAdminBanner'
import ConfirmModal from '../components/ui/ConfirmModal'
import { 
  Grid3x3, 
  Users, 
  TrendingUp, 
  Award, 
  AlertCircle,
  Save,
  X,
  ChevronRight,
  ChevronDown,
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
  UserX,
  Download,
  UserPlus
} from 'lucide-react'

const CLASSIFICATIONS = {
  star: { label: 'Alto Potencial', color: '#10B981', description: 'Alto alinhamento cultural + Alto desempenho técnico' },
  promise: { label: 'Forte Desempenho', color: '#3B82F6', description: 'Alto alinhamento cultural + Médio desempenho técnico' },
  enigma: { label: 'Enigma', color: '#F59E0B', description: 'Alto alinhamento cultural + Baixo desempenho técnico' },
  pillar: { label: 'Forte Desempenho', color: '#059669', description: 'Médio alinhamento cultural + Alto desempenho técnico' },
  core: { label: 'Mantenedor', color: '#6366F1', description: 'Médio alinhamento cultural + Médio desempenho técnico' },
  risk: { label: 'Questionável', color: '#EF4444', description: 'Médio alinhamento cultural + Baixo desempenho técnico' },
  specialist: { label: 'Comprometido', color: '#8B5CF6', description: 'Baixo alinhamento cultural + Alto desempenho técnico' },
  maintainer: { label: 'Eficaz', color: '#64748B', description: 'Baixo alinhamento cultural + Médio desempenho técnico' },
  low_performer: { label: 'Insuficiente', color: '#DC2626', description: 'Baixo alinhamento cultural + Baixo desempenho técnico' }
}

export default function PerformanceEvaluationPage() {
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEvaluationModal, setShowEvaluationModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [userHistory, setUserHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterTag, setFilterTag] = useState([])
  const [companies, setCompanies] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [availableTags, setAvailableTags] = useState([])
  const [userTagsMap, setUserTagsMap] = useState({})
  const [externalEvaluations, setExternalEvaluations] = useState([])
  const [showExternalNameModal, setShowExternalNameModal] = useState(false)
  const [externalNameInput, setExternalNameInput] = useState('')
  const [listSearch, setListSearch] = useState('')
  const [listFilterTags, setListFilterTags] = useState([])
  const [showOnlyUnevaluated, setShowOnlyUnevaluated] = useState(false)
  const [showListTagDropdown, setShowListTagDropdown] = useState(false)

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
  }, [profile, searchParams])

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
      if (!isSuperAdmin()) {
        const currentUserCompany = getCurrentUserCompany()
        console.log('🏢 Usuário - Filtrando por empresa:', currentUserCompany?.name)
        
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

      // Carregar avaliações de pessoas externas (não cadastradas)
      let extQuery = supabase
        .from('external_performance_evaluations')
        .select('*')
        .order('evaluation_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (!isSuperAdmin()) {
        const cuc = getCurrentUserCompany()
        if (cuc) extQuery = extQuery.eq('company_id', cuc.id)
      }
      const { data: extEvalData } = await extQuery
      const latestExtEvals = {}
      ;(extEvalData || []).forEach(ev => {
        const key = `${ev.company_id}::${ev.external_name}`
        if (!latestExtEvals[key]) latestExtEvals[key] = ev
      })
      setExternalEvaluations(Object.values(latestExtEvals))

      // Carregar tags da empresa atual
      const tagCompanyId = isSuperAdmin()
        ? (searchParams.get('company') || searchParams.get('companyId') || null)
        : getCurrentUserCompany()?.id
      if (tagCompanyId) {
        const { data: tagsData } = await supabase
          .rpc('get_company_tags', { p_company_id: tagCompanyId })
        setAvailableTags(tagsData || [])

        const { data: assignments } = await supabase
          .rpc('get_company_tag_assignments', { p_company_id: tagCompanyId })
        const map = {}
        ;(assignments || []).forEach(a => {
          if (!map[a.user_id]) map[a.user_id] = []
          const tag = (tagsData || []).find(t => t.id === a.tag_id)
          if (tag && !map[a.user_id].some(t => t.id === tag.id)) map[a.user_id].push(tag)
        })
        setUserTagsMap(map)
      }

      // Verificar se há um parâmetro company ou companyId na URL
      const companyFromUrl = searchParams.get('company') || searchParams.get('companyId')
      if (companyFromUrl) {
        setFilterCompany(companyFromUrl)
      }
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
      let result
      if (selectedUser.isExternal) {
        result = await supabase
          .from('external_performance_evaluations')
          .select('*')
          .eq('external_name', selectedUser.full_name)
          .eq('company_id', selectedUser.company_id)
          .order('evaluation_date', { ascending: false })
      } else {
        result = await supabase
          .from('performance_evaluations')
          .select('*')
          .eq('user_id', selectedUser.id)
          .order('evaluation_date', { ascending: false })
      }
      if (result.error) throw result.error
      setUserHistory(result.data || [])
      setShowHistoryModal(true)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
      toast.alert('Erro ao carregar histórico de avaliações')
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

      // Avaliação de pessoa externa (não cadastrada)
      if (selectedUser.isExternal) {
        const { error } = await supabase
          .from('external_performance_evaluations')
          .insert({
            external_name: selectedUser.full_name,
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
          })
        if (error) throw error
        setShowEvaluationModal(false)
        await loadData()
        toast.alert('✅ Avaliação salva com sucesso!')
        return
      }

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
      toast.alert('✅ Avaliação salva com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      toast.alert('❌ Erro ao salvar avaliação: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteEvaluation = (evaluationId) => {
    setConfirmDialog({
      title: 'Excluir esta avaliação?',
      message: 'Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          if (selectedUser?.isExternal) {
            const { error } = await supabase
              .from('external_performance_evaluations')
              .delete()
              .eq('id', evaluationId)
            if (error) throw error
          } else {
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
          }

          // Atualizar histórico do usuário
          const updatedHistory = userHistory.filter(e => e.id !== evaluationId)
          setUserHistory(updatedHistory)

          // Se não houver mais avaliações, fechar o modal
          if (updatedHistory.length === 0) {
            setShowHistoryModal(false)
          }

          await loadData()
          toast.alert('✅ Avaliação excluída com sucesso!')
        } catch (error) {
          console.error('Erro ao excluir avaliação:', error)
          toast.alert('❌ Erro ao excluir avaliação. Tente novamente.')
        }
      }
    })
  }

  const removeUserFromNineBox = () => {
    if (!selectedUser) return
    setConfirmDialog({
      title: `Remover ${selectedUser.full_name} da Nine Box?`,
      message: `Isso excluirá TODAS as ${userHistory.length} avaliação(ões) deste usuário. Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          if (selectedUser.isExternal) {
            const { error } = await supabase
              .from('external_performance_evaluations')
              .delete()
              .eq('external_name', selectedUser.full_name)
              .eq('company_id', selectedUser.company_id)
            if (error) throw error
          } else {
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
          }

          setShowHistoryModal(false)
          await loadData()
          toast.alert('✅ Usuário removido da Nine Box com sucesso!')
        } catch (error) {
          console.error('Erro ao remover usuário:', error)
          toast.alert('❌ Erro ao remover usuário. Tente novamente.')
        }
      }
    })
  }

  const openExternalEvalModal = () => {
    setExternalNameInput('')
    setShowExternalNameModal(true)
  }

  const confirmExternalName = () => {
    const name = externalNameInput.trim()
    if (!name) return
    const companyId = !isSuperAdmin()
      ? getCurrentUserCompany()?.id
      : (filterCompany !== 'all' ? filterCompany : null)
    const companyName = companies.find(c => c.id === companyId)?.name || getCurrentUserCompany()?.name || ''
    setSelectedUser({
      id: `ext::${companyId}::${name}`,
      full_name: name,
      company_name: companyName,
      company_id: companyId,
      isExternal: true
    })
    setEvaluationForm({
      performance_level: 2,
      potential_level: 2,
      evaluation_date: new Date().toISOString().split('T')[0],
      notes: '',
      strengths: '',
      areas_for_improvement: '',
      development_plan: ''
    })
    setShowExternalNameModal(false)
    setShowEvaluationModal(true)
  }

  const exportarPDF = async () => {
    if (!selectedUser || !userHistory.length) return
    setExporting(true)
    try {
      let companyName = selectedUser.company_name || ''
      let logoHtml = ''

      if (selectedUser.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', selectedUser.company_id)
          .single()

        if (companyData) {
          companyName = companyData.name || companyName
          if (companyData.logo_url) {
            try {
              const res = await fetch(companyData.logo_url)
              const blob = await res.blob()
              if (!blob.type.startsWith('image/')) throw new Error('not an image')
              const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
              if (base64 && base64.startsWith('data:image/')) {
                logoHtml = `<img src="${base64}" style="height:40px;object-fit:contain;" />`
              }
            } catch (e) { /* skip logo on error */ }
          }
        }
      }

      const chartData = [...userHistory].reverse()

      const buildSvgChart = (data) => {
        if (data.length < 2) return ''
        const W = 560, H = 160
        const pL = 45, pR = 20, pT = 15, pB = 30
        const cW = W - pL - pR
        const cH = H - pT - pB
        const n = data.length
        const xPos = (i) => pL + (i / (n - 1)) * cW
        const yPos = (v) => pT + cH - (v / 3) * cH

        let gridLines = ''
        for (let v = 0; v <= 3; v++) {
          const y = yPos(v)
          gridLines += `<line x1="${pL}" y1="${y}" x2="${pL + cW}" y2="${y}" stroke="#555" stroke-width="1" stroke-dasharray="4,4"/>`
          gridLines += `<text x="${pL - 8}" y="${y + 4}" fill="#aaa" font-size="10" text-anchor="end">${v}</text>`
        }

        let xLabels = ''
        data.forEach((ev, i) => {
          const [yr, mo, dy] = ev.evaluation_date.split('-')
          const d = new Date(+yr, +mo - 1, +dy)
          const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          xLabels += `<text x="${xPos(i)}" y="${H - 5}" fill="#aaa" font-size="9" text-anchor="middle">${label}</text>`
        })

        const perfPoints = data.map((ev, i) => `${xPos(i)},${yPos(ev.performance_level)}`).join(' ')
        const perfDots = data.map((ev, i) => `<circle cx="${xPos(i)}" cy="${yPos(ev.performance_level)}" r="5" fill="#EBA500"/>`).join('')
        const potPoints = data.map((ev, i) => `${xPos(i)},${yPos(ev.potential_level)}`).join(' ')
        const potDots = data.map((ev, i) => `<circle cx="${xPos(i)}" cy="${yPos(ev.potential_level)}" r="5" fill="#3b82f6"/>`).join('')

        return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${W}" height="${H}" fill="#2a2828"/>
          ${gridLines}
          <polyline points="${perfPoints}" fill="none" stroke="#EBA500" stroke-width="2.5"/>
          ${perfDots}
          <polyline points="${potPoints}" fill="none" stroke="#3b82f6" stroke-width="2.5"/>
          ${potDots}
          ${xLabels}
        </svg>`
      }

      const svgChart = buildSvgChart(chartData)
      const latestEval = userHistory[0]
      const latestClass = latestEval ? CLASSIFICATIONS[latestEval.classification] : null
      const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      const lvl = (v) => v === 1 ? 'Baixo' : v === 2 ? 'Médio' : 'Alto'

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Histórico de Avaliações - ${selectedUser.full_name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 0; }
    body { font-family: 'Inter', sans-serif; background: #373535; color: #e8e8e8; padding: 24px; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1.5px solid #EBA500; }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .brand { font-size: 22px; font-weight: 800; color: #EBA500; }
    .sub { font-size: 11px; color: #aaa; }
    .title-area { text-align: right; }
    .title-area h1 { font-size: 16px; font-weight: 700; color: #e8e8e8; }
    .title-area p { font-size: 11px; color: #aaa; }
    .user-card { background: #2a2828; border: 1.5px solid #EBA500; border-radius: 8px; padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    .user-name { font-size: 18px; font-weight: 700; color: #EBA500; }
    .user-meta { font-size: 12px; color: #aaa; margin-top: 4px; }
    .class-badge { padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 13px; color: #fff; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
    .stat-card { background: #2a2828; border: 1px solid #555; border-radius: 6px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 800; color: #EBA500; }
    .stat-label { font-size: 10px; color: #aaa; margin-top: 2px; }
    .section-title { font-size: 13px; font-weight: 700; color: #EBA500; margin-bottom: 8px; }
    .chart-box { background: #2a2828; border: 1px solid #555; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
    .chart-legend { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #aaa; }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #EBA500; color: #1a1a1a; font-weight: 700; padding: 8px 6px; text-align: left; }
    td { padding: 7px 6px; border-bottom: 1px solid #444; vertical-align: top; }
    tr:nth-child(even) td { background: #2a2828; }
    .level-badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .level-1 { background: #7f1d1d; color: #fca5a5; }
    .level-2 { background: #78350f; color: #fcd34d; }
    .level-3 { background: #14532d; color: #86efac; }
    .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #555; display: flex; justify-content: space-between; font-size: 10px; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      ${logoHtml}
      <div>
        <div class="brand">BG2</div>
        <div class="sub">Sistema de Gestão Estratégica</div>
      </div>
    </div>
    <div class="title-area">
      <h1>Histórico de Avaliações Nine Box</h1>
      <p>Emitido em ${now}</p>
    </div>
  </div>

  <div class="user-card">
    <div>
      <div class="user-name">${selectedUser.full_name}</div>
      <div class="user-meta">${companyName}${selectedUser.email ? ' • ' + selectedUser.email : ''}</div>
    </div>
    ${latestClass ? `<div class="class-badge" style="background:${latestClass.color}">${latestClass.label}</div>` : ''}
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">${userHistory.length}</div>
      <div class="stat-label">Avaliações Registradas</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${latestEval ? lvl(latestEval.performance_level) : '—'}</div>
      <div class="stat-label">Desempenho Atual</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${latestEval ? lvl(latestEval.potential_level) : '—'}</div>
      <div class="stat-label">Alinhamento Cultural Atual</div>
    </div>
  </div>

  ${chartData.length > 1 ? `
  <div class="chart-box">
    <div class="section-title">Evolução ao Longo do Tempo</div>
    ${svgChart}
    <div class="chart-legend">
      <span><span class="dot" style="background:#EBA500"></span>Desempenho Técnico</span>
      <span><span class="dot" style="background:#3b82f6"></span>Alinhamento Cultural</span>
      <span style="margin-left:10px">1 = Baixo &nbsp;&nbsp; 2 = Médio &nbsp;&nbsp; 3 = Alto</span>
    </div>
  </div>` : ''}

  <div class="section-title">Registro Completo de Avaliações</div>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Classificação</th>
        <th>Desempenho</th>
        <th>Alinhamento</th>
        <th>Pontos Fortes</th>
        <th>Áreas de Melhoria</th>
        <th>Observações</th>
      </tr>
    </thead>
    <tbody>
      ${userHistory.map(ev => {
        const [y, m, d] = ev.evaluation_date.split('-')
        const dt = new Date(+y, +m - 1, +d).toLocaleDateString('pt-BR')
        const cl = CLASSIFICATIONS[ev.classification]
        return `<tr>
          <td>${dt}</td>
          <td><span class="level-badge" style="background:${cl?.color}33;color:${cl?.color};border:1px solid ${cl?.color}66">${cl?.label || ev.classification}</span></td>
          <td><span class="level-badge level-${ev.performance_level}">${lvl(ev.performance_level)}</span></td>
          <td><span class="level-badge level-${ev.potential_level}">${lvl(ev.potential_level)}</span></td>
          <td>${ev.strengths || '—'}</td>
          <td>${ev.areas_for_improvement || '—'}</td>
          <td>${ev.notes || '—'}</td>
        </tr>`
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <span>BG2 — Sistema de Avaliação Nine Box</span>
    <span>${now}</span>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 500)</script>
</body>
</html>`

      const win = window.open('', '_blank')
      win.document.write(html)
      win.document.close()
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast.alert('Erro ao exportar PDF. Tente novamente.')
    } finally {
      setExporting(false)
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
      const matchesTag = filterTag.length === 0 || filterTag.every(tid => (userTagsMap[u.id] || []).some(t => t.id === tid))
      return matchesSearch && matchesCompany && matchesTag
    })

    filteredUsers.forEach(u => {
      const userEval = getUserEvaluation(u.id)
      if (userEval) {
        const key = `${userEval.performance_level}-${userEval.potential_level}`
        matrix[key].push({ ...u, evaluation: userEval })
      }
    })

    // Incluir pessoas externas avaliadas na matriz
    externalEvaluations.forEach(ev => {
      const matchesSearch = !searchTerm || ev.external_name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCompany = filterCompany === 'all' || ev.company_id === filterCompany
      if (!matchesSearch || !matchesCompany) return
      const key = `${ev.performance_level}-${ev.potential_level}`
      if (matrix[key]) {
        const companyName = companies.find(c => c.id === ev.company_id)?.name || ''
        matrix[key].push({
          id: `ext::${ev.company_id}::${ev.external_name}`,
          full_name: ev.external_name,
          company_name: companyName ? `${companyName} · Externo` : 'Externo',
          company_id: ev.company_id,
          isExternal: true,
          evaluation: ev
        })
      }
    })

    return matrix
  }

  const matrix = getUsersByPosition()

  // Usuários filtrados pela empresa ativa (para stats corretos quando super admin entra numa empresa)
  const filteredUsersForStats = filterCompany === 'all'
    ? users
    : users.filter(u => u.company_id === filterCompany)

  const filteredUserIds = new Set(filteredUsersForStats.map(u => u.id))

  const filteredEvaluations = evaluations.filter(e => filteredUserIds.has(e.user_id))

  const filteredExternalEvals = externalEvaluations.filter(ev =>
    filterCompany === 'all' || ev.company_id === filterCompany
  )

  // Lista geral de usuários (seção inferior)
  const filteredListUsers = [
    ...filteredUsersForStats
      .filter(u => {
        const matchesSearch = !listSearch ||
          u.full_name?.toLowerCase().includes(listSearch.toLowerCase()) ||
          u.email?.toLowerCase().includes(listSearch.toLowerCase())
        const matchesTag = listFilterTags.length === 0 ||
          listFilterTags.every(tid => (userTagsMap[u.id] || []).some(t => t.id === tid))
        const isEvaluated = !!getUserEvaluation(u.id)
        return matchesSearch && matchesTag && (!showOnlyUnevaluated || !isEvaluated)
      })
      .map(u => ({
        ...u,
        evaluation: getUserEvaluation(u.id) || null,
        isExternal: false,
      })),
    ...(!showOnlyUnevaluated && listFilterTags.length === 0
      ? filteredExternalEvals
          .filter(ev => !listSearch || ev.external_name.toLowerCase().includes(listSearch.toLowerCase()))
          .map(ev => ({
            id: `ext::${ev.company_id}::${ev.external_name}`,
            full_name: ev.external_name,
            email: null,
            company_id: ev.company_id,
            companies: { name: companies.find(c => c.id === ev.company_id)?.name || '' },
            evaluation: ev,
            isExternal: true,
          }))
      : []),
  ].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))

  // Estatísticas (inclui pessoas externas avaliadas)
  const stats = {
    total: filteredUsersForStats.length + filteredExternalEvals.length,
    evaluated: filteredEvaluations.length + filteredExternalEvals.length,
    stars: filteredEvaluations.filter(e => e.classification === 'star').length + filteredExternalEvals.filter(e => e.classification === 'star').length,
    risks: filteredEvaluations.filter(e => e.classification === 'risk' || e.classification === 'low_performer').length + filteredExternalEvals.filter(e => e.classification === 'risk' || e.classification === 'low_performer').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando avaliações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <SuperAdminBanner />
      {/* Header Simplificado */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-primary-500 rounded-xl sm:rounded-2xl">
                <Grid3x3 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Nine Box - Avaliação de Desempenho</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">Gestão de talentos e alinhamento cultural da equipe</p>
              </div>
            </div>
            <button
              onClick={openExternalEvalModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Avaliar Externo</span>
              <span className="sm:hidden">Externo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nine Box Matrix + Stats Side Panel */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 items-start">

          {/* ── Left: Stats Column ── */}
          <div className="hidden lg:flex flex-col gap-3 w-52 shrink-0">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">Visão Geral</h3>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-blue-600 font-medium leading-tight">Total de Usuários</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-green-600 font-medium leading-tight">Avaliados</p>
                  <p className="text-xl font-bold text-green-900">{stats.evaluated}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-yellow-600 font-medium leading-tight">Estrelas</p>
                  <p className="text-xl font-bold text-yellow-900">{stats.stars}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-red-600 font-medium leading-tight">Em Risco</p>
                  <p className="text-xl font-bold text-red-900">{stats.risks}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[11px] text-orange-600 font-medium leading-tight">Não Avaliados</p>
                  <p className="text-xl font-bold text-orange-900">{stats.total - stats.evaluated}</p>
                </div>
              </div>
            </div>

            <div className="mt-2 p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Cobertura</p>
              <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2 mb-1">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                  style={{ width: stats.total > 0 ? `${Math.round(stats.evaluated / stats.total * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200 text-right">
                {stats.total > 0 ? Math.round(stats.evaluated / stats.total * 100) : 0}%
              </p>
            </div>
          </div>

          {/* ── Right: Nine Box Matrix ── */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          {/* Container com scroll horizontal no mobile */}
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[520px] px-3 sm:px-0">
              <div className="grid grid-cols-4 gap-0">
                {/* Label lateral esquerdo - Alinhamento Cultural */}
                <div className="col-span-1 flex flex-col justify-center items-center pr-2">
                  <div className="transform -rotate-90 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <TrendingUp className="h-3 w-3 text-purple-600" />
                      <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-200">ALINHAMENTO CULTURAL</span>
                    </div>
                  </div>
                </div>

                {/* Matriz 3x3 */}
                <div className="col-span-3">
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
              {/* Linha superior - Alto Alinhamento Cultural */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-3`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 3)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="h-[160px] sm:h-[185px] rounded-xl border-2 p-2 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-1 shrink-0">
                        <h3 className="font-bold text-[10px] sm:text-xs leading-tight" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Alto Alinhamento</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desemp.
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-2 nine-box-scroll pr-0.5">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white truncate">{u.full_name}</p>
                                <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-[9px] sm:text-xs bg-primary-500 hover:bg-primary-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-1 sm:mt-2 text-center">
                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Linha média - Médio Alinhamento Cultural */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-2`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 2)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="h-[160px] sm:h-[185px] rounded-xl border-2 p-2 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-1 shrink-0">
                        <h3 className="font-bold text-[10px] sm:text-xs leading-tight" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Médio Alinhamento</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desemp.
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-2 nine-box-scroll pr-0.5">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white truncate">{u.full_name}</p>
                                <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-[9px] sm:text-xs bg-primary-500 hover:bg-primary-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-1 sm:mt-2 text-center">
                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Linha inferior - Baixo Alinhamento Cultural */}
              {[1, 2, 3].map(perf => {
                const key = `${perf}-1`
                const usersInBox = matrix[key] || []
                const classification = getClassification(perf, 1)
                const classInfo = CLASSIFICATIONS[classification]

                return (
                  <div
                    key={key}
                    className="h-[160px] sm:h-[185px] rounded-xl border-2 p-2 transition-all hover:shadow-lg cursor-pointer"
                    style={{
                      borderColor: classInfo.color,
                      backgroundColor: `${classInfo.color}10`
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-1 shrink-0">
                        <h3 className="font-bold text-[10px] sm:text-xs leading-tight" style={{ color: classInfo.color }}>
                          {classInfo.label}
                        </h3>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">Baixo Alinhamento</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400">
                          {perf === 1 ? 'Baixo' : perf === 2 ? 'Médio' : 'Alto'} Desemp.
                        </p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-2 nine-box-scroll pr-0.5">
                        {usersInBox.map(u => (
                          <div
                            key={u.id}
                            onClick={() => openHistoryModal(u)}
                            className="bg-white dark:bg-gray-700 rounded-lg p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-600 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white truncate">{u.full_name}</p>
                                <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{u.company_name}</p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEvaluationModal(u); }}
                                className="text-[9px] sm:text-xs bg-primary-500 hover:bg-primary-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors whitespace-nowrap"
                                title="Nova avaliação"
                              >
                                Reavaliar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-1 sm:mt-2 text-center">
                        <span className="text-[10px] sm:text-xs font-bold" style={{ color: classInfo.color }}>
                          {usersInBox.length} pessoa{usersInBox.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
                {/* Label inferior - Desempenho Técnico */}
                <div className="mt-2 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <ChevronRight className="h-3 w-3 text-blue-600" />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-200">DESEMPENHO TÉCNICO</span>
                  </div>
                </div>
                </div>
          </div>
          </div>
        </div>
          </div>
        </div>
      </div>

        {/* Filtros e Estatísticas - Abaixo da Matriz */}
<div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Filtros e Estatísticas</h2>
          
          {/* Filtros */}
          <div className="flex flex-col gap-3 mb-6">
            {/* Linha 1: busca + empresa */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>

              {/* Filtro de empresa - apenas para super_admin */}
              {userRole === 'super_admin' && (
                <select
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base bg-white dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="all">Todas as empresas</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Linha 2: filtro de tags */}
            {availableTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterTag([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    filterTag.length === 0
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Todas as tags
                </button>
                {availableTags.map(tag => {
                  const selected = filterTag.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setFilterTag(prev =>
                        prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                      )}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selected ? 'text-white border-transparent shadow-md' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={selected ? { backgroundColor: tag.color, borderColor: tag.color } : { color: tag.color }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  )
                })}
                {filterTag.length > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    {filterTag.length} tag{filterTag.length > 1 ? 's' : ''} selecionada{filterTag.length > 1 ? 's' : ''} (AND)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Estatísticas - apenas mobile (no desktop ficam na coluna esquerda) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:hidden gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-blue-600 font-medium">Total</p>
                  <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-green-600 font-medium">Avaliados</p>
                  <p className="text-xl font-bold text-green-900">{stats.evaluated}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-yellow-600 font-medium">Estrelas</p>
                  <p className="text-xl font-bold text-yellow-900">{stats.stars}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3 border border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-red-600 font-medium">Em Risco</p>
                  <p className="text-xl font-bold text-red-900">{stats.risks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista geral de usuários */}
        <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="text-base sm:text-xl">Lista de Usuários ({filteredListUsers.length})</span>
          </h2>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {/* Busca */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filtro por tag */}
            {availableTags.length > 0 && (
              <div className="relative">
                {showListTagDropdown && (
                  <div className="fixed inset-0 z-10" onClick={() => setShowListTagDropdown(false)} />
                )}
                <button
                  onClick={() => setShowListTagDropdown(v => !v)}
                  className={`relative z-20 flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                    listFilterTags.length > 0
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Tags{listFilterTags.length > 0 ? ` (${listFilterTags.length})` : ''}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showListTagDropdown && (
                  <div className="absolute left-0 top-full mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl min-w-[180px] p-2 space-y-1">
                    {availableTags.map(tag => (
                      <label key={tag.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={listFilterTags.includes(tag.id)}
                          onChange={() => setListFilterTags(prev =>
                            prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                          )}
                          className="rounded"
                        />
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB', color: tag.color || '#374151' }}
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                    {listFilterTags.length > 0 && (
                      <button
                        onClick={() => setListFilterTags([])}
                        className="w-full mt-1 text-xs text-red-600 hover:text-red-700 py-1 border-t border-gray-100 dark:border-gray-700"
                      >
                        Limpar filtro
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Apenas não avaliados */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyUnevaluated}
                onChange={e => setShowOnlyUnevaluated(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Apenas não avaliados</span>
            </label>
          </div>

          {filteredListUsers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Nenhum usuário encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredListUsers.map(u => {
                const classInfo = u.evaluation ? CLASSIFICATIONS[u.evaluation.classification] : null
                const tags = !u.isExternal ? (userTagsMap[u.id] || []) : []
                return (
                  <div
                    key={u.id}
                    onClick={() => openEvaluationModal(u)}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.full_name}</p>
                      {u.isExternal && (
                        <span className="shrink-0 text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-medium">Externo</span>
                      )}
                    </div>
                    {u.email && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{u.email}</p>}
                    {u.companies?.name && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mb-2">{u.companies.name}</p>}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tags.slice(0, 3).map(tag => (
                          <span
                            key={tag.id}
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: tag.color ? `${tag.color}20` : '#E5E7EB', color: tag.color || '#374151' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                        {tags.length > 3 && <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      {classInfo ? (
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${classInfo.color}20`, color: classInfo.color }}
                        >
                          {classInfo.label}
                        </span>
                      ) : (
                        <span className="text-[11px] text-orange-600 font-medium">Não avaliado</span>
                      )}
                      <span className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        {classInfo ? 'Reavaliar →' : 'Avaliar →'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      {/* Modal Nome Pessoa Externa */}
      {showExternalNameModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <UserPlus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Avaliar Pessoa Externa</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pessoa não cadastrada no sistema</p>
              </div>
            </div>
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Nome completo da pessoa
              </label>
              <input
                type="text"
                autoFocus
                value={externalNameInput}
                onChange={e => setExternalNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmExternalName(); if (e.key === 'Escape') setShowExternalNameModal(false) }}
                placeholder="Ex: João da Silva"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmExternalName}
                disabled={!externalNameInput.trim()}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Continuar para Avaliação
              </button>
              <button
                onClick={() => setShowExternalNameModal(false)}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm transition-colors border border-gray-200 dark:border-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação */}
      {showEvaluationModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative bg-primary-500 text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-white/30">
                    {selectedUser.isExternal
                      ? <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                      : <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1 flex items-center gap-2">
                      {selectedUser.full_name}
                      {selectedUser.isExternal && <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Externo</span>}
                    </h2>
                    <div className="flex items-center gap-2 text-primary-100 text-xs sm:text-sm">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
              {/* Data de Avaliação em Card */}
              <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200 dark:border-gray-600">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  Data da Avaliação
                </label>
                <input
                  type="date"
                  value={evaluationForm.evaluation_date}
                  onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluation_date: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-600 dark:text-white border-2 border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Matriz de Avaliação */}
              <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-5 flex items-center gap-2">
                  <Grid3x3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                  Avaliação Nine Box
                </h3>

                {/* Desempenho Técnico */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                    Nível de Desempenho Técnico
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { value: 1, label: 'Baixo', bgColor: 'from-red-50 to-red-100', borderColor: 'border-red-300', textColor: 'text-red-700', activeColor: 'from-red-500 to-red-600' },
                      { value: 2, label: 'Médio', bgColor: 'from-amber-50 to-amber-100', borderColor: 'border-amber-300', textColor: 'text-amber-700', activeColor: 'from-amber-500 to-amber-600' },
                      { value: 3, label: 'Alto', bgColor: 'from-green-50 to-green-100', borderColor: 'border-green-300', textColor: 'text-green-700', activeColor: 'from-green-500 to-green-600' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setEvaluationForm({ ...evaluationForm, performance_level: option.value })}
                        className={`relative p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl text-xs sm:text-sm lg:text-base font-bold transition-all duration-200 ${
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

                {/* Alinhamento Cultural */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                    Nível de Alinhamento Cultural
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 lg:p-5 bg-primary-50 dark:bg-primary-900/20 rounded-xl sm:rounded-2xl border-2 border-primary-200 dark:border-primary-800 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Classificação Nine Box</p>
                      <p 
                        className="text-lg sm:text-xl lg:text-2xl font-bold"
                        style={{ color: CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].color }}
                      >
                        {CLASSIFICATIONS[getClassification(evaluationForm.performance_level, evaluationForm.potential_level)].label}
                      </p>
                    </div>
                    <div 
                      className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg"
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
                <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                    <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                    Pontos Fortes
                  </label>
                  <textarea
                    value={evaluationForm.strengths}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-2 border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Ex: Excelente comunicação, proatividade, capacidade analítica..."
                  />
                </div>

                {/* Áreas de Melhoria */}
                <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    Áreas para Desenvolvimento
                  </label>
                  <textarea
                    value={evaluationForm.areas_for_improvement}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, areas_for_improvement: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-2 border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Ex: Gestão de tempo, delegação de tarefas, trabalho em equipe..."
                  />
                </div>

                {/* Plano de Desenvolvimento */}
                <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                    <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                    Plano de Desenvolvimento
                  </label>
                  <textarea
                    value={evaluationForm.development_plan}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, development_plan: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-2 border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={4}
                    placeholder="Ex: Treinamento em liderança até Q2, mentorias semanais, curso de Excel avançado..."
                  />
                </div>

                {/* Observações */}
                <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-sm border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 sm:mb-3">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600" />
                    Observações Gerais
                  </label>
                  <textarea
                    value={evaluationForm.notes}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-600 dark:text-white dark:placeholder-gray-400 border-2 border-gray-200 dark:border-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
                    rows={3}
                    placeholder="Contexto adicional, situações específicas, feedback qualitativo..."
                  />
                </div>
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl sm:rounded-b-3xl">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={saveEvaluation}
                  disabled={saving}
                  className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  className={`w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all duration-200 border-2 border-gray-200 dark:border-gray-600 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative bg-primary-500 text-white px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                    <History className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Histórico de Avaliações</h2>
                    <p className="text-primary-100">
                      {selectedUser.full_name}{selectedUser.isExternal ? ' · Externo' : ''} — {selectedUser.company_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportarPDF}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#373535] text-[#EBA500] border border-[#EBA500]/60 rounded-xl text-sm font-medium hover:bg-[#2a2828] transition-all shadow-sm disabled:opacity-60"
                    title="Exportar histórico como PDF"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-[#EBA500] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Exportar PDF
                  </button>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline de Avaliações */}
            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
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
                    <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-sm border-2 border-gray-200 dark:border-gray-600 mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-primary-100">
                          <TrendingUp className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Evolução ao Longo do Tempo</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Progressão de desempenho técnico e alinhamento cultural</p>
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
                                'Desempenho Técnico': ev.performance_level,
                                'Alinhamento Cultural': ev.potential_level
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
                              dataKey="Desempenho Técnico" 
                              stroke="#EBA500" 
                              strokeWidth={3}
                              dot={{ fill: '#EBA500', strokeWidth: 2, r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="Alinhamento Cultural" 
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
                          <span className="text-gray-700 dark:text-gray-300">Desempenho</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-gray-700 dark:text-gray-300">Potencial</span>
                        </div>
                        <div className="flex items-center gap-4 ml-6 text-xs text-gray-500 dark:text-gray-400">
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
                        className={`bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-sm border-2 ${
                          isLatest ? 'border-primary-300 ring-2 ring-primary-200' : 'border-gray-200 dark:border-gray-600'
                        } transition-all`}
                      >
                        {/* Cabeçalho da Avaliação */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl" style={{ backgroundColor: `${classInfo.color}20` }}>
                              <Calendar className="h-5 w-5" style={{ color: classInfo.color }} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">
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
                          <div className="bg-gray-50 dark:bg-gray-600 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary-600" />
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Desempenho</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {evaluation.performance_level === 1 ? 'Baixo' : evaluation.performance_level === 2 ? 'Médio' : 'Alto'}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-600 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary-600" />
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Potencial</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                              {evaluation.potential_level === 1 ? 'Baixo' : evaluation.potential_level === 2 ? 'Médio' : 'Alto'}
                            </p>
                          </div>
                        </div>

                        {/* Detalhes */}
                        {(evaluation.strengths || evaluation.areas_for_improvement || evaluation.notes) && (
                          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                            {evaluation.strengths && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                  <ThumbsUp className="h-4 w-4 text-green-600" />
                                  Pontos Fortes
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.strengths}</p>
                              </div>
                            )}
                            
                            {evaluation.areas_for_improvement && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-orange-600" />
                                  Áreas de Melhoria
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.areas_for_improvement}</p>
                              </div>
                            )}
                            
                            {evaluation.notes && (
                              <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  Observações
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.notes}</p>
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
            <div className="px-8 py-5 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-3xl flex justify-between items-center">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all duration-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel || 'Excluir'}
          variant={confirmDialog.variant || 'danger'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
