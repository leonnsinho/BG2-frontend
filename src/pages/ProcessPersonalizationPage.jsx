import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProcessPersonalization } from '../components/ProcessPersonalization'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'

export default function ProcessPersonalizationPage() {
  const { processId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [process, setProcess] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const companyId = profile?.user_companies?.[0]?.companies?.id || '00000000-0000-0000-0000-000000000001'

  useEffect(() => {
    if (processId) {
      loadProcess()
    }
  }, [processId])

  const loadProcess = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          journeys (
            id,
            name,
            slug,
            description
          )
        `)
        .eq('id', processId)
        .single()

      if (error) throw error

      setProcess(data)
    } catch (error) {
      console.error('Erro ao carregar processo:', error)
      toast.error('Erro ao carregar dados do processo')
      navigate('/process-management')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (evaluationData) => {
    toast.success('Personalização salva com sucesso!')
    // Opcional: navegar de volta ou para próximo processo
  }

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!process) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">
            Processo não encontrado
          </h2>
          <p className="mt-2 text-gray-600">
            O processo solicitado não foi encontrado ou você não tem permissão para acessá-lo.
          </p>
          <Link
            to="/process-management"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Voltar à Gestão de Processos
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/process-management" className="text-gray-400 hover:text-gray-500">
                Gestão de Processos
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-gray-900 font-medium">
              Personalizar Processo
            </li>
          </ol>
        </nav>

        {/* Informações do Processo */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {process.name}
                </h1>
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {process.code}
                </span>
              </div>
              
              {process.description && (
                <p className="mt-2 text-gray-600">
                  {process.description}
                </p>
              )}

              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Jornada:</span>{' '}
                  <Link 
                    to={`/matriz-bossa/${process.journeys.slug}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {process.journeys.name}
                  </Link>
                </div>
                <div>
                  <span className="font-medium">Categoria:</span> {process.category}
                </div>
                <div>
                  <span className="font-medium">Peso:</span> {process.weight}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                to={`/matriz-bossa/${process.journeys.slug}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Ver na Matriz Bossa
              </Link>
              <Link
                to="/process-management"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Voltar à Lista
              </Link>
            </div>
          </div>
        </div>

        {/* Componente de Personalização */}
        {companyId ? (
          <ProcessPersonalization
            processId={processId}
            companyId={companyId}
            onSave={handleSave}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Empresa não identificada
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Não foi possível identificar a empresa associada ao seu perfil. 
                    Verifique suas configurações ou entre em contato com o administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ajuda e Orientações */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Como usar a personalização de processos
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Tem/Usa processo:</strong> Indique se sua empresa já implementou este processo</li>
                  <li><strong>Observações:</strong> Descreva como funciona na prática, desafios e oportunidades</li>
                  <li><strong>Importância:</strong> Qual a relevância deste processo para seu negócio (1-5)</li>
                  <li><strong>Urgência:</strong> Quão urgente é implementar/melhorar este processo (1-5)</li>
                  <li><strong>Facilidade:</strong> Quão fácil seria implementar/melhorar este processo (1-5)</li>
                  <li><strong>Nota de Priorização:</strong> Calculada automaticamente com base nos critérios acima</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}