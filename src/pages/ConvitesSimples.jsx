import React, { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'user', label: 'Usuário', description: 'Acesso básico ao sistema' },
  { value: 'company_admin', label: 'Administrador', description: 'Gerencia a empresa e usuários' },
  { value: 'gestor', label: 'Gestor', description: 'Acesso a relatórios e gestão' }
]

export default function ConvitesSimples() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  // Buscar empresas ao carregar o componente
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('❌ Erro ao buscar empresas:', error)
        toast.error('Erro ao carregar empresas')
        return
      }

      setCompanies(data || [])
      console.log('✅ Empresas carregadas:', data)
      
    } catch (error) {
      console.error('❌ Erro geral ao buscar empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !companyId) {
      toast.error('Preencha todos os campos')
      return
    }

    // Buscar nome da empresa selecionada
    const selectedCompany = companies.find(company => company.id === companyId)
    if (!selectedCompany) {
      toast.error('Empresa não encontrada')
      return
    }

    setLoading(true)
    
    try {
      console.log('🚀 Criando convite:', { email, role, companyId, companyName: selectedCompany.name })
      
      // Criar usuário SEM senha - será definida no primeiro acesso
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'temp123456', // Senha temporária que será trocada
        options: {
          data: {
            company_id: companyId,
            company_name: selectedCompany.name,
            role: role,
            invited: true,
            invited_at: new Date().toISOString(),
            first_login: true // Indica que precisa trocar senha
          },
          emailRedirectTo: `${window.location.origin}/accept-invite`
        }
      })

      if (error) {
        console.error('❌ Erro ao criar usuário:', error)
        throw error
      }

      console.log('✅ Usuário criado:', data)
      
      toast.success(`✅ Convite enviado para ${email}! Usuário receberá email para definir senha.`)
      
      // Limpar formulário
      setEmail('')
      setCompanyId('')
      setRole('user')
      
    } catch (error) {
      console.error('❌ Erro geral:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Convidar Usuário</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email do usuário
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@empresa.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Empresa
          </label>
          {loadingCompanies ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              Carregando empresas...
            </div>
          ) : (
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione uma empresa</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
          {companies.length === 0 && !loadingCompanies && (
            <p className="mt-1 text-sm text-red-600">
              Nenhuma empresa encontrada. Crie uma empresa primeiro.
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nível de Acesso
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ROLES.map(roleOption => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label} - {roleOption.description}
              </option>
            ))}
          </select>
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={loading || loadingCompanies || companies.length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enviando...' : 'Enviar Convite'}
        </button>
      </form>

      {/* Info */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">🎯 Novo Fluxo Simplificado:</h3>
        <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
          <li>Sistema cria conta e envia email de confirmação</li>
          <li>Usuário clica no link do email</li>
          <li>É redirecionado para definir sua própria senha</li>
          <li>Faz login automaticamente e acessa o sistema</li>
          <li>Já está associado à empresa escolhida</li>
        </ol>
        <p className="text-xs text-green-600 mt-2">
          ✅ Usuário não precisa de senha temporária - define a própria!
        </p>
      </div>
    </div>
  )
}