import React from 'react'
import { Settings, Clock, CheckCircle, Sparkles } from 'lucide-react'

export default function UnlinkedUserMessage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EBA500]/5 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Card principal com animação */}
        <div className="bg-white/80 backdrop-blur-sm border border-[#EBA500]/20 rounded-3xl p-8 shadow-2xl shadow-[#EBA500]/10">
          
          {/* Ícone animado */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#EBA500] to-[#EBA500]/80 rounded-full flex items-center justify-center animate-pulse">
                <Settings className="w-10 h-10 text-white animate-spin" style={{
                  animationDuration: '3s',
                  animationTimingFunction: 'linear'
                }} />
              </div>
              
              {/* Efeito de ondas */}
              <div className="absolute inset-0 rounded-full border-4 border-[#EBA500]/30 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#EBA500]/20 animate-ping" style={{
                animationDelay: '0.5s'
              }}></div>
            </div>
          </div>

          {/* Título principal */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#373435] mb-3">
              Configurando sua conta
            </h2>
            <p className="text-lg text-neutral-600">
              Estamos preparando tudo para você...
            </p>
          </div>

          {/* Steps de configuração */}
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

          {/* Informação de progresso */}
          <div className="bg-gradient-to-r from-[#EBA500]/10 to-transparent rounded-2xl p-6 border border-[#EBA500]/20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-[#373435]">Progresso da configuração</span>
              <span className="text-[#EBA500] font-bold">66%</span>
            </div>
            
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#EBA500] to-[#EBA500]/80 rounded-full transition-all duration-1000 animate-pulse" 
                   style={{ width: '66%' }}>
              </div>
            </div>
            
            <p className="text-sm text-neutral-600 mt-4">
              Sua conta foi criada com sucesso! Aguarde enquanto um administrador da sua empresa 
              vincula seu acesso ao sistema.
            </p>
          </div>

          {/* Loading dots */}
          <div className="flex justify-center items-center mt-8">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-[#EBA500] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>

          {/* Mensagem de apoio */}
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