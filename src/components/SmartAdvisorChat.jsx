import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Send, Sparkles, ChevronDown, Mail, FolderOpen, Calendar,
  CheckSquare, Search, FileText, Paperclip, Mic, RotateCcw,
  Zap, Bot
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Quando tiver o webhook do n8n pronto, basta preencher a URL aqui
const N8N_WEBHOOK_URL = '' // ex: 'https://seu-n8n.app.n8n.cloud/webhook/partimap-ai'

// ─── CAPACIDADES DA IA ────────────────────────────────────────────────────────
const CAPABILITIES = [
  { icon: Mail,        label: 'Emails',       desc: 'Ler, responder e organizar emails do Gmail', color: '#EA4335', bg: '#FEF2F2' },
  { icon: FolderOpen,  label: 'Drive',        desc: 'Buscar, criar e compartilhar arquivos',       color: '#4285F4', bg: '#EFF6FF' },
  { icon: Calendar,    label: 'Agenda',       desc: 'Agendar reuniões e verificar compromissos',  color: '#34A853', bg: '#F0FDF4' },
  { icon: CheckSquare, label: 'Tarefas',      desc: 'Criar e acompanhar suas tarefas',            color: '#EBA500', bg: '#FFFBEB' },
  { icon: Search,      label: 'Pesquisar',    desc: 'Buscar informações na web e internas',       color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: FileText,    label: 'Documentos',   desc: 'Criar relatórios, apresentações e docs',     color: '#F59E0B', bg: '#FFFBEB' },
]

const QUICK_SUGGESTIONS = [
  'Quais emails não li hoje?',
  'Cria uma tarefa para amanhã',
  'Próximos compromissos',
  'Resume o último relatório do Drive',
  'Agenda uma reunião sex 14h',
]

