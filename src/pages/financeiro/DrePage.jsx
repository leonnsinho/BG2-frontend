import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  BarChart3
} from 'lucide-react'

export default function DrePage() {
  const { profile } = useAuth()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Dados de exemplo - substituir por dados reais
  const dreData = {
    receitaBruta: 1000000,
    deducoes: 150000,
    receitaLiquida: 850000,
    custos: 400000,
    lucroBruto: 450000,
    despesasOperacionais: 250000,
    lucroOperacional: 200000,
    despesasFinanceiras: 30000,
    receitasFinanceiras: 10000,
    lucroAntesImpostos: 180000,
    impostos: 45000,
    lucroLiquido: 135000
  }

  const margemLiquida = ((dreData.lucroLiquido / dreData.receitaBruta) * 100).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#373435] flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              DRE - Demonstração do Resultado
            </h1>
            <p className="text-gray-600 mt-2">
              Análise detalhada dos resultados financeiros
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

        {/* Cards de Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border-2 border-green-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border-2 border-green-200">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Lucro Líquido</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(dreData.lucroLiquido)}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl border-2 border-blue-200">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Margem Líquida</p>
            <p className="text-3xl font-bold text-blue-600">
              {margemLiquida}%
            </p>
          </div>
        </div>

        {/* DRE Detalhada */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b-2 border-gray-100">
            <h2 className="text-xl font-bold text-[#373435]">
              Demonstração Detalhada
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Receita Bruta */}
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <span className="font-bold text-gray-900">Receita Bruta</span>
              <span className="font-bold text-green-600">{formatCurrency(dreData.receitaBruta)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(-) Deduções e Abatimentos</span>
              <span className="text-red-600">({formatCurrency(dreData.deducoes)})</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <span className="font-bold text-gray-900">(=) Receita Líquida</span>
              <span className="font-bold text-blue-600">{formatCurrency(dreData.receitaLiquida)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(-) Custos dos Produtos/Serviços</span>
              <span className="text-red-600">({formatCurrency(dreData.custos)})</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <span className="font-bold text-gray-900">(=) Lucro Bruto</span>
              <span className="font-bold text-purple-600">{formatCurrency(dreData.lucroBruto)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(-) Despesas Operacionais</span>
              <span className="text-red-600">({formatCurrency(dreData.despesasOperacionais)})</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
              <span className="font-bold text-gray-900">(=) Lucro Operacional</span>
              <span className="font-bold text-orange-600">{formatCurrency(dreData.lucroOperacional)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(-) Despesas Financeiras</span>
              <span className="text-red-600">({formatCurrency(dreData.despesasFinanceiras)})</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(+) Receitas Financeiras</span>
              <span className="text-green-600">{formatCurrency(dreData.receitasFinanceiras)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-xl border-2 border-indigo-200">
              <span className="font-bold text-gray-900">(=) Lucro Antes dos Impostos</span>
              <span className="font-bold text-indigo-600">{formatCurrency(dreData.lucroAntesImpostos)}</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-700">(-) Impostos sobre Lucro</span>
              <span className="text-red-600">({formatCurrency(dreData.impostos)})</span>
            </div>

            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <span className="font-bold text-white text-lg">(=) LUCRO LÍQUIDO</span>
              <span className="font-bold text-white text-2xl">{formatCurrency(dreData.lucroLiquido)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
