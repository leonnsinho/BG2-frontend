import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/useAuth'
import { supabase } from '../../services/supabase'
import { 
  Building2, 
  Grid3x3, 
  Search, 
  Users, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'

const MatrizBossaPage = () => {
  const { profile } = useAuth()
  const permissions = usePermissions()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Verificar se é super admin
  useEffect(() => {
    if (!permissions.isSuperAdmin()) {
      toast.error('Acesso negado. Apenas Super Admins podem acessar a Matriz Bossa.')
      return
    }

    loadCompanies()
    
    // Verificar se há empresa salva no localStorage
    const savedCompany = localStorage.getItem('matriz-bossa-selected-company')
    if (savedCompany) {
      try {
        setSelectedCompany(JSON.parse(savedCompany))
      } catch (error) {
        localStorage.removeItem('matriz-bossa-selected-company')
      }
    }
  }, [permissions])

  const loadCompanies = async () => {
    try {
      setLoading(true)
      
      const { data: companiesData, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          slug,
          status,
          created_at,
          user_companies!inner(
            user_id,
            role,
            is_active
          )
        `)
        .eq('status', 'active')
        .order('name')

      if (error) throw error

      // Processar dados para incluir contagem de usuários
      const processedCompanies = companiesData?.map(company => ({
        ...company,
        userCount: company.user_companies?.length || 0,
        activeUsers: company.user_companies?.filter(uc => uc.is_active)?.length || 0
      })) || []

      setCompanies(processedCompanies)
      console.log('✅ Empresas carregadas para Matriz Bossa:', processedCompanies.length)
      
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error.message)
      toast.error('Erro ao carregar empresas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCompanySelect = (company) => {
    setSelectedCompany(company)
    localStorage.setItem('matriz-bossa-selected-company', JSON.stringify(company))
    toast.success(`Empresa "${company.name}" selecionada para gestão da Matriz Bossa`)
  }

  const handleJourneyClick = (jornada) => {
    if (!selectedCompany) {
      toast.error('Selecione uma empresa primeiro')
      return
    }

    // Salvar empresa selecionada e navegar para a jornada
    localStorage.setItem('matriz-bossa-selected-company', JSON.stringify(selectedCompany))
    navigate(`/matriz-bossa/${jornada.id}?empresa=${selectedCompany.id}`)
  }

  const handleChangeCompany = () => {
    setSelectedCompany(null)
    localStorage.removeItem('matriz-bossa-selected-company')
  }

  // Filtrar empresas baseado no termo de busca
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // As 5 jornadas da Matriz Bossa
  const jornadas = [
    {
      id: 'descoberta',
      name: 'Descoberta',
      description: 'Identificar oportunidades, problemas e necessidades do mercado',
      icon: Search,
      color: 'blue',
      status: 'pending'
    },
    {
      id: 'definicao',
      name: 'Definição',
      description: 'Definir estratégia, objetivos e escopo do projeto',
      icon: Target,
      color: 'purple',
      status: 'pending'
    },
    {
      id: 'desenvolver',
      name: 'Desenvolver',
      description: 'Criar, construir e implementar soluções',
      icon: Grid3x3,
      color: 'green',
      status: 'pending'
    },
    {
      id: 'deploy',
      name: 'Deploy',
      description: 'Lançar, testar e validar no mercado',
      icon: TrendingUp,
      color: 'orange',
      status: 'pending'
    },
    {
      id: 'difundir',
      name: 'Difundir',
      description: 'Escalar, distribuir e expandir a solução',
      icon: Users,
      color: 'red',
      status: 'pending'
    }
  ]

  if (!permissions.isSuperAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Apenas Super Admins podem acessar a Matriz Bossa.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <Grid3x3 className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Matriz Bossa</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie as 5 jornadas estratégicas das empresas
                </p>
              </div>
            </div>
          </div>
        </div>

        {!selectedCompany ? (
          /* Seleção de Empresa */
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Selecionar Empresa</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Tente buscar por outro termo.' : 'Não há empresas ativas no sistema.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCompanies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-900">
                              {company.name}
                            </h3>
                            <p className="text-sm text-gray-500">@{company.slug}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500" />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{company.activeUsers} usuários ativos</span>
                        </div>
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span>Ativa</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dashboard das Jornadas */
          <div className="space-y-6">
            {/* Empresa Selecionada */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                      <p className="text-sm text-gray-600">Gestão das 5 Jornadas da Matriz Bossa</p>
                    </div>
                  </div>
                  <button
                    onClick={handleChangeCompany}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Trocar Empresa
                  </button>
                </div>
              </div>
            </div>

            {/* Grid das Jornadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {jornadas.map((jornada) => {
                const getColorClasses = (color) => {
                  const colorMap = {
                    blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
                    purple: 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100',
                    green: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100',
                    orange: 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100',
                    red: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  }
                  return colorMap[color] || colorMap.blue
                }

                return (
                  <div
                    key={jornada.id}
                    onClick={() => handleJourneyClick(jornada)}
                    className={cn(
                      "border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105",
                      getColorClasses(jornada.color)
                    )}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <jornada.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{jornada.name}</h3>
                      <p className="text-sm opacity-75 mb-4">{jornada.description}</p>
                      
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-1 opacity-50" />
                        <span className="text-xs uppercase tracking-wider font-medium">
                          Pendente
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Estatísticas Resumidas */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Resumo da Empresa</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedCompany.activeUsers}</div>
                    <div className="text-sm text-gray-600">Usuários Ativos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">5</div>
                    <div className="text-sm text-gray-600">Jornadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">0%</div>
                    <div className="text-sm text-gray-600">Progresso Geral</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">Ativa</div>
                    <div className="text-sm text-gray-600">Status</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MatrizBossaPage