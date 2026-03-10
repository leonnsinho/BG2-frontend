import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Settings, Clock, CheckCircle, Sparkles, Building2, ArrowLeft } from 'lucide-react'

export default function UnlinkedUserMessage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [showWaiting, setShowWaiting] = useState(false)

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'usuário'

  if (showWaiting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#EBA500]/5 to-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <button
            onClick={() => setShowWaiting(false)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </button>

          <div className="bg-white/80 backdrop-blur-sm border border-[#EBA500]/20 rounded-3xl p-8 shadow-2xl shadow-[#EBA500]/10">
            {/* Ícone animado */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 rounded-full flex items-center justify-center animate-pulse">
                  <Settings className="w-10 h-10 text-white animate-spin" style={{ animationDuration: '3s', animationTimingFunction: 'linear' }} />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-[#EBA500]/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#EBA500]/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-[#373435] mb-3">Configurando sua conta</h2>
              <p className="text-lg text-neutral-600">Estamos preparando tudo para você...</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-4 p-4 bg-white/50 rounded-2xl border border-[#EBA500]/10">
                <div className="w-8 h-8 bg-[#EBA500] rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#373435]">Conta criada com sucesso</p>
                  <p className="text-sm text-neutral-500">Suas credenciais foram verificadas</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-[#EBA500]/5 rounded-2xl border border-[#EBA500]/20">
                <div className="w-8 h-8 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#373435]">Aguardando vinculação</p>
                  <p className="text-sm text-neutral-500">Um administrador irá vincular você a uma empresa</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white opacity-50" />
                </div>
                <div>
                  <p className="font-medium text-neutral-400">Acesso completo</p>
                  <p className="text-sm text-neutral-400">Disponível após vinculação</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#EBA500]/10 to-transparent rounded-2xl p-6 border border-[#EBA500]/20">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-[#373435]">Progresso da configuração</span>
                <span className="text-[#EBA500] font-bold">66%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 rounded-full transition-all duration-1000 animate-pulse" style={{ width: '66%' }}></div>
              </div>
              <p className="text-sm text-neutral-600 mt-4">
                Sua conta foi criada com sucesso! Aguarde enquanto um administrador da sua empresa vincula seu acesso ao sistema.
              </p>
            </div>

            <div className="flex justify-center items-center mt-8">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-neutral-500">
                Este processo pode levar alguns minutos. Você será notificado quando estiver pronto.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBA500]/5 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Boas-vindas personalizadas */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/70 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#EBA500]/20">
            <span className="text-2xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#373435] mb-3">
            Olá, {firstName}! 👋
          </h1>
          <p className="text-neutral-500 text-base">
            Sua conta está pronta. Como você quer começar?
          </p>
        </div>

        {/* Duas opções */}
        <div className="space-y-4">
          {/* Criar empresa */}
          <button
            onClick={() => navigate('/criar-empresa')}
            className="w-full group bg-white border-2 border-[#EBA500]/30 hover:border-[#EBA500] rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:shadow-[#EBA500]/10 flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-[#EBA500]/10 group-hover:bg-[#EBA500]/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Building2 className="w-7 h-7 text-[#EBA500]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#373435] mb-1">Criar minha empresa</p>
              <p className="text-sm text-neutral-500">Cadastre sua empresa e comece a usar o sistema agora mesmo</p>
            </div>
          </button>

          {/* Aguardar vinculação */}
          <button
            onClick={() => setShowWaiting(true)}
            className="w-full group bg-white border-2 border-gray-200 hover:border-gray-400 rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-md flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
              <Clock className="w-7 h-7 text-gray-500" />
            </div>
            <div>
              <p className="text-base font-bold text-[#373435] mb-1">Aguardar vinculação</p>
              <p className="text-sm text-neutral-500">Um administrador irá vincular você a uma empresa em breve</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
