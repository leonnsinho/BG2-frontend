import React, { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { X, TrendingUp, Target, DollarSign, User, FileText, Zap, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function IndicatorModal({ indicator, onClose, onSave }) {
  const { profile } = useAuth()
  const permissions = usePermissions()
  const [formData, setFormData] = useState({
    name: '',
    journey: 'Operacional',
    type: 'Percentual',
    meta: '',
    responsible_user_id: '',
    is_active: true,
    description: '',
    company_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [companyUsers, setCompanyUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const journeys = ['Estratégia', 'Financeira', 'Receita', 'Pessoas & Cultura', 'Operacional']
  const types = ['Percentual', 'Monetário', 'Financeiro', 'Dias', 'Índice']

  // Carregar empresas se for super admin
  useEffect(() => {
    if (permissions.isSuperAdmin()) {
      loadCompanies()
    } else {
      // Se não for super admin, pegar automaticamente a empresa do usuário
      loadUserCompany()
    }
  }, [])

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const loadUserCompany = async () => {
    try {
      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', profile.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (error) throw error
      
      if (userCompanies?.company_id) {
        setFormData(prev => ({ ...prev, company_id: userCompanies.company_id }))
      }
    } catch (error) {
      console.error('Erro ao carregar empresa do usuário:', error)
    }
  }

  const loadCompanyUsers = async (companyId) => {
    if (!companyId) {
      setCompanyUsers([])
      return
    }

    try {
      setLoadingUsers(true)
      
      // Buscar usuários vinculados à empresa
      const { data: userCompanies, error: ucError } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('is_active', true)

      if (ucError) throw ucError

      const userIds = userCompanies.map(uc => uc.user_id)

      if (userIds.length === 0) {
        setCompanyUsers([])
        return
      }

      // Buscar perfis dos usuários
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds)
        .order('full_name')

      if (usersError) throw usersError
      setCompanyUsers(users || [])
    } catch (error) {
      console.error('Erro ao carregar usuários da empresa:', error)
      toast.error('Erro ao carregar usuários')
      setCompanyUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // Carregar usuários quando a empresa mudar
  useEffect(() => {
    if (formData.company_id) {
      loadCompanyUsers(formData.company_id)
    } else {
      setCompanyUsers([])
    }
  }, [formData.company_id])

  useEffect(() => {
    if (indicator) {
      setFormData({
        name: indicator.name || '',
        journey: indicator.journey || 'Operacional',
        type: indicator.type || 'Percentual',
        meta: indicator.meta || '',
        responsible_user_id: indicator.responsible_user_id || '',
        is_active: indicator.is_active ?? true,
        description: indicator.description || '',
        company_id: indicator.company_id || ''
      })
    }
  }, [indicator])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome do indicador é obrigatório')
      return
    }

    if (!formData.meta.trim()) {
      toast.error('Meta é obrigatória')
      return
    }

    if (!formData.company_id) {
      toast.error('Empresa é obrigatória')
      return
    }

    try {
      setLoading(true)

      if (indicator) {
        // Atualizar
        const { error } = await supabase
          .from('management_indicators')
          .update(formData)
          .eq('id', indicator.id)

        if (error) throw error
        toast.success('Indicador atualizado com sucesso')
      } else {
        // Criar novo
        const { error } = await supabase
          .from('management_indicators')
          .insert([formData])

        if (error) throw error
        toast.success('Indicador criado com sucesso')
      }

      onSave()
    } catch (error) {
      console.error('Erro ao salvar indicador:', error)
      toast.error('Erro ao salvar indicador')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      // Se mudar a empresa, limpar o responsável selecionado
      if (field === 'company_id' && prev.company_id !== value) {
        updated.responsible_user_id = ''
      }
      
      return updated
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header com Gradiente */}
        <div className="sticky top-0 bg-yellow-500 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {indicator ? 'Editar Indicador' : 'Novo Indicador'}
              </h2>
              <p className="text-yellow-100 text-sm">
                {indicator ? 'Atualize as informações do indicador' : 'Preencha os dados para criar um novo indicador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-all text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Nome do Indicador */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              Nome do Indicador *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Eficiência de Produção"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all bg-gray-50 focus:bg-white font-medium"
              required
            />
          </div>

          {/* Empresa - Só aparece para Super Admin */}
          {permissions.isSuperAdmin() && (
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Building2 className="h-4 w-4 text-blue-500" />
                Empresa *
              </label>
              <select
                value={formData.company_id}
                onChange={(e) => handleChange('company_id', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-r from-blue-50 to-white focus:from-white focus:to-white font-medium appearance-none cursor-pointer"
                required
                disabled={loadingCompanies}
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {loadingCompanies && (
                <p className="mt-2 text-xs text-gray-500">Carregando empresas...</p>
              )}
            </div>
          )}

          {/* Jornada e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Target className="h-4 w-4 text-purple-500" />
                Jornada *
              </label>
              <select
                value={formData.journey}
                onChange={(e) => handleChange('journey', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gradient-to-r from-purple-50 to-white focus:from-white focus:to-white font-medium appearance-none cursor-pointer"
                required
              >
                {journeys.map(journey => (
                  <option key={journey} value={journey}>{journey}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Zap className="h-4 w-4 text-blue-500" />
                Tipo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-r from-blue-50 to-white focus:from-white focus:to-white font-medium appearance-none cursor-pointer"
                required
              >
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Meta */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <DollarSign className="h-4 w-4 text-green-500" />
              Meta *
            </label>
            <input
              type="text"
              value={formData.meta}
              onChange={(e) => handleChange('meta', e.target.value)}
              placeholder={
                formData.type === 'Percentual' ? 'Ex: 95%' :
                formData.type === 'Monetário' || formData.type === 'Financeiro' ? 'Ex: R$ 500.000' :
                formData.type === 'Dias' ? 'Ex: 5 dias' :
                'Ex: 8.5'
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-gray-50 focus:bg-white font-medium"
              required
            />
            <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              {formData.type === 'Percentual' && '💡 Use o símbolo % (ex: 95%)'}
              {(formData.type === 'Monetário' || formData.type === 'Financeiro') && '💡 Use R$ (ex: R$ 500.000)'}
              {formData.type === 'Dias' && '💡 Especifique em dias (ex: 5 dias)'}
              {formData.type === 'Índice' && '💡 Use valor numérico (ex: 8.5)'}
            </p>
          </div>

          {/* Responsável */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <User className="h-4 w-4 text-yellow-500" />
              Responsável
            </label>
            <select
              value={formData.responsible_user_id}
              onChange={(e) => handleChange('responsible_user_id', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all bg-yellow-50 focus:bg-white font-medium appearance-none cursor-pointer"
              disabled={loadingUsers || !formData.company_id}
            >
              <option value="">
                {loadingUsers ? 'Carregando usuários...' : 
                 !formData.company_id ? 'Selecione uma empresa primeiro' : 
                 'Não atribuído'}
              </option>
              {companyUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
            {!formData.company_id && (
              <p className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                💡 Selecione uma empresa para ver os usuários disponíveis
              </p>
            )}
            {formData.company_id && companyUsers.length === 0 && !loadingUsers && (
              <p className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                ℹ️ Nenhum usuário encontrado nesta empresa
              </p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <FileText className="h-4 w-4 text-indigo-500" />
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o objetivo e importância deste indicador..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white resize-none font-medium"
            />
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between p-5 bg-yellow-50 rounded-2xl border-2 border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Indicador Ativo</p>
                <p className="text-sm text-gray-600">Este indicador será exibido na visualização</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-inner ${
                formData.is_active ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  formData.is_active ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold hover:border-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Salvando...
                </span>
              ) : (
                indicator ? 'Atualizar Indicador' : 'Criar Indicador'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
