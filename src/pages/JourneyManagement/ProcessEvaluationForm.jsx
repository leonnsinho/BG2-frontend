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
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
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
    responsible_user_id: null,
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

  const getRoleLabel = (role) => {
    const roleLabels = {
      'super_admin': 'Super Admin',
      'consultant': 'Consultor',
      'company_admin': 'Admin da Empresa',
      'user': 'Usuário'
    }
    return roleLabels[role] || role
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

          // Carregar usuários disponíveis
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .order('full_name')





          // Teste 3: Consulta sem RLS (usando rpc se necessário)
          try {
            const { data: rpcData, error: rpcError } = await supabase
              .rpc('get_all_profiles')
          
            console.log('� Teste 3 - RPC sem RLS:')
            console.log('   Resultado:', rpcData?.length || 0)
            console.log('   Erro:', rpcError)
          } catch (e) {
            console.log('📊 Teste 3 - RPC não disponível:', e.message)
          }

          if (profilesError) {
            console.error('Erro ao carregar usuários:', profilesError)
            setUsers([])
          } else {
            // Filtrar usuários excluindo super admins
            const filteredByRole = profilesData?.filter(user => user.role !== 'super_admin') || []
            setUsers(filteredByRole)
            setFilteredUsers(filteredByRole)
          }

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

  // Filtrar usuários baseado na busca
  useEffect(() => {
    console.log('🔍 Filtrando usuários:', { userSearchTerm, usersCount: users.length })
    if (!userSearchTerm) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    }
    console.log('🔍 Usuários filtrados:', filteredUsers.length)
  }, [userSearchTerm, users])

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="p-3 rounded-lg bg-primary-500">
                <Target className="h-6 w-6 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {evaluation ? 'Editar Avaliação' : 'Avaliar Processo'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {process.code} - {process.name}
                </p>
              </div>
            </div>
            
            {company && (
              <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>Empresa: {company.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Informações do Processo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Detalhes do Processo
              </h3>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Código</dt>
                  <dd className="text-sm text-gray-900">{process.code}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="text-sm text-gray-900">{process.name}</dd>
                </div>
                
                {process.category && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                    <dd className="text-sm text-gray-900">{process.category}</dd>
                  </div>
                )}
                
                {process.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                    <dd className="text-sm text-gray-900">{process.description}</dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Peso</dt>
                  <dd className="text-sm text-gray-900">{process.weight}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Formulário de Avaliação */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Avaliação do Processo
              </h3>
              
              <form className="space-y-6">
                {/* Score Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Atual (0-5)
                  </label>
                  <div className="flex items-center space-x-4">
                    {[0, 1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleInputChange('current_score', score)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                          formData.current_score === score
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={`text-lg font-bold ${scoreColors[score]}`}>
                          {score}
                        </span>
                        <span className="text-xs text-center mt-1">
                          {scoreLabels[score]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Meta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score Meta (0-5)
                  </label>
                  <div className="flex items-center space-x-4">
                    {[0, 1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleInputChange('target_score', score)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors ${
                          formData.target_score === score
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Star className={`h-5 w-5 ${formData.target_score === score ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-xs mt-1">{score}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notas de Avaliação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Notas da Avaliação
                  </label>
                  <textarea
                    rows={4}
                    value={formData.evaluation_notes}
                    onChange={(e) => handleInputChange('evaluation_notes', e.target.value)}
                    placeholder="Descreva a situação atual do processo..."
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                {/* Plano de Melhoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plano de Melhoria
                  </label>
                  <textarea
                    rows={4}
                    value={formData.improvement_plan}
                    onChange={(e) => handleInputChange('improvement_plan', e.target.value)}
                    placeholder="Descreva as ações para melhorar o processo..."
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Prazo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Prazo
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => handleInputChange('deadline', e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  {/* Nível de Confiança */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nível de Confiança
                    </label>
                    <select
                      value={formData.confidence_level}
                      onChange={(e) => handleInputChange('confidence_level', parseInt(e.target.value))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Sim, tem/usa</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="has_process"
                        value="false"
                        checked={formData.has_process === false}
                        onChange={() => handleInputChange('has_process', false)}
                        className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Não tem/não usa</span>
                    </label>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Adicionais
                  </label>
                  <textarea
                    rows={3}
                    value={formData.observations}
                    onChange={(e) => handleInputChange('observations', e.target.value)}
                    placeholder="Observações sobre o processo na empresa..."
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = formData.evidence_files.filter((_, i) => i !== index)
                            handleInputChange('evidence_files', newFiles)
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
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
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      + Adicionar link externo
                    </button>
                  </div>
                </div>

                {/* Seção de Priorização */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Avaliação de Prioridade
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Importância para Empresa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Importância para Empresa (1-5)
                      </label>
                      <select
                        value={formData.business_importance}
                        onChange={(e) => handleInputChange('business_importance', parseInt(e.target.value))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgência para Realização (1-5)
                      </label>
                      <select
                        value={formData.implementation_urgency}
                        onChange={(e) => handleInputChange('implementation_urgency', parseInt(e.target.value))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facilidade para Implementar (1-5)
                      </label>
                      <select
                        value={formData.implementation_ease}
                        onChange={(e) => handleInputChange('implementation_ease', parseInt(e.target.value))}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
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

                {/* Usuário Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Usuário Responsável
                    <span className="text-xs text-gray-500 ml-2">
                      (Consultores, Admins de Empresa e Usuários) - {filteredUsers.length} disponíveis
                    </span>
                  </label>
                  
                  {/* Campo de busca */}
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Buscar por email ou nome..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  
                  {/* Lista de usuários filtrados */}
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    <div className="p-2">
                      <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="radio"
                          name="responsible_user"
                          value=""
                          checked={!formData.responsible_user_id}
                          onChange={() => handleInputChange('responsible_user_id', null)}
                          className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                        />
                        <span className="text-sm text-gray-500 italic">Nenhum responsável selecionado</span>
                      </label>
                    </div>
                    
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <div key={user.id} className="p-2">
                          <label className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="radio"
                              name="responsible_user"
                              value={user.id}
                              checked={formData.responsible_user_id === user.id}
                              onChange={() => handleInputChange('responsible_user_id', user.id)}
                              className="form-radio h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 mr-3"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.full_name || 'Nome não informado'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email} • {getRoleLabel(user.role)}
                              </p>
                            </div>
                          </label>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {userSearchTerm ? 'Nenhum usuário encontrado' : 'Carregando usuários...'}
                      </div>
                    )}
                  </div>
                  
                  {/* Usuário selecionado */}
                  {formData.responsible_user_id && (
                    <div className="mt-2 p-2 bg-primary-50 rounded-md">
                      {(() => {
                        const selectedUser = users.find(u => u.id === formData.responsible_user_id)
                        return selectedUser ? (
                          <p className="text-sm text-primary-800">
                            <strong>Selecionado:</strong> {selectedUser.full_name || 'Nome não informado'} ({selectedUser.email})
                          </p>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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