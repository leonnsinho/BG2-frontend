import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function EmpresaInativaPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Empresa offline
        </h1>

        {/* Mensagem */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          O acesso à plataforma está suspenso para esta empresa.
          Entre em contato com o administrador.
        </p>

        {/* Ações */}
        <div className="flex items-center justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
