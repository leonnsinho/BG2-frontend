import React, { useState, useRef, useEffect } from 'react'
import { X, Send, ChevronDown, Sparkles } from 'lucide-react'

const INITIAL_MESSAGE = {
  id: 1,
  role: 'assistant',
  text: 'Olá! Sou o Smart Advisor da Partimap 👋 Como posso ajudar você hoje?',
  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const SmartAdvisorChat = () => {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const videoRef = useRef(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, typing])

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Placeholder reply (replace with real AI integration)
    setTimeout(() => {
      setTyping(false)
      const reply = {
        id: Date.now() + 1,
        role: 'assistant',
        text: 'Obrigado pela sua mensagem! Em breve essa funcionalidade estará integrada com inteligência artificial. 🚀',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, reply])
    }, 1200)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none"
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #EBA500 0%, #d99500 100%)',
          boxShadow: open ? 'none' : '0 8px 32px rgba(235, 165, 0, 0.45)'
        }}
        title={open ? 'Fechar Smart Advisor' : 'Abrir Smart Advisor'}
        aria-label={open ? 'Fechar chat' : 'Abrir Smart Advisor'}
      >
        {open ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <div className="w-full h-full rounded-full overflow-hidden">
            <video
              ref={videoRef}
              src="/smart-advisor.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback to icon if video not found
                if (videoRef.current) videoRef.current.style.display = 'none'
              }}
            />
            {/* Fallback icon (hidden when video loads) */}
            <Sparkles className="absolute inset-0 m-auto h-7 w-7 text-white" style={{ display: 'none' }} />
          </div>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-[88px] right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 origin-bottom-right overflow-hidden ${
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ width: 360, maxHeight: 520 }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #EBA500 0%, #d99500 100%)' }}
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/40">
            <video
              src="/smart-advisor.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Smart Advisor</p>
            <p className="text-xs text-white/80">Assistente Inteligente</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Fechar chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#EBA500] to-[#d99500] flex-shrink-0 mt-0.5 ring-1 ring-[#EBA500]/20">
                  <video
                    src="/smart-advisor.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#EBA500] to-[#d99500] text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}
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
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#EBA500] to-[#d99500] flex-shrink-0 mt-0.5">
                <video src="/smart-advisor.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-gray-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#EBA500] text-sm transition-colors bg-gray-50 focus:bg-white max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #EBA500 0%, #d99500 100%)' }}
              aria-label="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">Smart Advisor · Partimap</p>
        </div>
      </div>
    </>
  )
}

export default SmartAdvisorChat
