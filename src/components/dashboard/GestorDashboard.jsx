import React, { useState, useEffect } from 'react'
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp, Filter, Building2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabase'

const GestorDashboard = () => {
  const { profile } = useAuth()
  const [filtroTarefas, setFiltroTarefas] = useState('semana') // semana ou mes
  const [usuariosAtivos, setUsuariosAtivos] = useState(0)
  const [tarefasEmProcesso, setTarefasEmProcesso] = useState(0)
  const [tarefasConcluidas, setTarefasConcluidas] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    tarefasHoje: 0,
    taxaConclusao: 0,
    mediaDiaria: 0,
    ativosHoje: 0,
    progressoSemanal: []
  })

  // Carregar avatar do perfil
  useEffect(() => {
    const loadAvatar = async () => {
      if (!profile?.id) return

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', profile.id)
          .single()

        if (profileError) throw profileError

        if (profileData?.avatar_url) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('profile-avatars')
            .createSignedUrl(profileData.avatar_url, 3600)

          if (!urlError && urlData?.signedUrl) {
            setAvatarUrl(urlData.signedUrl)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar avatar:', error)
      }
    }

    loadAvatar()
  }, [profile?.id])

  // Carregar nome e logo da empresa
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!profile?.id) return

      try {
        const { data, error } = await supabase
          .from('user_companies')
          .select('companies(name, logo_url)')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)

        if (error) throw error
        if (data && data.length > 0 && data[0].companies) {
          const company = data[0].companies
          setCompanyName(company.name)
          
          // Carregar logo se existir
          if (company.logo_url) {
            try {
              const { data: logoData, error: logoError } = await supabase.storage
                .from('company-avatars')
                .createSignedUrl(company.logo_url, 3600)

              if (!logoError && logoData?.signedUrl) {
                setCompanyLogo(logoData.signedUrl)
              }
            } catch (logoError) {
              console.error('Erro ao carregar logo:', logoError)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar empresa:', error)
      }
    }

    loadCompanyData()
  }, [profile?.id])

  // Buscar dados reais do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!profile?.id) return

      try {
        setLoading(true)

        // Buscar company_id do usuário
        const { data: userCompanyData, error: ucError } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', profile.id)
          .eq('is_active', true)
          .limit(1)

        if (ucError) throw ucError
        if (!userCompanyData || userCompanyData.length === 0) {
          setLoading(false)
          return
        }

        const companyId = userCompanyData[0].company_id

        // Buscar total de usuários ativos da empresa
        const { data: userCompanies, error: usersError } = await supabase
          .from('user_companies')
          .select('user_id, is_active')
          .eq('company_id', companyId)

        if (!usersError) {
          const totalAtivos = userCompanies?.filter(uc => uc.is_active).length || 0
          setUsuariosAtivos(totalAtivos)

          // Buscar tarefas da empresa
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, status, created_at, updated_at')
            .eq('company_id', companyId)

          console.log('Total de tarefas:', tasks?.length)
          console.log('Tarefas completas:', tasks?.filter(t => t.status === 'completed').length)

          if (!tasksError && tasks) {
            const now = new Date()
            const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const semanaAtras = new Date(hoje)
            semanaAtras.setDate(semanaAtras.getDate() - 7)

          // Tarefas em processo
          const emProcesso = tasks.filter(t => t.status === 'in_progress').length
          setTarefasEmProcesso(emProcesso)

          // Tarefas concluídas no período selecionado
          let dataInicio
          if (filtroTarefas === 'semana') {
            dataInicio = semanaAtras
          } else {
            dataInicio = new Date(now.getFullYear(), now.getMonth(), 1)
          }

          const concluidas = tasks.filter(t => {
            if (t.status !== 'completed') return false
            const updatedAt = new Date(t.updated_at)
            return updatedAt >= dataInicio
          }).length
          setTarefasConcluidas(concluidas)

          // Tarefas criadas hoje
          const tarefasHoje = tasks.filter(t => {
            const createdAt = new Date(t.created_at)
            return createdAt >= hoje
          }).length

          // Taxa de conclusão
          const totalTarefas = tasks.length
          const totalConcluidas = tasks.filter(t => t.status === 'completed').length
          const taxaConclusao = totalTarefas > 0 ? Math.round((totalConcluidas / totalTarefas) * 100) : 0

          // Média diária (últimos 7 dias)
          const tarefasUltimos7Dias = tasks.filter(t => {
            const createdAt = new Date(t.created_at)
            return createdAt >= semanaAtras
          }).length
          const mediaDiaria = (tarefasUltimos7Dias / 7).toFixed(1)

          // Progresso semanal (tarefas concluídas por dia nos últimos 7 dias)
          const progressoSemanal = {}
          const progressoSemanalArray = []
          const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
          
          console.log('Calculando progresso semanal...')
          console.log('Data de hoje:', hoje)
          console.log('Semana atrás:', semanaAtras)
          
          // Calcular para os últimos 7 dias (hoje + 6 dias anteriores)
          for (let i = 6; i >= 0; i--) {
            const dia = new Date(hoje)
            dia.setDate(dia.getDate() - i)
            const diaNome = diasSemana[dia.getDay()]
            const dataFormatada = `${diaNome} ${dia.getDate()}/${dia.getMonth() + 1}`
            
            const tarefasDoDia = tasks.filter(t => {
              if (t.status !== 'completed') return false
              const updatedAt = new Date(t.updated_at)
              // Comparar apenas ano, mês e dia (ignorar hora)
              const isSameDay = updatedAt.getFullYear() === dia.getFullYear() &&
                               updatedAt.getMonth() === dia.getMonth() &&
                               updatedAt.getDate() === dia.getDate()
              return isSameDay
            })

            console.log(`${dataFormatada}: ${tarefasDoDia.length} tarefas`)

            progressoSemanalArray.push({
              nome: dataFormatada,
              tarefas: tarefasDoDia.length
            })
          }

          // Calcular porcentagens para progresso semanal
          const maxTarefas = Math.max(...progressoSemanalArray.map(d => d.tarefas), 1)
          progressoSemanalArray.forEach(dia => {
            dia.porcentagem = maxTarefas > 0 ? Math.round((dia.tarefas / maxTarefas) * 100) : 0
          })

          setStats({
            tarefasHoje,
            taxaConclusao,
            mediaDiaria: parseFloat(mediaDiaria),
            ativosHoje: totalAtivos,
            progressoSemanal: progressoSemanalArray
          })
        }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [profile?.id, filtroTarefas])

  const activeCompany = profile?.user_companies?.find(uc => uc.is_active)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Cabeçalho do Gestor */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                {/* Foto de perfil */}
                {avatarUrl && (
                  <div className="relative flex-shrink-0">
                    <img 
                      src={avatarUrl} 
                      alt={profile?.full_name || 'Gestor'}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#EBA500]"
                      onError={(e) => {
                        e.target.parentElement.style.display = 'none'
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#373435] tracking-tight truncate">
                    {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Gestor'}!
                  </h1>
                  {companyName && (
                    <div className="flex items-center gap-2 mt-1 text-gray-600">
                      {companyLogo ? (
                        <img 
                          src={companyLogo} 
                          alt={companyName}
                          className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#EBA500] flex-shrink-0" />
                      )}
                      <p className="text-sm sm:text-base lg:text-lg font-medium truncate">
                        {companyName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                Gerencie sua equipe e acompanhe o progresso das tarefas
              </p>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <select 
                value={filtroTarefas}
                onChange={(e) => setFiltroTarefas(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
              >
                <option value="semana">Esta Semana</option>
                <option value="mes">Este Mês</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* Usuários Ativos */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-xs sm:text-sm font-semibold">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Usuários Ativos</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{usuariosAtivos}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Na sua empresa</p>
          </div>

          {/* Tarefas em Processo */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-orange-600 text-xs sm:text-sm font-semibold">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Em Andamento</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tarefasEmProcesso}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Tarefas ativas</p>
          </div>

          {/* Tarefas Concluídas */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Concluídas</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tarefasConcluidas}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{filtroTarefas === 'semana' ? 'Esta semana' : 'Este mês'}</p>
          </div>
        </div>

        {/* Grid com 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          
          {/* Progresso Semanal */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Progresso Semanal</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Tarefas concluídas por dia nos últimos 7 dias</p>
              </div>
            </div>
            <div className="space-y-4 mt-4 sm:mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]"></div>
                </div>
              ) : stats.progressoSemanal.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Nenhuma tarefa concluída nos últimos 7 dias</p>
                </div>
              ) : (
                stats.progressoSemanal.map((dia, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-24 text-sm font-medium text-gray-700">{dia.nome}</span>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-[#EBA500] to-[#d99500] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${dia.porcentagem}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {dia.tarefas} {dia.tarefas === 1 ? 'tarefa' : 'tarefas'} concluída{dia.tarefas === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{dia.porcentagem}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-1.5 sm:p-2 bg-[#EBA500]/10 rounded-lg flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#EBA500]" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Estatísticas Rápidas</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {loading ? (
                <div className="col-span-2 flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EBA500]"></div>
                </div>
              ) : (
                <>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">{stats.taxaConclusao}%</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Taxa de Conclusão</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">{stats.tarefasHoje}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Tarefas Hoje</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-[#EBA500]/10 to-[#EBA500]/20 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-[#EBA500] mb-1">{stats.mediaDiaria}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Média Diária</div>
                  </div>
                  <div className="text-center p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">{stats.ativosHoje}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700">Ativos Hoje</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GestorDashboard }