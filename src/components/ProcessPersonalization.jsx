import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

// Componente para avaliar/personalizar processos individuais
export function ProcessPersonalization({ processId, companyId, onSave }) {
  const { profile } = useAuth()
  const [evaluation, setEvaluation] = useState({
    has_process: null,
    observations: '',
    business_importance: null,
    implementation_urgency: null,
    implementation_ease: null,
    priority_score: null
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carregar avaliação existente
  useEffect(() => {
    if (processId && companyId) {
      loadEvaluation()
    }
  }, [processId, companyId])

  const loadEvaluation = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('process_evaluations')
        .select('*')
        .eq('process_id', processId)
        .eq('company_id', companyId)
        .is('diagnosis_id', null) // Avaliação geral, não de diagnóstico específico
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setEvaluation({
          has_process: data.has_process,
          observations: data.observations || '',
          business_importance: data.business_importance,
          implementation_urgency: data.implementation_urgency,
          implementation_ease: data.implementation_ease,
          priority_score: data.priority_score
        })
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error)
      toast.error('Erro ao carregar dados do processo')
    } finally {
      setLoading(false)
    }
  }

  const saveEvaluation = async () => {
    if (!profile?.id) {
      toast.error('Usuário não autenticado')
      return
    }

    setSaving(true)
    try {
      const evaluationData = {
        company_id: companyId,
        process_id: processId,
        has_process: evaluation.has_process,
        observations: evaluation.observations.trim() || null,
        business_importance: evaluation.business_importance,
        implementation_urgency: evaluation.implementation_urgency,
        implementation_ease: evaluation.implementation_ease,
        evaluator_id: profile.id,
        evaluated_at: new Date().toISOString()
      }

      // Usar upsert para inserir ou atualizar
      const { data, error } = await supabase
        .from('process_evaluations')
        .upsert(evaluationData, {
          onConflict: 'company_id,process_id',
          ignoreDuplicates: false
        })
        .select('*')
        .single()

      if (error) throw error

      // Atualizar estado com dados retornados (incluindo priority_score calculado)
      setEvaluation(prev => ({
        ...prev,
        priority_score: data.priority_score
      }))

      toast.success('Avaliação salva com sucesso!')
      onSave?.(data)

    } catch (error) {
      console.error('Erro ao salvar avaliação:', error)
      toast.error('Erro ao salvar avaliação: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (field, value) => {
    setEvaluation(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getPriorityLabel = (score) => {
    if (!score) return 'Não calculada'
    if (score >= 4.0) return 'Alta Prioridade'
    if (score >= 3.0) return 'Média Prioridade'
    if (score >= 2.0) return 'Baixa Prioridade'
    return 'Muito Baixa Prioridade'
  }

  const getPriorityColor = (score) => {
    if (!score) return 'text-gray-500'
    if (score >= 4.0) return 'text-red-600'
    if (score >= 3.0) return 'text-yellow-600'
    if (score >= 2.0) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold text-gray-900">
        Personalização do Processo
      </h3>

      {/* Tem/Usa o processo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tem/Usa este processo?
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="has_process"
              value="true"
              checked={evaluation.has_process === true}
              onChange={(e) => handleFieldChange('has_process', true)}
              className="form-radio"
            />
            <span className="ml-2">Sim, temos/usamos</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="has_process"
              value="false"
              checked={evaluation.has_process === false}
              onChange={(e) => handleFieldChange('has_process', false)}
              className="form-radio"
            />
            <span className="ml-2">Não temos/não usamos</span>
          </label>
        </div>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          value={evaluation.observations}
          onChange={(e) => handleFieldChange('observations', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Descreva como o processo funciona na empresa, desafios, oportunidades..."
        />
      </div>

      {/* Escalas de Avaliação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Importância para Empresa */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Importância para Empresa
          </label>
          <select
            value={evaluation.business_importance || ''}
            onChange={(e) => handleFieldChange('business_importance', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="1">1 - Muito Baixa</option>
            <option value="2">2 - Baixa</option>
            <option value="3">3 - Média</option>
            <option value="4">4 - Alta</option>
            <option value="5">5 - Muito Alta</option>
          </select>
        </div>

        {/* Urgência para Realização */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Urgência para Realização
          </label>
          <select
            value={evaluation.implementation_urgency || ''}
            onChange={(e) => handleFieldChange('implementation_urgency', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="1">1 - Muito Baixa</option>
            <option value="2">2 - Baixa</option>
            <option value="3">3 - Média</option>
            <option value="4">4 - Alta</option>
            <option value="5">5 - Muito Alta</option>
          </select>
        </div>

        {/* Facilidade para Implementar */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Facilidade para Implementar
          </label>
          <select
            value={evaluation.implementation_ease || ''}
            onChange={(e) => handleFieldChange('implementation_ease', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="1">1 - Muito Difícil</option>
            <option value="2">2 - Difícil</option>
            <option value="3">3 - Médio</option>
            <option value="4">4 - Fácil</option>
            <option value="5">5 - Muito Fácil</option>
          </select>
        </div>
      </div>

      {/* Nota de Priorização */}
      {evaluation.priority_score && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Nota de Priorização Calculada:
            </span>
            <div className="text-right">
              <span className="text-lg font-bold">
                {evaluation.priority_score}
              </span>
              <span className={`block text-sm ${getPriorityColor(evaluation.priority_score)}`}>
                {getPriorityLabel(evaluation.priority_score)}
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Cálculo: Importância × 40% + Urgência × 40% + Facilidade × 20%
          </div>
        </div>
      )}

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          onClick={saveEvaluation}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium"
        >
          {saving ? 'Salvando...' : 'Salvar Avaliação'}
        </button>
      </div>
    </div>
  )
}

// Hook para usar avaliações de processos
export function useProcessEvaluations(companyId) {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)

  const loadEvaluations = async () => {
    if (!companyId) {
      setEvaluations([])
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Loading evaluations for company:', companyId)

      // Primeiro, buscar todos os processos disponíveis
      const { data: processesData, error: processesError } = await supabase
        .from('processes')
        .select(`
          id,
          name,
          code,
          category,
          weight,
          journeys (
            id,
            name,
            slug
          )
        `)
        .order('name')

      if (processesError) {
        console.error('Erro ao buscar processos:', processesError)
        throw processesError
      }

      console.log('📋 Processes found:', processesData?.length || 0)

      // Em seguida, buscar as avaliações existentes para esta empresa
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('process_evaluations')
        .select('*')
        .eq('company_id', companyId)
        .is('diagnosis_id', null)

      if (evaluationsError) {
        console.error('Erro ao buscar avaliações:', evaluationsError)
        // Não falhar se não houver avaliações, apenas continuar
      }

      console.log('📊 Existing evaluations found:', evaluationsData?.length || 0)

      // Combinar processos com avaliações existentes
      const combinedData = processesData.map(process => {
        const existingEvaluation = evaluationsData?.find(evaluation => evaluation.process_id === process.id)
        
        return {
          id: existingEvaluation?.id || `temp-${process.id}`,
          process_id: process.id,
          company_id: companyId,
          has_process: existingEvaluation?.has_process || null,
          observations: existingEvaluation?.observations || null,
          business_importance: existingEvaluation?.business_importance || null,
          implementation_urgency: existingEvaluation?.implementation_urgency || null,
          implementation_ease: existingEvaluation?.implementation_ease || null,
          priority_score: existingEvaluation?.priority_score || null,
          evaluator_id: existingEvaluation?.evaluator_id || null,
          evaluated_at: existingEvaluation?.evaluated_at || null,
          created_at: existingEvaluation?.created_at || null,
          updated_at: existingEvaluation?.updated_at || null,
          processes: process
        }
      })

      // Ordenar por priority_score (maior primeiro), depois por nome
      const sortedData = combinedData.sort((a, b) => {
        if (a.priority_score !== null && b.priority_score !== null) {
          return b.priority_score - a.priority_score
        }
        if (a.priority_score !== null) return -1
        if (b.priority_score !== null) return 1
        return a.processes.name.localeCompare(b.processes.name)
      })

      console.log('✅ Combined data prepared:', sortedData.length, 'items')
      setEvaluations(sortedData)

    } catch (error) {
      console.error('❌ Erro ao carregar avaliações:', error)
      setEvaluations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvaluations()
  }, [companyId])

  return {
    evaluations,
    loading,
    reload: loadEvaluations
  }
}