import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  TrendingUp, 
  Calendar,
  Download,
  Activity
} from 'lucide-react'

export default function DfcPage() {
  const { profile } = useAuth()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Dados de exemplo - substituir por dados reais
  const dfcData = {
    // Atividades Operacionais
    lucroLiquido: 135000,
    depreciacaoAmortizacao: 20000,
    variacaoContas: -15000,
    caixaOperacional: 140000,
    
    // Atividades de Investimento
    aquisicaoAtivos: -50000,
    vendasAtivos: 10000,
    caixaInvestimento: -40000,
    
    // Atividades de Financiamento
    emprestimosObtidos: 30000,
    pagamentoEmprestimos: -20000,
    dividendos: -15000,
    caixaFinanciamento: -5000,
    
    // Variação Total
    saldoInicial: 100000,
    variacaoCaixa: 95000,
    saldoFinal: 195000
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#373435] flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              DFC - Demonstração dos Fluxos de Caixa
            </h1>
            <p className="text-gray-600 mt-2">
              Análise das movimentações de caixa por atividade
            </p>
          </div>

          <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-[#EBA500] hover:text-[#EBA500] transition-all duration-300 font-semibold">
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>

        {/* Filtro de Ano */}
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Exercício:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#EBA500] transition-colors font-medium"
            >
              {[2023, 2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card de Variação Total */}
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border-2 border-blue-200">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Variação de Caixa no Período</p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(dfcData.variacaoCaixa)}
          </p>
        </div>

        {/* DFC Detalhada */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="text-xl font-bold text-[#373435]">
              Fluxos Detalhados por Atividade
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Atividades Operacionais */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                Atividades Operacionais
              </h3>
              
              <div className="ml-4 space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Lucro Líquido do Período</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(dfcData.lucroLiquido)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Depreciação e Amortização</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(dfcData.depreciacaoAmortizacao)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Variação de Contas a Receber/Pagar</span>
                  <span className="text-red-600 font-semibold">{formatCurrency(dfcData.variacaoContas)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                  <span className="font-bold text-gray-900">Caixa Gerado pelas Operações</span>
                  <span className="font-bold text-green-600">{formatCurrency(dfcData.caixaOperacional)}</span>
                </div>
              </div>
            </div>

            {/* Atividades de Investimento */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                Atividades de Investimento
              </h3>
              
              <div className="ml-4 space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Aquisição de Ativos Fixos</span>
                  <span className="text-red-600 font-semibold">({formatCurrency(Math.abs(dfcData.aquisicaoAtivos))})</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Venda de Ativos</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(dfcData.vendasAtivos)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <span className="font-bold text-gray-900">Caixa Usado em Investimentos</span>
                  <span className="font-bold text-purple-600">{formatCurrency(dfcData.caixaInvestimento)}</span>
                </div>
              </div>
            </div>

            {/* Atividades de Financiamento */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                Atividades de Financiamento
              </h3>
              
              <div className="ml-4 space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Empréstimos Obtidos</span>
                  <span className="text-green-600 font-semibold">{formatCurrency(dfcData.emprestimosObtidos)}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Pagamento de Empréstimos</span>
                  <span className="text-red-600 font-semibold">({formatCurrency(Math.abs(dfcData.pagamentoEmprestimos))})</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">Pagamento de Dividendos</span>
                  <span className="text-red-600 font-semibold">({formatCurrency(Math.abs(dfcData.dividendos))})</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <span className="font-bold text-gray-900">Caixa de Financiamento</span>
                  <span className="font-bold text-orange-600">{formatCurrency(dfcData.caixaFinanciamento)}</span>
                </div>
              </div>
            </div>

            {/* Resumo Final */}
            <div className="pt-4 border-t-2 border-gray-200 space-y-3">
              <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl">
                <span className="font-semibold text-gray-700">Saldo Inicial de Caixa</span>
                <span className="font-semibold text-gray-900">{formatCurrency(dfcData.saldoInicial)}</span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <span className="font-semibold text-gray-700">Variação Líquida de Caixa</span>
                <span className="font-semibold text-blue-600">{formatCurrency(dfcData.variacaoCaixa)}</span>
              </div>
              
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <span className="font-bold text-white text-lg">Saldo Final de Caixa</span>
                <span className="font-bold text-white text-2xl">{formatCurrency(dfcData.saldoFinal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