// ─── HELPER ───────────────────────────────────────────────────────────────────
const now = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const mkMsg = (role, text, meta = {}) => ({
  id: Date.now() + Math.random(),
  role,
  text,
  time: now(),
  ...meta,
})

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function SmartAdvisorChat() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'

  const [open, setOpen]           = useState(false)
  const [input, setInput]         = useState('')
  const [messages, setMessages]   = useState([])
  const [typing, setTyping]       = useState(false)
  const [unread, setUnread]       = useState(0)
  const [showCaps, setShowCaps]   = useState(true) // mostra painel de capacidades

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Scroll para o final ao receber nova mensagem
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, typing])

  // Foca o input ao abrir
  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  // ── Envio ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msg = (text ?? input).trim()
    if (!msg) return

    setShowCaps(false)
    setInput('')
    setMessages(prev => [...prev, mkMsg('user', msg)])
    setTyping(true)

    try {
      let reply = null

      if (N8N_WEBHOOK_URL) {
        // ── Integração real com n8n ─────────────────────────────────────────
        const res = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            userId: profile?.id ?? null,
            userName: profile?.full_name ?? null,
            companyId: profile?.company_id ?? null,
            history: messages.slice(-10).map(m => ({ role: m.role, text: m.text })),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          reply = data.reply ?? data.text ?? data.message ?? null
        }
      }

      // ── Resposta placeholder enquanto sem webhook ───────────────────────
      if (!reply) {
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 600))
        reply = N8N_WEBHOOK_URL
          ? '❌ Não consegui conectar ao assistente. Tente novamente.'
          : 'Ainda estou sendo configurado! Em breve vou poder acessar seus emails, agenda, Drive e muito mais. 🚀'
      }

      setTyping(false)
      setMessages(prev => [...prev, mkMsg('assistant', reply)])
      if (!open) setUnread(u => u + 1)

    } catch {
      setTyping(false)
      setMessages(prev => [...prev, mkMsg('assistant', 'Ocorreu um erro ao processar sua solicitação. Tente novamente.')])
    }
  }, [input, messages, open, profile])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const clearChat = () => {
    setMessages([])
    setShowCaps(true)
  }

  // Auto-resize do textarea
  const handleInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
  }

  return (
    <>
      {/* ── Floating Button ────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(p => !p)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EBA500]"
        style={{
          width: 60,
          height: 60,
          background: open
            ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)',
          boxShadow: open
            ? '0 4px 16px rgba(0,0,0,0.25)'
            : '0 6px 28px rgba(235,165,0,0.55), 0 2px 8px rgba(0,0,0,0.15)',
          transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente IA'}
      >
        {/* Vídeo avatar ou ícone */}
        {!open && (
          <VideoOrIcon />
        )}
        {open && <ChevronDown className="h-5 w-5 text-white" />}

        {/* Badge de não lidas */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Chat Panel ─────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-[82px] right-6 z-50 flex flex-col rounded-3xl overflow-hidden transition-all duration-300 origin-bottom-right"
        style={{
          width: 'min(390px, calc(100vw - 24px))',
          maxHeight: 'min(600px, calc(100dvh - 110px))',
          background: '#fff',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.1)',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
          pointerEvents: open ? 'auto' : 'none',
          border: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #373435 0%, #4a4748 100%)' }}
        >
          <div
            className="relative flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 overflow-hidden ring-2"
            style={{ background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)', ringColor: 'rgba(235,165,0,0.4)' }}
          >
            <VideoOrIcon size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white leading-tight">Smart Advisor</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[11px] text-white/60">
                {N8N_WEBHOOK_URL ? 'Online · IA conectada' : 'Em configuração'}
              </p>
            </div>
          </div>

          {/* Limpar conversa */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
              title="Limpar conversa"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0 }}>

          {/* Welcome / Capacidades */}
          {showCaps && messages.length === 0 && (
            <div className="p-4 space-y-4">
              {/* Saudação */}
              <div className="text-center pt-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)', boxShadow: '0 6px 20px rgba(235,165,0,0.35)' }}>
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Olá, {firstName}! 👋</h3>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  Sou seu assistente de IA.<br />O que posso fazer por você?
                </p>
              </div>

              {/* Grid de capacidades */}
              <div className="grid grid-cols-2 gap-2">
                {CAPABILITIES.map(cap => (
                  <button
                    key={cap.label}
                    onClick={() => handleSend(`Me ajuda com ${cap.label.toLowerCase()}`)}
                    className="flex items-start gap-2 p-3 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md border border-transparent hover:border-gray-100"
                    style={{ background: cap.bg }}
                  >
                    <cap.icon className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: cap.color }} />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{cap.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{cap.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          {messages.length > 0 && (
            <div className="p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar IA */}
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5 overflow-hidden ring-1 ring-[#EBA500]/30"
                      style={{ background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)' }}>
                      <Bot className="h-3.5 w-3.5 text-white m-auto mt-[5px]" />
                    </div>
                  )}

                  <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'text-white rounded-2xl rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                      }`}
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)' }
                        : undefined}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)' }}>
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sugestões rápidas — aparece acima do input quando vazio */}
        {!typing && messages.length === 0 && !showCaps && (
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide flex-shrink-0">
            {QUICK_SUGGESTIONS.slice(0, 3).map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap text-[11px] font-medium px-3 py-1.5 rounded-full border border-[#EBA500]/40 text-[#c98d00] bg-[#EBA500]/8 hover:bg-[#EBA500]/15 transition-colors flex-shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-3 py-3">
          <div className="flex items-end gap-2">
            {/* Attachment (futuro) */}
            <button
              className="flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Anexar arquivo (em breve)"
              onClick={() => {}}
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ou peça algo…"
              rows={1}
              className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#EBA500] focus:ring-2 focus:ring-[#EBA500]/20 text-sm transition-all"
              style={{ lineHeight: '1.45', minHeight: 36, maxHeight: 112 }}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || typing}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #EBA500 0%, #c98d00 100%)' }}
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Sugestões rápidas em linha (após ter mensagens) */}
          {messages.length > 0 && !typing && (
            <div className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
              {QUICK_SUGGESTIONS.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="whitespace-nowrap text-[10px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-[#EBA500]/50 hover:text-[#c98d00] transition-colors flex-shrink-0"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <p className="text-[9px] text-gray-350 text-center mt-2 text-gray-400">
            <Zap className="h-2.5 w-2.5 inline-block mr-0.5 -mt-0.5" />
            Smart Advisor · Partimap{N8N_WEBHOOK_URL ? ' · IA ativa' : ' · Configuração pendente'}
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Sub-componente: Vídeo com fallback ───────────────────────────────────────
function VideoOrIcon({ size = 'md' }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const sz = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'

  if (videoFailed) {
    return <Sparkles className={`${sz} text-white`} />
  }

  return (
    <video
      src="/smart-advisor.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover"
      onError={() => setVideoFailed(true)}
    />
  )
}

