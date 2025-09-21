import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'
import FileUploadField from '../../components/FileUploadField'
import { 
  Target, 
  Building2, 
  ChevronLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Star,
  FileText,
  Calendar,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'

const ProcessEvaluationForm = () => {
  const { journeySlug, processId } = useParams()
  const [searchParams] = useSearchParams()
  const companyId = searchParams.get('company')
  const navigate = useNavigate()
  const { profile } = useAuth()
  
  const [process, setProcess] = useState(null)
  const [company, setCompany] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    current_score: 0,
    target_score: 0,
    evaluation_notes: '',
    improvement_plan: '',
    deadline: '',
    confidence_level: 3,
    status: 'pending',
    has_process: null,
    observations: '',
    business_importance: 3,
    implementation_urgency: 3,
    implementation_ease: 3,
    evidence_files: [],
    uploaded_files: []
  })

  const scoreLabels = {
    0: 'Não Avaliado',
    1: 'Muito Ruim',
    2: 'Ruim', 
    3: 'Regular',
    4: 'Bom',
    5: 'Excelente'
  }

  const scoreColors = {
    0: 'text-gray-500',
    1: 'text-red-700',
    2: 'text-orange-700',
    3: 'text-yellow-700',
    4: 'text-blue-700',
    5: 'text-green-700'
  }

  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'Em Progresso', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
    { value: 'blocked', label: 'Bloqueado', color: 'bg-red-100 text-red-800' }
  ]

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
              current_score: evaluationData.current_score || 0,
              target_score: evaluationData.target_score || 0,
              evaluation_notes: evaluationData.evaluation_notes || '',
              improvement_plan: evaluationData.improvement_plan || '',
              deadline: evaluationData.deadline || '',
              confidence_level: evaluationData.confidence_level || 3,
              status: evaluationData.status || 'pending',
              has_process: evaluationData.has_process,
              observations: evaluationData.observations || '',
              business_importance: evaluationData.business_importance || 3,
              implementation_urgency: evaluationData.implementation_urgency || 3,
              implementation_ease: evaluationData.implementation_ease || 3,
              responsible_user_id: evaluationData.responsible_user_id || null,
              evidence_files: evaluationData.evidence_files || [],
              uploaded_files: []
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
        current_score: formData.current_score || 0,
        target_score: formData.target_score || 0,
        has_process: formData.has_process || false,
        observations: formData.observations || '',
        business_importance: formData.business_importance || 1,
        implementation_urgency: formData.implementation_urgency || 1,
        implementation_ease: formData.implementation_ease || 1,
        responsible_user_id: formData.responsible_user_id || null,
        evidence_files: [
          ...(formData.evidence_files || []),
          ...(formData.uploaded_files?.map(file => file.path) || [])
        ].filter(file => file && file.trim() !== '')
      }

      console.log('🔄 Tentando salvar avaliação:', {
        dataToSave,
        userProfile: profile,
        isUpdate: !!evaluation
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando processo...</p>
        </div>
      </div>
    )
  }

  if (!process) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Processo não encontrado</h1>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary-600 hover:text-primary-800"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 rounded-2xl bg-gradient-to-r from-[#373435] to-[#373435]/90 hover:from-[#EBA500] hover:to-[#EBA500]/90 text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 shadow-sm">
                <Target className="h-7 w-7 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-[#373435]">
                  {evaluation ? 'Editar Avaliação' : 'Avaliar Processo'}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {process.code} - {process.name}
                </p>
              </div>
            </div>
            
            {company && (
              <div className="mt-6 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 rounded-2xl border border-[#EBA500]/20">
                <Building2 className="h-4 w-4 text-[#EBA500]" />
                <span className="text-sm font-medium text-[#373435]">Empresa: {company.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Informações do Processo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-8">
              <h3 className="text-lg font-semibold text-[#373435] mb-6">
                Detalhes do Processo
              </h3>
              
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código</dt>
                  <dd className="text-sm text-[#373435] mt-1 px-3 py-1 bg-gradient-to-r from-[#373435]/10 to-[#373435]/5 rounded-2xl inline-block border border-[#373435]/20">{process.code}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="text-sm text-[#373435] mt-1 font-medium">{process.name}</dd>
                </div>
                
                {process.category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                    <dd className="text-sm text-[#373435] mt-1 px-3 py-1 bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 rounded-2xl inline-block border border-[#EBA500]/20">{process.category}</dd>
                  </div>
                )}
                
                {process.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                    <dd className="text-sm text-[#373435] mt-1 leading-relaxed">{process.description}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Peso</dt>
                  <dd className="text-sm text-[#373435] mt-1">
                    <span className="inline-flex items-center space-x-1">
                      <span className="w-2 h-2 bg-[#EBA500] rounded-full"></span>
                      <span>{process.weight}</span>
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Formulário de Avaliação */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 p-8">
              <h3 className="text-lg font-semibold text-[#373435] mb-8">
                Avaliação do Processo
              </h3>
              
              <form className="space-y-8">
                {/* Score Atual */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-4">
                    Score Atual (0-5)
                  </label>
                  <div className="flex items-center space-x-3">
                    {[0, 1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleInputChange('current_score', score)}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                          formData.current_score === score
                            ? 'border-[#EBA500] bg-gradient-to-r from-[#EBA500]/10 to-[#EBA500]/5 shadow-md'
                            : 'border-gray-200 hover:border-[#EBA500]/50 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-lg font-bold ${formData.current_score === score ? 'text-[#EBA500]' : scoreColors[score]}`}>
                          {score}
                        </span>
                        <span className="text-xs text-center mt-1 text-gray-600">
                          {scoreLabels[score]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Meta */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-4">
                    Score Meta (0-5)
                  </label>
                  <div className="flex items-center space-x-3">
                    {[0, 1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleInputChange('target_score', score)}
                        className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                          formData.target_score === score
                            ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-md'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${formData.target_score === score ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-xs mt-1 text-gray-600">{score}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas de Avaliação */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    <FileText className="inline h-4 w-4 mr-2 text-[#EBA500]" />
                    Notas da Avaliação
                  </label>
                  <textarea
                    rows={4}
                    value={formData.evaluation_notes}
                    onChange={(e) => handleInputChange('evaluation_notes', e.target.value)}
                    placeholder="Descreva a situação atual do processo..."
                    className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 resize-none"
                  />
                </div>

                {/* Plano de Melhoria */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    Plano de Melhoria
                  </label>
                  <textarea
                    rows={4}
                    value={formData.improvement_plan}
                    onChange={(e) => handleInputChange('improvement_plan', e.target.value)}
                    placeholder="Descreva as ações para melhorar o processo..."
                    className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Prazo */}
                  <div>
                    <label className="block text-sm font-semibold text-[#373435] mb-3">
                      <Calendar className="inline h-4 w-4 mr-2 text-[#EBA500]" />
                      Prazo
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200"
                    />
                  </div>

                  {/* Nível de Confiança */}
                  <div>
                    <label className="block text-sm font-semibold text-[#373435] mb-3">
                      Nível de Confiança
                    </label>
                    <select
                      value={formData.confidence_level}
                      onChange={(e) => handleInputChange('confidence_level', parseInt(e.target.value))}
                      className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 bg-white"
                    >
                      <option value={1}>1 - Muito Baixo</option>
                      <option value={2}>2 - Baixo</option>
                      <option value={3}>3 - Médio</option>
                      <option value={4}>4 - Alto</option>
                      <option value={5}>5 - Muito Alto</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 bg-white"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tem/não tem processo */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    A empresa tem/usa este processo?
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="has_process"
                        value="true"
                        checked={formData.has_process === true}
                        onChange={() => handleInputChange('has_process', true)}
                        className="form-radio h-4 w-4 text-[#EBA500] focus:ring-[#EBA500]/30 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-[#373435]">Sim, tem/usa</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="has_process"
                        value="false"
                        checked={formData.has_process === false}
                        onChange={() => handleInputChange('has_process', false)}
                        className="form-radio h-4 w-4 text-[#EBA500] focus:ring-[#EBA500]/30 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-[#373435]">Não tem/não usa</span>
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={3}
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Observações sobre o processo na empresa..."
                    className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 resize-none"
                  />
                </div>

                {/* Upload de Arquivos */}
                <FileUploadField
                  companyId={companyId}
                  processId={processId}
                  evaluationId={evaluation?.id}
                  value={formData.uploaded_files}
                  onChange={(files) => handleInputChange('uploaded_files', files)}
                  disabled={saving}
                />

                {/* Links de Evidência Adicionais */}
                <div>
                  <label className="block text-sm font-semibold text-[#373435] mb-3">
                    Links Externos de Evidência (opcional)
                  </label>
                  <div className="space-y-2">
                    {formData.evidence_files.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={file}
                          onChange={(e) => {
                            const newFiles = [...formData.evidence_files]
                            newFiles[index] = e.target.value
                            handleInputChange('evidence_files', newFiles)
                          }}
                          placeholder="https://..."
                          className="flex-1 border border-gray-200 rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = formData.evidence_files.filter((_, i) => i !== index)
                            handleInputChange('evidence_files', newFiles)
                          }}
                          className="p-2 text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        handleInputChange('evidence_files', [...formData.evidence_files, ''])
                      }}
                      className="text-sm text-[#EBA500] hover:text-[#EBA500]/80 font-medium"
                    >
                      + Adicionar link externo
                    </button>
                  </div>
                </div>

                {/* Seção de Priorização */}
                <div className="border-t border-gray-100 pt-8">
                  <h4 className="text-lg font-semibold text-[#373435] mb-6">
                    Avaliação de Prioridade
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Importância para Empresa */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] mb-3">
                        Importância para Empresa (1-5)
                      </label>
                      <select
                        value={formData.business_importance}
                        onChange={(e) => handleInputChange('business_importance', parseInt(e.target.value))}
                        className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 bg-white"
                      >
                        <option value={1}>1 - Muito Baixa</option>
                        <option value={2}>2 - Baixa</option>
                        <option value={3}>3 - Média</option>
                        <option value={4}>4 - Alta</option>
                        <option value={5}>5 - Muito Alta</option>
                      </select>
                    </div>

                    {/* Urgência para Realização */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] mb-3">
                        Urgência para Realização (1-5)
                      </label>
                      <select
                        value={formData.implementation_urgency}
                        onChange={(e) => handleInputChange('implementation_urgency', parseInt(e.target.value))}
                        className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 bg-white"
                      >
                        <option value={1}>1 - Muito Baixa</option>
                        <option value={2}>2 - Baixa</option>
                        <option value={3}>3 - Média</option>
                        <option value={4}>4 - Alta</option>
                        <option value={5}>5 - Muito Alta</option>
                      </select>
                    </div>

                    {/* Facilidade para Implementar */}
                    <div>
                      <label className="block text-sm font-semibold text-[#373435] mb-3">
                        Facilidade para Implementar (1-5)
                      </label>
                      <select
                        value={formData.implementation_ease}
                        onChange={(e) => handleInputChange('implementation_ease', parseInt(e.target.value))}
                        className="block w-full border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/20 focus:border-[#EBA500] sm:text-sm transition-all duration-200 bg-white"
                      >
                        <option value={1}>1 - Muito Difícil</option>
                        <option value={2}>2 - Difícil</option>
                        <option value={3}>3 - Média</option>
                        <option value={4}>4 - Fácil</option>
                        <option value={5}>5 - Muito Fácil</option>
                      </select>
                    </div>
                  </div>

                  {/* Nota de Priorização - Calculada automaticamente */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Nota de Priorização (calculada automaticamente):
                      </span>
                      <span className="text-lg font-bold text-blue-900">
                        {((formData.business_importance * formData.implementation_urgency) / formData.implementation_ease).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Fórmula: (Importância × Urgência) ÷ Facilidade
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4 pt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 text-sm font-medium text-[#373435] bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#373435]/20 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 border border-transparent rounded-2xl hover:from-[#EBA500]/90 hover:to-[#EBA500]/80 focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md"
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
      </div>
    </div>
  )
}

export default ProcessEvaluationForm