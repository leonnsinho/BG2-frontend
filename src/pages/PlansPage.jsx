import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Zap, Building2, Crown, Briefcase, AlertCircle, CheckCircle, LogOut } from 'lucide-react'
import { useUserContext } from '../contexts/UserContext'
import { useAuth } from '../contexts/AuthContext'

const PRICE_IDS = {
  individual: {
    monthly: 'price_1TsmYZFUmTFSWkItF8aW3uQl',
  },
  profissional: {
    monthly: 'price_1TsmYdFUmTFSWkItqgFmf8BU',
    annual: 'price_1TsmYdFUmTFSWkItqvwFamln',
  },
  premium: {
    monthly: 'price_1TsmYfFUmTFSWkItyRk5X3LA',
    annual: 'price_1TsmYfFUmTFSWkItkyXOmGCS',
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
  // Enterprise contact modal
  const [showEnterprise, setShowEnterprise] = useState(false)
  const [entForm, setEntForm] = useState({ empresa: '', nome: '', cargo: '', email: '', whatsapp: '' })
  const [entLoading, setEntLoading] = useState(false)
  const [entSuccess, setEntSuccess] = useState(false)
  const [entError, setEntError] = useState('')
  const [searchParams] = useSearchParams()
  const { user, profile, authLoading } = useUserContext()
  const { signOut } = useAuth()

  const activeCompany = profile?.user_companies?.find(uc => uc.is_active)?.companies
  const activePlan   = activeCompany?.subscription_plan   || null
  const activeStatus = activeCompany?.subscription_status || null

  // Detecta se a assinatura ativa é anual (renovação > 60 dias = anual)
  const renewalDate = activeCompany?.subscription_renewal_date
  const isAnnualSubscription = renewalDate
    ? (new Date(renewalDate) - new Date()) > 60 * 24 * 60 * 60 * 1000
    : false

  const isActive = (planId) => {
    if (planId !== activePlan || activeStatus !== 'active') return false
    // Se o plano não tem versão anual (individual), sempre bate com mensal
    if (!PRICE_IDS[planId]?.annual) return true
    // Verifica se o período da aba bate com o período da assinatura ativa
    return billing === 'annual' ? isAnnualSubscription : !isAnnualSubscription
  }

  const paymentStatus = searchParams.get('payment')
  const trialExpired = searchParams.get('trialExpired') === 'true'
  const planInativo = searchParams.get('planInativo') === 'true'

  // Inicializa modo de cobrança via URL param (?billing=annual)
  useEffect(() => {
    if (searchParams.get('billing') === 'annual') {
      setBilling('annual')
    }
  }, [])
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
      setEntForm({ empresa: activeCompany?.name || '', nome: profile?.full_name || '', cargo: '', email: profile?.email || user?.email || '', whatsapp: '' })
      setEntSuccess(false)
      setEntError('')
      setShowEnterprise(true)
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
        body: JSON.stringify({ priceId, companyId: resolvedCompanyId, userId: user.id, origin: window.location.origin }),
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

        {/* Banner: plano inativo (plano pago inativo) */}
        {planInativo && (
          <div className="mb-8 rounded-2xl border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800/40 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-orange-800 dark:text-orange-300 mb-1">
                  Seu plano está inativo
                </h2>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  Por favor, ative o seu plano para continuar usando a plataforma.
                  Seus dados estão preservados e o acesso é retomado imediatamente após a confirmação do pagamento.
                </p>
              </div>
              <button
                onClick={async () => { await signOut(); navigate('/login') }}
                className="flex-shrink-0 flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-200 border border-orange-300 dark:border-orange-600 rounded-lg px-3 py-2 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        )}

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

        {/* Botão voltar — oculto quando trial expirado ou plano inativo */}
        {!trialExpired && !planInativo && (
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
            const isCurrentPlan = isActive(plan.id)
            const monthlyEquivalent = billing === 'annual' && plan.price.annual
              ? Math.round(plan.price.annual / 12)
              : null

            return (
              <div
                key={plan.id}
                data-plan-card
                onMouseEnter={() => !isCurrentPlan && plan.id !== 'enterprise' && setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`group relative flex flex-col rounded-2xl border-2 ${isCurrentPlan ? 'border-emerald-400 dark:border-emerald-500' : plan.borderColor} bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-transform duration-300 ${isCurrentPlan ? 'cursor-default' : plan.id === 'enterprise' ? 'cursor-pointer hover:scale-[1.04] hover:shadow-2xl' : 'cursor-pointer hover:scale-[1.01]'}`}
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
                      {isCurrentPlan && (
                        <span className="ml-auto flex items-center gap-1 bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Ativo
                        </span>
                      )}
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
                    {isCurrentPlan ? (
                      <div className="w-full py-3 rounded-xl font-semibold text-sm text-center bg-emerald-500 text-white flex items-center justify-center gap-2 cursor-default select-none">
                        <Check className="h-4 w-4" /> Plano Ativo
                      </div>
                    ) : (
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
                    )}
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

      {/* Modal Enterprise */}
      {showEnterprise && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !entLoading) { setShowEnterprise(false) } }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-6 w-6 text-[#EBA500]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plano Enterprise</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Preencha seus dados e entraremos em contato</p>
                </div>
                {!entLoading && (
                  <button onClick={() => setShowEnterprise(false)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>

            {entSuccess ? (
              <div className="px-8 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Solicitação enviada!</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Nossa equipe entrará em contato em breve pelo WhatsApp ou email informado.</p>
                <button
                  onClick={() => setShowEnterprise(false)}
                  className="px-6 py-2.5 bg-[#EBA500] hover:bg-[#d49400] text-white rounded-2xl font-semibold text-sm transition-colors"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setEntError('')
                  setEntLoading(true)
                  try {
                    const res = await fetch('/.netlify/functions/send-enterprise-contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(entForm),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
                    setEntSuccess(true)
                  } catch (err) {
                    setEntError(err.message || 'Erro ao enviar. Tente novamente.')
                  } finally {
                    setEntLoading(false)
                  }
                }}
              >
                <div className="px-8 py-6 space-y-4">
                  {entError && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {entError}
                    </div>
                  )}
                  {[
                    { field: 'empresa', label: 'Empresa', placeholder: 'Nome da empresa', type: 'text' },
                    { field: 'nome', label: 'Nome do solicitante', placeholder: 'Seu nome completo', type: 'text' },
                    { field: 'cargo', label: 'Cargo', placeholder: 'Ex: CEO, Diretor, Gerente', type: 'text' },
                    { field: 'email', label: 'Email', placeholder: 'seu@email.com.br', type: 'email' },
                    { field: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 99999-9999', type: 'tel' },
                  ].map(({ field, label, placeholder, type }) => (
                    <div key={field} className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                      <input
                        type={type}
                        required
                        value={entForm[field]}
                        onChange={(e) => setEntForm(prev => ({ ...prev, [field]: e.target.value }))}
                        placeholder={placeholder}
                        disabled={entLoading}
                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EBA500]/30 focus:border-[#EBA500] bg-gray-50 dark:bg-gray-700/50 dark:text-white placeholder:text-gray-400 text-sm transition-all disabled:opacity-60"
                      />
                    </div>
                  ))}
                </div>
                <div className="px-8 pb-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEnterprise(false)}
                    disabled={entLoading}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-2xl font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={entLoading}
                    className="flex-1 px-4 py-3 bg-[#EBA500] hover:bg-[#d49400] text-white rounded-2xl font-semibold text-sm shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {entLoading ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Enviando...</>
                    ) : 'Enviar solicitação'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
