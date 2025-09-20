import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import UnlinkedUserMessage from '../components/common/UnlinkedUserMessage'
import { Target, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'

export default function AssignedGoalsPage() {
  const { profile, isUnlinkedUser } = useAuth()
  const permissions = usePermissions()

  // Se é usuário não vinculado, mostrar mensagem
  if (isUnlinkedUser()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Botão para voltar ao dashboard */}
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Metas Atribuídas
            </h1>
            <p className="text-gray-600">
              Visualize e acompanhe as metas atribuídas a você pelos processos das jornadas.
            </p>
          </div>

          <UnlinkedUserMessage />

          {/* Área de preview para quando houver metas */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhuma meta atribuída
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Após a vinculação da sua conta, as metas dos processos das jornadas serão exibidas aqui para acompanhamento.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Para usuários vinculados (implementação futura)
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Botão para voltar ao dashboard */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Metas Atribuídas
          </h1>
          <p className="text-gray-600">
            Acompanhe suas metas dos processos das jornadas.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Sistema de Metas em Desenvolvimento
            </h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              Em breve você poderá visualizar e acompanhar todas as suas metas atribuídas pelos processos das jornadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}