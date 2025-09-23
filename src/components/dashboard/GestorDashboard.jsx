import React, { useState, useEffect } from 'react'
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp, Filter } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Layout } from '../layout/Layout'
import { Sidebar } from '../layout/Sidebar'

const GestorDashboard = () => {
  const { profile } = useAuth()
  const [filtroTarefas, setFiltroTarefas] = useState('semana') // semana ou mes
  const [usuariosAtivos, setUsuariosAtivos] = useState(0)
  const [tarefasEmProcesso, setTarefasEmProcesso] = useState(0)
  const [tarefasConcluidas, setTarefasConcluidas] = useState(0)

  // Simulação de dados - depois conectar com backend
  useEffect(() => {
    // Simular busca de usuários ativos na empresa do gestor
    const fetchUsuariosAtivos = async () => {
      // TODO: Implementar consulta real ao backend
      setUsuariosAtivos(15) // Número simulado
    }

    fetchUsuariosAtivos()
  }, [profile])

  const activeCompany = profile?.user_companies?.find(uc => uc.is_active)

  // Cards de métricas com estética BG2
  const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white border-2 border-[#EBA500]/20 rounded-3xl p-8 hover:shadow-lg hover:border-[#EBA500]/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#373435]/60 uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-[#373435] mt-3">{value}</p>
          {subtitle && (
            <p className="text-sm text-[#373435]/50 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-[#EBA500]`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  )

  // Gráfico simples de barras com estética BG2
  const SimpleChart = () => (
    <div className="bg-white border-2 border-[#EBA500]/20 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-[#373435]">Progresso Semanal</h3>
          <p className="text-[#373435]/60 mt-1">Acompanhe seu desempenho diário</p>
        </div>
        <div className="w-12 h-12 bg-[#EBA500]/10 rounded-2xl flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-[#EBA500]" />
        </div>
      </div>
      <div className="space-y-6">
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
          const altura = Math.min(Math.random() * 90 + 10, 100) // Limitado a máximo 100%
          return (
            <div key={dia} className="flex items-center space-x-4">
              <span className="w-20 text-sm font-medium text-[#373435]">{dia}</span>
              <div className="flex-1 bg-[#373435]/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${altura}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-[#373435] w-12 text-right">{Math.round(altura)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <Layout sidebar={<Sidebar />}>
      <div className="min-h-screen bg-white">
        <div className="space-y-8">
          {/* Cabeçalho do Gestor com estética BG2 */}
          <div className="bg-white border-2 border-[#EBA500]/20 rounded-3xl p-8 ring-1 ring-[#EBA500]/5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#373435] mb-2">
                  Olá, {profile?.full_name || profile?.first_name || profile?.name || 'Gestor'}!
                </h1>
                <p className="text-lg text-[#373435]/60">
                  {activeCompany?.companies?.name || activeCompany?.name || 'Sua Empresa'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select 
                  value={filtroTarefas}
                  onChange={(e) => setFiltroTarefas(e.target.value)}
                  className="border-2 border-[#EBA500]/20 rounded-2xl px-4 py-3 text-sm font-medium text-[#373435] focus:outline-none focus:ring-2 focus:ring-[#EBA500] focus:border-transparent bg-white"
                >
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mês</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard
              title="Usuários Ativos"
              value={usuariosAtivos}
              icon={Users}
              subtitle={`Na empresa ${activeCompany?.companies?.name || 'atual'}`}
            />
            
            <MetricCard
              title="Tarefas em Processo"
              value={tarefasEmProcesso}
              icon={Clock}
              subtitle="Em andamento"
            />
            
            <MetricCard
              title="Tarefas Concluídas"
              value={tarefasConcluidas}
              icon={CheckCircle2}
              subtitle={filtroTarefas === 'semana' ? 'Esta semana' : 'Este mês'}
            />
          </div>

          {/* Gráficos e Visualizações */}
          <div className="grid grid-cols-1 gap-8">
            <SimpleChart />
          </div>

          {/* Seção de Estatísticas Detalhadas */}
          <div className="bg-white border-2 border-[#EBA500]/20 rounded-3xl p-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-[#EBA500] rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#373435]">Estatísticas Detalhadas</h3>
                <p className="text-[#373435]/60">Visão geral do desempenho</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">87%</div>
                <div className="text-sm font-medium text-[#373435]">Taxa de Conclusão</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                <div className="text-3xl font-bold text-green-600 mb-2">23</div>
                <div className="text-sm font-medium text-[#373435]">Tarefas Hoje</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-[#EBA500]/10 to-[#EBA500]/20 rounded-2xl">
                <div className="text-3xl font-bold text-[#EBA500] mb-2">5.2</div>
                <div className="text-sm font-medium text-[#373435]">Média Diária</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
                <div className="text-sm font-medium text-[#373435]">Usuários Ativos Hoje</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export { GestorDashboard }