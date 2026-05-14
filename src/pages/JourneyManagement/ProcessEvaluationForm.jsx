import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import { 
  Target, 
  Building2, 
  ChevronLeft,
  Save,
  AlertCircle,
  CheckCircle,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from '@/lib/toast'

const ProcessEvaluationForm = () => {
  const { journeySlug, processId } = useParams()
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company')
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  // Mapear dados das jornadas
  const journeysData = {
    'estrategica': {
      name: 'Jornada Estratégica',
      shortName: 'Estratégia'
    },
    'financeira': {
      name: 'Jornada Financeira', 
      shortName: 'Financeira'
    },
    'pessoas-cultura': {
      name: 'Jornada Pessoas e Cultura',
      shortName: 'Pessoas e Cultura'
    },
    'receita': {
      name: 'Jornada Receita',
      shortName: 'Receita'
    },
    'operacional': {
      name: 'Jornada Operacional',
      shortName: 'Operacional'
    }
  }
  
  const journey = journeysData[journeySlug]
  
  const [process, setProcess] = useState(null)
  const [company, setCompany] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    status: 'pending',
    has_process: null,
    observations: '',
    business_importance: 3,
    implementation_urgency: 3,
    implementation_ease: 3
  })

  // Labels para importância do negócio
  const businessImportanceLabels = {
    1: 'Irrelevante',
    2: 'Irrelevante',
    3: 'Pouco importante',
    4: 'Importante',
    5: 'Muito importante'
  }

  // Labels para urgência de implementação
  const implementationUrgencyLabels = {
    1: 'Sem urgência',
    2: 'Pouco urgente',
    3: 'Urgente',
    4: 'Muito urgente',
    5: 'Urgentíssimo'
  }

  // Labels para dificuldade de implementação
  const implementationEaseLabels = {
    1: 'Sem esforço',
    2: 'Pouco esforço',
    3: 'Esforço mediano',
    4: 'Muito esforço',
    5: 'Difícil implementação'
  }

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Carregar processo
        const { data: processData, error: processError } = await supabase
          .from('processes')
          .select('*')
          .eq('id', processId)
          .single()

        if (processError) throw processError
        setProcess(processData)

        // Carregar empresa
        if (companyId) {
          const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single()

          if (companyError) throw companyError
          setCompany(companyData)

          // Carregar avaliação existente
          const { data: evaluationData, error: evaluationError } = await supabase
            .from('process_evaluations')
            .select('*')
            .eq('company_id', companyId)
            .eq('process_id', processId)
            .maybeSingle()

          if (evaluationError && evaluationError.code !== 'PGRST116') {
            throw evaluationError
          }

          if (evaluationData) {
            setEvaluation(evaluationData)
            setFormData({
              status: evaluationData.status || 'pending',
              has_process: evaluationData.has_process,
              observations: evaluationData.observations || '',
              business_importance: evaluationData.business_importance || 3,
              implementation_urgency: evaluationData.implementation_urgency || 3,
              implementation_ease: evaluationData.implementation_ease || 3,
              responsible_user_id: evaluationData.responsible_user_id || null
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados do processo')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [processId, companyId])

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Se "Tem" for selecionado, resetar valores de priorização para valor mínimo (não entra no cálculo)
      if (field === 'has_process' && value === true) {
        newData.business_importance = 1
        newData.implementation_urgency = 1
        newData.implementation_ease = 1
      }
      
      return newData
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Validações básicas
      if (!companyId) {
        toast.error('Empresa não selecionada')
        return
      }

      if (!profile?.id) {
        toast.error('Usuário não identificado')
        return
      }

      if (!processId) {
        toast.error('Processo não identificado')
        return
      }

      // Preparar dados para salvar
      const dataToSave = {
        company_id: companyId,
        process_id: processId,
        evaluator_id: profile.id,
        evaluated_at: new Date().toISOString(),
        status: formData.status || 'pending',
        has_process: formData.has_process || false,
        observations: formData.observations || '',
        business_importance: formData.has_process === true ? 1 : (formData.business_importance || 1),
        implementation_urgency: formData.has_process === true ? 1 : (formData.implementation_urgency || 1),
        implementation_ease: formData.has_process === true ? 1 : (formData.implementation_ease || 1),
        responsible_user_id: formData.responsible_user_id || null
      }

      // 🔥 NOTA: O priority_score será calculado automaticamente pela trigger do banco
      // Fórmula: (Importância × Urgência) ÷ (6 - Facilidade)
      // A trigger foi corrigida no arquivo: scripts-sql/fix_priority_score_formula.sql

      console.log('🔄 Tentando salvar avaliação:', {
        dataToSave,
        userProfile: profile,
        isUpdate: !!evaluation,
        nota: 'priority_score será calculado pela trigger do banco'
      })

      let result
      if (evaluation) {
        // Atualizar avaliação existente
        result = await supabase
          .from('process_evaluations')
          .update(dataToSave)
          .eq('id', evaluation.id)
          .select()
          .single()
      } else {
        // Criar nova avaliação
        result = await supabase
          .from('process_evaluations')
          .insert(dataToSave)
          .select()
          .single()
      }

      if (result.error) {
        console.error('❌ Erro do Supabase:', result.error)
        throw result.error
      }

      console.log('✅ Avaliação salva com sucesso:', result.data)
      toast.success(evaluation ? 'Avaliação atualizada com sucesso!' : 'Avaliação salva com sucesso!')
      
      // Voltar para a página da jornada
      navigate(`/journey-management/${journeySlug}?company=${companyId}`)
      
    } catch (error) {
      console.error('❌ Erro completo ao salvar avaliação:', error)
      
      let errorMessage = 'Erro desconhecido ao salvar avaliação'
      
      if (error.code === '42501') {
        errorMessage = 'Sem permissão para salvar avaliação. Verifique suas permissões.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(`Erro: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando processo...</p>
        </div>
      </div>
    )
  }

  if (!process) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Processo não encontrado</h1>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary-600 hover:text-primary-800 dark:text-[#EBA500]"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200/50 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 sm:p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#373435] to-[#373435]/90 hover:from-[#EBA500] hover:to-[#EBA500]/90 text-white transition-all duration-300 shadow-sm hover:shadow-md touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 shadow-sm">
                <Target className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#373435] dark:text-white truncate">
                  {evaluation ? 'Editar Avaliação' : 'Avaliar Processo'}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                  {journey ? journey.shortName : 'Jornada'}/{process.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Detalhes do Processo - Colapsável */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700 mb-4 sm:mb-6 lg:mb-8 overflow-hidden">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="w-full p-4 sm:p-5 lg:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[60px] touch-manipulation"
          >
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[#EBA500] flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-semibold text-[#373435] dark:text-white truncate">{process.name}</h3>
            </div>
            <div className={`transition-transform duration-300 flex-shrink-0 ml-2 ${detailsExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              detailsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="px-4 sm:px-5 lg:px-6 pb-4 sm:pb-5 lg:pb-6 border-t border-gray-100 dark:border-gray-700">
              {process.description && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Descrição</dt>
                  <dd className="text-sm text-[#373435] dark:text-white leading-relaxed">{process.description}</dd>
                </div>
              )}
              
              {/* Detalhes técnicos - apenas para Super Admin */}
              {profile?.role === 'super_admin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Código</dt>
                    <dd className="text-sm text-[#373435] dark:text-white px-3 py-1 bg-gradient-to-r from-[#373435]/10 to-[#373435]/5 dark:from-gray-600 dark:to-gray-700 rounded-2xl inline-block border border-[#373435]/20 dark:border-gray-500">{process.code}</dd>
                  </div>
                  
                  {process.category && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categoria</dt>
                      <dd className="text-sm text-[#373435] dark:text-white px-3 py-1 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 rounded-2xl inline-block border border-[#EBA500]/20">{process.category}</dd>
                    </div>
                  )}
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Peso</dt>
                    <dd className="text-sm text-[#373435] dark:text-white">
                      <span className="inline-flex items-center space-x-1">
                        <span className="w-2 h-2 bg-[#EBA500] rounded-full"></span>
                        <span>{process.weight}</span>
                      </span>
                    </dd>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulário de Avaliação */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200/50 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
              <h3 className="text-base sm:text-lg font-semibold text-[#373435] dark:text-white mb-6 sm:mb-8">
                Avaliação do Processo
              </h3>
              
              <form className="space-y-6 sm:space-y-8">
                {/* Tem/não tem processo */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] dark:text-gray-300 mb-3">
                    A empresa tem/usa este processo?
                  </label>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="has_process"
                        value="true"
                        checked={formData.has_process === true}
                        onChange={() => handleInputChange('has_process', true)}
                        className="form-radio h-5 w-5 text-[#EBA500] focus:ring-[#EBA500]/30 border-gray-300 cursor-pointer touch-manipulation"
                      />
                      <span className="ml-2 sm:ml-3 text-sm sm:text-base text-[#373435] dark:text-white">Tem</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="has_process"
                        value="false"
                        checked={formData.has_process === false}
                        onChange={() => handleInputChange('has_process', false)}
                        className="form-radio h-5 w-5 text-[#EBA500] focus:ring-[#EBA500]/30 border-gray-300 cursor-pointer touch-manipulation"
                      />
                      <span className="ml-2 sm:ml-3 text-sm sm:text-base text-[#373435] dark:text-white">Não tem</span>
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] dark:text-gray-300 mb-3">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={3}
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Observações sobre o processo na empresa..."
                    className="block w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-2xl px-3 sm:px-4 py-2 sm:py-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] text-sm sm:text-base transition-all duration-200 resize-none touch-manipulation"
                  />
                </div>

                {/* Seção de Priorização */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-[#373435] dark:text-white mb-4 sm:mb-6">
                    Avaliação de Prioridade
                  </h4>
                  
                  {formData.has_process === true && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-700/40 mb-6">
                      <p className="text-green-800 dark:text-green-300 text-sm">
                        ✅ Como a empresa já tem este processo amadurecido, não entra no cálculo de prioridade.
                      </p>
                    </div>
                  )}
                  
                  <div className={`grid grid-cols-1 gap-6 sm:gap-8 ${formData.has_process === true ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Importância para o Negócio */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] dark:text-gray-300 mb-3 sm:mb-4">
                        Importância para o Negócio
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                        {[
                          { value: 1, label: 'Irrelevante' },
                          { value: 2, label: 'Pouco relevante' },
                          { value: 3, label: 'Regular' },
                          { value: 4, label: 'Importante' },
                          { value: 5, label: 'Muito importante' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('business_importance', option.value)}
                            disabled={formData.has_process === true}
                            className={`flex flex-col items-center p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 min-h-[80px] sm:min-h-[90px] justify-center touch-manipulation ${
                              formData.business_importance === option.value && formData.has_process !== true
                                ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-100/50 shadow-md dark:from-indigo-900/20 dark:to-indigo-800/10'
                                : formData.has_process === true
                                ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${
                              formData.business_importance === option.value && formData.has_process !== true
                                ? 'text-indigo-600' 
                                : formData.has_process === true 
                                ? 'text-gray-400' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {option.value}
                            </span>
                            <span className={`text-xs text-center leading-tight px-1 ${
                              formData.has_process === false ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Urgência para Implementação */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] dark:text-gray-300 mb-3 sm:mb-4">
                        Urgência para Implementação
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                        {[
                          { value: 1, label: 'Sem urgência' },
                          { value: 2, label: 'Pouco urgente' },
                          { value: 3, label: 'Urgente' },
                          { value: 4, label: 'Muito urgente' },
                          { value: 5, label: 'Urgentíssimo' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('implementation_urgency', option.value)}
                            disabled={formData.has_process === true}
                            className={`flex flex-col items-center p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 min-h-[80px] sm:min-h-[90px] justify-center touch-manipulation ${
                              formData.implementation_urgency === option.value && formData.has_process !== true
                                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100/50 shadow-md dark:from-orange-900/20 dark:to-orange-800/10'
                                : formData.has_process === true
                                ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${
                              formData.implementation_urgency === option.value && formData.has_process !== true
                                ? 'text-orange-600' 
                                : formData.has_process === true 
                                ? 'text-gray-400' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {option.value}
                            </span>
                            <span className={`text-xs text-center leading-tight px-1 ${
                              formData.has_process === false ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dificuldade para implementar */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] dark:text-gray-300 mb-3 sm:mb-4">
                        Dificuldade para implementar
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                        {[
                          { value: 1, label: 'Sem esforço' },
                          { value: 2, label: 'Pouco esforço' },
                          { value: 3, label: 'Esforço mediano' },
                          { value: 4, label: 'Muito esforço' },
                          { value: 5, label: 'Difícil implementação' }
                        ].map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleInputChange('implementation_ease', option.value)}
                            disabled={formData.has_process === true}
                            className={`flex flex-col items-center p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 min-h-[80px] sm:min-h-[90px] justify-center touch-manipulation ${
                              formData.implementation_ease === option.value && formData.has_process !== true
                                ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100/50 shadow-md dark:from-green-900/20 dark:to-green-800/10'
                                : formData.has_process === true
                                ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                                : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${
                              formData.implementation_ease === option.value && formData.has_process !== true
                                ? 'text-green-600' 
                                : formData.has_process === true 
                                ? 'text-gray-400' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {option.value}
                            </span>
                            <span className={`text-xs text-center leading-tight px-1 ${
                              formData.has_process === false ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview das Seleções */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                      <h5 className="text-sm sm:text-base font-semibold text-[#373435] dark:text-white">
                        Resumo da Avaliação de Prioridade
                      </h5>
                    </div>
                    
                    {formData.has_process === true ? (
                      <div className="text-center py-8">
                        <div className="text-green-500 text-lg mb-2">✅</div>
                        <div className="text-green-600 font-medium mb-2">Processo Já Amadurecido</div>
                        <div className="text-green-500 text-sm mb-4">
                          A empresa já possui este processo amadurecido, não entra no cálculo de prioridade.
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                          {/* Importância */}
                          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-indigo-200 dark:border-indigo-700/40 bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-900/20 dark:to-indigo-800/10 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between">
                            <div className="text-[10px] sm:text-xs text-indigo-600 font-semibold mb-1 sm:mb-2 uppercase tracking-wide">
                              Importância
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="text-xl sm:text-2xl font-bold text-indigo-700 mb-1">
                                {formData.business_importance}/5
                              </div>
                              <div className="text-[10px] sm:text-xs text-indigo-600 leading-tight font-medium">
                                {businessImportanceLabels[formData.business_importance]}
                              </div>
                            </div>
                          </div>
                          
                          {/* Urgência */}
                          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-orange-200 dark:border-orange-700/40 bg-gradient-to-br from-orange-50 to-orange-100/30 dark:from-orange-900/20 dark:to-orange-800/10 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between">
                            <div className="text-[10px] sm:text-xs text-orange-600 font-semibold mb-1 sm:mb-2 uppercase tracking-wide">
                              Urgência
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="text-xl sm:text-2xl font-bold text-orange-700 mb-1">
                                {formData.implementation_urgency}/5
                              </div>
                              <div className="text-xs text-orange-600 leading-tight font-medium">
                                {implementationUrgencyLabels[formData.implementation_urgency]}
                              </div>
                            </div>
                          </div>
                          
                          {/* Dificuldade */}
                          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-700/40 bg-gradient-to-br from-green-50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between">
                            <div className="text-[10px] sm:text-xs text-green-600 font-semibold mb-1 sm:mb-2 uppercase tracking-wide">
                              Dificuldade
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                                {formData.implementation_ease}/5
                              </div>
                              <div className="text-xs text-green-600 leading-tight font-medium">
                                {implementationEaseLabels[formData.implementation_ease]}
                              </div>
                            </div>
                          </div>
                          
                          {/* Priorização */}
                          <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-700/40 bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 min-h-[90px] sm:min-h-[100px] flex flex-col justify-between col-span-2 lg:col-span-1">
                            <div className="text-[10px] sm:text-xs text-blue-600 font-semibold mb-1 sm:mb-2 uppercase tracking-wide">
                              Nota Final
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">
                                {formData.has_process === true 
                                  ? 'N/A'
                                  : formData.business_importance && formData.implementation_urgency && formData.implementation_ease
                                  ? ((formData.business_importance * formData.implementation_urgency) / formData.implementation_ease).toFixed(1)
                                  : '0.0'
                                }
                              </div>
                              <div className="text-xs text-blue-600 leading-tight font-medium">
                                Priorização
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Fórmula */}
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white/50 dark:bg-gray-600/50 rounded-lg sm:rounded-xl border border-gray-200/50 dark:border-gray-500/50">
                          <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 text-center font-medium">
                            Fórmula: (Importância × Urgência) ÷ Dificuldade
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                </div>

                {/* Botões de Ação */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full sm:w-auto px-6 py-3 min-h-[44px] text-sm font-medium text-[#373435] dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 transition-all duration-200 touch-manipulation"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 min-h-[44px] text-sm font-medium text-white bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 border border-transparent rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Avaliação
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
      </div>
    </div>
  )
}

export default ProcessEvaluationForm