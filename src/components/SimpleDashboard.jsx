import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

export function SimpleDashboard() {
  const { user, profile, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // O redirecionamento acontecerá automaticamente via AuthContext
      window.location.href = '/login'
    } catch (error) {
      console.error('Erro no logout:', error)
      alert('Erro ao fazer logout: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Não autenticado</h2>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Fazer Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Dashboard BG2
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Informações do Usuário
              </h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Criado em:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                Perfil
              </h2>
              {profile ? (
                <>
                  <p><strong>Nome:</strong> {profile.full_name || 'Não informado'}</p>
                  <p><strong>Role:</strong> {profile.role}</p>
                  <p><strong>Telefone:</strong> {profile.phone || 'Não informado'}</p>
                </>
              ) : (
                <div className="text-orange-600">
                  <p><strong>⚠️ Perfil não encontrado</strong></p>
                  <p className="text-sm mt-2">
                    Este usuário não possui perfil na tabela profiles. 
                    Execute os scripts SQL para criar o perfil.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 text-center space-x-4">
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              🔓 Logout
            </button>
            
            <a
              href="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
            >
              🔑 Ir para Login
            </a>
            
            <a
              href="/register"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 inline-block"
            >
              📝 Ir para Cadastro
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
