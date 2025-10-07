import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function FluxoCaixaPage() {
  const { profile } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Dados de exemplo - substituir por dados reais do Supabase
  const mockTransactions = [
    {
      id: 1,
      date: '2025-10-01',
      description: 'Receita de Vendas',
      type: 'entrada',
      amount: 50000,
      category: 'Vendas'
    },
    {
      id: 2,
      date: '2025-10-03',
      description: 'Pagamento de Fornecedor',
      type: 'saida',
      amount: 15000,
      category: 'Fornecedores'
    },
    {
      id: 3,
      date: '2025-10-05',
      description: 'Salários',
      type: 'saida',
      amount: 25000,
      category: 'Pessoal'
    },
    {
      id: 4,
      date: '2025-10-07',
      description: 'Receita de Serviços',
      type: 'entrada',
      amount: 30000,
      category: 'Serviços'
    }
  ]

  const calculateSummary = () => {
    const entradas = mockTransactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const saidas = mockTransactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const saldo = entradas - saidas

    return { entradas, saidas, saldo }
  }

  const summary = calculateSummary()

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#373435] flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              Fluxo de Caixa
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie as entradas e saídas financeiras da empresa
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#EBA500] hover:text-[#EBA500] transition-all duration-300 font-semibold">
              <Download className="w-5 h-5" />
              Exportar
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#EBA500] to-[#EBA500]/90 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-semibold">
              <Plus className="w-5 h-5" />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Período:</span>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors font-medium"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors font-medium"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Entradas */}
          <div className="bg-white rounded-3xl p-6 border-2 border-green-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border-2 border-green-200">
                <ArrowUpRight className="w-6 h-6 text-green-600" />
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-xl text-xs font-bold">
                ENTRADAS
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-1">
              {formatCurrency(summary.entradas)}
            </p>
            <p className="text-sm text-gray-600">Total de receitas no período</p>
          </div>

          {/* Saídas */}
          <div className="bg-white rounded-3xl p-6 border-2 border-red-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500/10 to-rose-500/10 rounded-xl border-2 border-red-200">
                <ArrowDownRight className="w-6 h-6 text-red-600" />
              </div>
              <div className="px-3 py-1 bg-red-100 text-red-700 rounded-xl text-xs font-bold">
                SAÍDAS
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 mb-1">
              {formatCurrency(summary.saidas)}
            </p>
            <p className="text-sm text-gray-600">Total de despesas no período</p>
          </div>

          {/* Saldo */}
          <div className={`bg-white rounded-3xl p-6 border-2 ${summary.saldo >= 0 ? 'border-blue-200' : 'border-orange-200'} shadow-sm hover:shadow-lg transition-all duration-300`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${summary.saldo >= 0 ? 'from-blue-500/10 to-indigo-500/10 border-blue-200' : 'from-orange-500/10 to-amber-500/10 border-orange-200'} rounded-xl border-2`}>
                <DollarSign className={`w-6 h-6 ${summary.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <div className={`px-3 py-1 ${summary.saldo >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} rounded-xl text-xs font-bold`}>
                SALDO
              </div>
            </div>
            <p className={`text-3xl font-bold ${summary.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'} mb-1`}>
              {formatCurrency(summary.saldo)}
            </p>
            <p className="text-sm text-gray-600">
              {summary.saldo >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
            </p>
          </div>
        </div>

        {/* Tabela de Transações */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="text-xl font-bold text-[#373435] flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#EBA500]" />
              Transações Recentes
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-semibold">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${
                        transaction.type === 'entrada' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {transaction.type === 'entrada' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                      transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'entrada' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
