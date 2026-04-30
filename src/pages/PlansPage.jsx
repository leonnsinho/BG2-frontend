import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Zap, Building2, Crown, Briefcase, AlertCircle, CheckCircle } from 'lucide-react'
import { useUserContext } from '../contexts/UserContext'

const PRICE_IDS = {
  individual: {
    monthly: 'price_1TReTdFUmTFSWkItrIiOcTop',
  },
  profissional: {
    monthly: 'price_1TReTrFUmTFSWkIttUUvGSHw',
    annual: 'price_1TReVGFUmTFSWkItKrsCp0eO',
  },
  premium: {
    monthly: 'price_1TReU1FUmTFSWkItEZcxgY4B',
    annual: 'price_1TReUxFUmTFSWkItssYPU7sq',
  },
}

const PLANS = [
  {
    id: 'individual',
    name: 'Individual',
    icon: Briefcase,
    price: { monthly: 99, annual: null },
    description: 'Para consultores e profissionais autônomos.',
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-200 dark:border-gray-600',
    features: [
      '01 usuário',
      'Todos os módulos liberados',
      'Todas as ferramentas liberadas',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    icon: Zap,
    price: { monthly: 790, annual: 7900 },
    description: 'Para equipes em crescimento.',
    color: 'from-[#EBA500] to-amber-600',
    borderColor: 'border-amber-400 dark:border-amber-500',
    features: [
      'Até 10 usuários',
      'Todos os módulos liberados',
      'Todas as ferramentas liberadas',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: Crown,
    price: { monthly: 1390, annual: 13900 },
    description: 'Para empresas com operação escalável.',
    color: 'from-purple-600 to-purple-800',
    borderColor: 'border-purple-300 dark:border-purple-600',
    features: [
      'De 10 a 20 usuários',
      'Todos os módulos liberados',
      'Todas as ferramentas liberadas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: { monthly: null, annual: null },
    description: 'Soluções sob medida para apoiar as empresas no amadurecimento da gestão.',
    color: 'from-slate-700 to-slate-900',
    borderColor: 'border-slate-300 dark:border-slate-600',
    features: [
      'Tudo do Premium',
      'Onboarding dedicado',
      'Treinamento da equipe',
    ],
  },
]

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function PlansPage() {
  const [billing, setBilling] = useState('monthly')
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)
  const [loadingText, setLoadingText] = useState(0)
  const [hoveredPlan, setHoveredPlan] = useState(null)
  const [gradientHeights, setGradientHeights] = useState({})
  const priceRefs = useRef({})
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile, authLoading } = useUserContext()

  const paymentStatus = searchParams.get('payment')
  const trialExpired = searchParams.get('trialExpired') === 'true'
  const companyId = profile?.user_companies?.find(uc => uc.is_active)?.company_id
  const isProfileReady = !authLoading && profile?.id && profile?.user_companies !== undefined

  const LOADING_TEXTS = [
    'Preparando os planos para você...',
    'Carregando suas informações...',
    'Quase lá...',
  ]

  useEffect(() => {
    if (isProfileReady) return
    const interval = setInterval(() => {
      setLoadingText(prev => (prev + 1) % LOADING_TEXTS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [isProfileReady])

  // Mede a posição do card de preço para definir a altura inicial do gradiente
  useEffect(() => {
    if (!isProfileReady) return
    const measure = () => {
      const heights = {}
      Object.entries(priceRefs.current).forEach(([planId, el]) => {
        if (!el) return
        const card = el.closest('[data-plan-card]')
        if (!card) return
        const cardRect = card.getBoundingClientRect()
        const priceRect = el.getBoundingClientRect()
        heights[planId] = (priceRect.top - cardRect.top) + el.offsetHeight / 2
      })
      setGradientHeights(heights)
    }
    // Mede após render
    const t = setTimeout(measure, 50)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(t); window.removeEventListener('resize', measure) }
  }, [isProfileReady])

  // Tela de loading enquanto perfil não está pronto
  if (!isProfileReady) {
    // Dimensões do logo: 887x407 → exibir em 200x92 (mesma proporção)
    const IMG_W = 200
    const IMG_H = 92
    const PAD = 12            // margem ao redor para o stroke não ser cortado
    const SVG_W = IMG_W + PAD * 2
    const SVG_H = IMG_H + PAD * 2
    const RX = 14
    // Perímetro do retângulo do SVG (bordas externas do rect interno)
    const RECT_W = SVG_W - 6  // strokeWidth/2 inset de cada lado
    const RECT_H = SVG_H - 6
    const PERIM = 2 * (RECT_W + RECT_H)

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-8 px-4">
        {/* Logo com borda de progresso retangular */}
        <div style={{ position: 'relative', width: IMG_W, height: IMG_H }}>
          {/* Imagem solta, sem container */}
          <img
            src="/LOGO 2.png"
            alt="BG2"
            style={{ width: IMG_W, height: IMG_H, objectFit: 'contain', display: 'block' }}
          />
          {/* SVG overlay com a borda animada */}
          <svg
            width={SVG_W}
            height={SVG_H}
            style={{
              position: 'absolute',
              top: -PAD,
              left: -PAD,
              pointerEvents: 'none',
            }}
          >
            {/* Trilha fundo */}
            <rect
              x={3} y={3}
              width={RECT_W} height={RECT_H}
              rx={RX}
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Anel de progresso animado */}
            <rect
              x={3} y={3}
              width={RECT_W} height={RECT_H}
              rx={RX}
              fill="none"
              stroke="#EBA500"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={PERIM}
              strokeDashoffset={PERIM}
              style={{ animation: 'fillRect 2s ease-in-out infinite' }}
            />
          </svg>
        </div>

        {/* Texto animado */}
        <div className="text-center space-y-2">
          <p key={loadingText} className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            {LOADING_TEXTS[loadingText]}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Isso leva apenas alguns instantes
          </p>
        </div>

        <style>{`
          @keyframes fillRect {
            0%   { stroke-dashoffset: ${PERIM}; opacity: 1; }
            80%  { stroke-dashoffset: 0; opacity: 1; }
            95%  { stroke-dashoffset: 0; opacity: 0; }
            100% { stroke-dashoffset: ${PERIM}; opacity: 0; }
          }
        `}</style>
      </div>
    )
  }

  const handleSubscribe = async (planId) => {
    if (planId === 'enterprise') {
      window.open('mailto:contato@bg2plan.com.br?subject=Enterprise%20-%20Partimap', '_blank')
      return
    }

    // Resolver companyId — pode ainda não ter carregado no primeiro render
    let resolvedCompanyId = profile?.user_companies?.find(uc => uc.is_active)?.company_id
    if (!resolvedCompanyId) {
      // Aguardar até 5s pelo carregamento em background
      let attempts = 0
      resolvedCompanyId = await new Promise((resolve) => {
        const interval = setInterval(() => {
          const id = profile?.user_companies?.find(uc => uc.is_active)?.company_id
          attempts++
          if (id || attempts >= 10) {
            clearInterval(interval)
            resolve(id || null)
          }
        }, 500)
      })
    }

    if (!resolvedCompanyId || !user?.id) {
      setError('Não foi possível identificar sua empresa. Tente novamente.')
      return
    }

    const plan = PLANS.find(p => p.id === planId)
    const priceId = billing === 'annual' && plan.price.annual
      ? PRICE_IDS[planId]?.annual
      : PRICE_IDS[planId]?.monthly

    if (!priceId) return

    setLoading(planId)
    setError(null)

    try {
      const response = await fetch('/.netlify/functions/stripe-create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, companyId: resolvedCompanyId, userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar checkout')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Banner: trial expirado */}
        {trialExpired && (
          <div className="mb-8 rounded-2xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-800/40 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-800 dark:text-red-300 mb-1">
                  Seu período de teste de 14 dias encerrou
                </h2>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Para continuar utilizando a plataforma, escolha um dos planos abaixo e assine agora.
                  Seus dados estão preservados e o acesso é retomado imediatamente após a confirmação do pagamento.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feedback de pagamento */}
        {paymentStatus === 'success' && (
          <div className="mb-8 flex items-center gap-3 bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl px-5 py-4 text-green-800 dark:text-green-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">Pagamento confirmado! Sua assinatura foi ativada com sucesso.</span>
          </div>
        )}
        {paymentStatus === 'cancelled' && (
          <div className="mb-8 flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-xl px-5 py-4 text-yellow-800 dark:text-yellow-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">Checkout cancelado. Você pode tentar novamente quando quiser.</span>
          </div>
        )}

        {/* Botão voltar — oculto quando trial expirado */}
        {!trialExpired && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao Dashboard
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src="/LOGO 2.png" alt="Logo" style={{ width: 120, height: 55, objectFit: 'contain' }} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Escolha o plano ideal
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Gerencie sua empresa com a plataforma certa para o seu momento.
          </p>
        </div>

        {/* Toggle mensal/anual */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-[#EBA500] text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'annual'
                  ? 'bg-[#EBA500] text-white shadow'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                billing === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              }`}>
                2 meses grátis
              </span>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl px-5 py-3 text-red-800 dark:text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon
            const isLoading = loading === plan.id
            const monthlyEquivalent = billing === 'annual' && plan.price.annual
              ? Math.round(plan.price.annual / 12)
              : null

            return (
              <div
                key={plan.id}
                data-plan-card
                onMouseEnter={() => plan.id !== 'enterprise' && setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`group relative flex flex-col rounded-2xl border-2 ${plan.borderColor} bg-white dark:bg-gray-800 shadow-sm overflow-hidden cursor-pointer transition-transform duration-300 ${plan.id === 'enterprise' ? 'hover:scale-[1.04] hover:shadow-2xl' : 'hover:scale-[1.01]'}`}
              >
                {/* Gradiente com altura dinâmica: cobre até a metade do card de preço por padrão */}
                <div
                  className={`absolute inset-x-0 top-0 bg-gradient-to-br ${plan.color} transition-all duration-500 ease-in-out`}
                  style={{
                    height: plan.id === 'enterprise' || hoveredPlan === plan.id
                      ? '100%'
                      : `${gradientHeights[plan.id] || 128}px`,
                  }}
                />

                {/* Conteúdo acima do gradiente */}
                <div className="relative z-10 flex flex-col h-full">

                  {/* Header */}
                  <div className="px-6 pt-6 pb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-white/20 rounded-xl p-2.5">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    </div>
                    <p className="text-white/80 text-sm leading-snug">{plan.description}</p>
                  </div>

                  {/* Preço */}
                  <div className="px-6 -mt-4 mb-4" ref={el => { priceRefs.current[plan.id] = el }}>
                    <div className={`${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'bg-white/15 border-white/20' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600'} border rounded-xl shadow-sm px-5 py-4 transition-colors duration-500`}>
                      {plan.price.monthly === null ? (
                        <p className={`text-lg font-bold ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white' : 'text-gray-900 dark:text-white'} transition-colors duration-500`}>Sob consulta</p>
                      ) : (
                        <>
                          {billing === 'annual' && monthlyEquivalent ? (
                            <>
                              <p className={`text-2xl font-bold ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white' : 'text-gray-900 dark:text-white'} transition-colors duration-500`}>
                                R$ {formatPrice(monthlyEquivalent)}
                                <span className={`text-sm font-normal ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-500`}>/mês</span>
                              </p>
                              <p className={`text-xs ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} mt-0.5 transition-colors duration-500`}>
                                R$ {formatPrice(plan.price.annual)} cobrado anualmente
                              </p>
                            </>
                          ) : (
                            <>
                              <p className={`text-2xl font-bold ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white' : 'text-gray-900 dark:text-white'} transition-colors duration-500`}>
                                R$ {formatPrice(plan.price.monthly)}
                                <span className={`text-sm font-normal ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-500`}>/mês</span>
                              </p>
                              {plan.price.annual === null && (
                                <p className={`text-xs ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white/60' : 'text-gray-400 dark:text-gray-500'} mt-0.5 transition-colors duration-500`}>apenas mensal</p>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="px-6 space-y-2.5 flex-1 mb-6">
                    {plan.features.map((feat) => (
                      <li key={feat} className={`flex items-start gap-2.5 text-sm ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'} transition-colors duration-500`}>
                        <Check className={`h-4 w-4 ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'text-white' : 'text-[#EBA500]'} shrink-0 mt-0.5 transition-colors duration-500`} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${plan.id === 'enterprise' || hoveredPlan === plan.id ? 'bg-white text-gray-900 hover:bg-white/90' : 'bg-gray-900 dark:bg-gray-700 text-white hover:shadow-lg'} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Aguarde...
                        </span>
                      ) : plan.id === 'enterprise' ? (
                        'Falar com consultor'
                      ) : (
                        'Assinar agora'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Rodapé */}
        <p className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 mt-10">
          Pagamentos seguros via
          <img src="/stripe.png" alt="Stripe" style={{ height: 20, objectFit: 'contain' }} className="inline-block opacity-60 dark:opacity-40" />
          . Cancele a qualquer momento.
        </p>
      </div>
    </div>
  )
}
