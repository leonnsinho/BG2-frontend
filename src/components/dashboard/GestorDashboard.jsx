import React, { useState, useEffect } from 'react'
import { Users, CheckCircle2, Clock, BarChart3, TrendingUp, Filter } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

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

  // Cards de métricas
  const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  // Gráfico simples de barras (simulado)
  const SimpleChart = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progresso Semanal</h3>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>
      <div className="space-y-4">
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, index) => {
          const altura = Math.random() * 100 + 20 // Simulação de dados
          return (
            <div key={dia} className="flex items-center space-x-3">
              <span className="w-16 text-sm text-gray-600">{dia}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#EBA500] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${altura}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-8">{Math.round(altura)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Gestor */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {profile?.full_name || profile?.first_name || profile?.name || 'Gestor'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeCompany?.companies?.name || activeCompany?.name || 'Sua Empresa'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={filtroTarefas}
              onChange={(e) => setFiltroTarefas(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EBA500]"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Usuários Ativos"
          value={usuariosAtivos}
          icon={Users}
          color="bg-blue-500"
          subtitle={`Na empresa ${activeCompany?.companies?.name || 'atual'}`}
        />
        
        <MetricCard
          title="Tarefas em Processo"
          value={tarefasEmProcesso}
          icon={Clock}
          color="bg-orange-500"
          subtitle="Em andamento"
        />
        
        <MetricCard
          title="Tarefas Concluídas"
          value={tarefasConcluidas}
          icon={CheckCircle2}
          color="bg-green-500"
          subtitle={filtroTarefas === 'semana' ? 'Esta semana' : 'Este mês'}
        />
      </div>

      {/* Gráficos e Visualizações */}
      <div className="grid grid-cols-1 gap-6">
        {/* Gráfico de Progresso */}
        <SimpleChart />
      </div>

      {/* Seção de Estatísticas Detalhadas */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Detalhadas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">87%</div>
            <div className="text-sm text-gray-500">Taxa de Conclusão</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">23</div>
            <div className="text-sm text-gray-500">Tarefas Hoje</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">5.2</div>
            <div className="text-sm text-gray-500">Média Diária</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">12</div>
            <div className="text-sm text-gray-500">Usuários Ativos Hoje</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GestorDashboard }