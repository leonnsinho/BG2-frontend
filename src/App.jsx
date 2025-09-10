import React from 'react'
import { CheckCircle, Users, BarChart3, Target, Zap } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Partimap</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">Dashboard</a>
              <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">Jornadas</a>
              <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">Relatórios</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Gestão <span className="text-primary-600">Partimap</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plataforma completa para digitalizar e automatizar a metodologia das 5 Jornadas de Gestão da Matriz Bossa
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Projeto Iniciado</h3>
                <p className="text-sm text-gray-600">Setup completo</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Equipe</h3>
                <p className="text-sm text-gray-600">2 Desenvolvedores</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fase Atual</h3>
                <p className="text-sm text-gray-600">Fundação Técnica</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Marco 1</h3>
                <p className="text-sm text-gray-600">Design System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso da Fase 1</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Setup do Projeto</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-success-600 h-2 rounded-full w-full"></div>
                </div>
                <span className="text-sm text-success-600 font-medium">100%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Estrutura de Pastas</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-success-600 h-2 rounded-full w-full"></div>
                </div>
                <span className="text-sm text-success-600 font-medium">100%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tailwind CSS</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-success-600 h-2 rounded-full w-full"></div>
                </div>
                <span className="text-sm text-success-600 font-medium">100%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Configuração Supabase</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-warning-500 h-2 rounded-full w-1/3"></div>
                </div>
                <span className="text-sm text-warning-600 font-medium">Próximo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-primary-50 rounded-lg border border-primary-200">
          <h4 className="text-lg font-semibold text-primary-900 mb-2">
            Próximos Passos - DIA 1
          </h4>
          <ul className="text-primary-800 space-y-1">
            <li>• ✅ Criar projeto Vite + React + Tailwind</li>
            <li>• ✅ Configurar estrutura de pastas</li>
            <li>• 🔄 Configurar Supabase (criar projeto, tabelas básicas)</li>
            <li>• ⏳ Setup do Git e primeiro deploy no Netlify</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default App
