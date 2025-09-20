import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/useAuth'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Target, 
  Settings,
  FileText,
  TrendingUp,
  Building2,
  UserCircle,
  ChevronRight,
  Home,
  X,
  UserPlus,
  Shield,
  Database,
  Plus,
  Zap,
  AlertCircle
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Função para obter ações rápidas baseadas nas permissões do usuário
const getQuickActions = (permissions) => {
  const actions = [
    {
      title: 'Nova Empresa',
      description: 'Cadastrar nova empresa no sistema',
      icon: Building2,
      href: '/companies/new',
      color: 'blue',
      show: permissions.isSuperAdmin() || permissions.isGestor()
    },
    {
      title: 'Convidar Usuário',
      description: 'Enviar convite para novo usuário',
      icon: Users,
      href: '/invites',
      color: 'green',
      show: permissions.isCompanyAdmin() || permissions.isSuperAdmin() || permissions.isAnyManager()
    },
    {
      title: 'Criar Meta',
      description: 'Definir nova meta SMART',
      icon: Target,
      href: '/goals/new',
      color: 'purple',
      show: true
    },
    {
      title: 'Ver Relatórios',
      description: 'Acessar relatórios e dashboards',
      icon: BarChart3,
      href: '/reports',
      color: 'orange',
      show: true
    }
  ]

  return actions.filter(action => action.show)
}

// Função para obter itens de navegação baseados no perfil do usuário
const getNavigationItems = (profile, permissions, accessibleJourneys = [], journeysLoading = true) => {
  console.log('🧭 Navigation Debug:', {
    role: profile?.role,
    isSuperAdmin: permissions.isSuperAdmin(),
    isCompanyAdmin: permissions.isCompanyAdmin(),
    isAnyManager: permissions.isAnyManager()
  })
  const baseItems = [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      roles: ['super_admin', 'gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional', 'company_admin', 'user']
    }
  ]

  // Super Admin - Acesso total
  if (permissions.isSuperAdmin()) {
    return [
      ...baseItems,
      {
        name: 'Gestão de Sistema',
        icon: Shield,
        href: '/admin',
        children: [
          { name: 'Usuários', href: '/admin/users' },
          { name: 'Atribuição de Jornadas', href: '/admin/journey-assignments' },
          { name: 'Empresas', href: '/admin/companies' }
        ]
      },
      {
        name: 'Gerenciamento de Jornadas',
        icon: Target,
        href: '/journey-management',
        children: [
          { name: 'Visão Geral', href: '/journey-management/overview' },
          { name: 'Estratégica', href: '/journey-management/estrategica' },
          { name: 'Financeira', href: '/journey-management/financeira' },
          { name: 'Pessoas & Cultura', href: '/journey-management/pessoas-cultura' },
          { name: 'Receita/CRM', href: '/journey-management/receita-crm' },
          { name: 'Operacional', href: '/journey-management/operacional' }
        ]
      },
      {
        name: 'Convites',
        icon: UserPlus,
        href: '/invites'
      },
      {
        name: 'Relatórios Globais',
        icon: BarChart3,
        href: '/reports',
        children: [
          { name: 'Por Empresa', href: '/reports/companies' },
          { name: 'Por Usuário', href: '/reports/users' },
          { name: 'Métricas Sistema', href: '/reports/system' }
        ]
      }
    ]
  }

  // Gestor Geral (antigo consultant) - Múltiplas empresas, todas as jornadas
  if (permissions.isGestor()) {
    return [
      ...baseItems,
      {
        name: 'Empresas',
        icon: Building2,
        href: '/companies',
        children: [
          { name: 'Visão Geral', href: '/companies/overview' },
          { name: 'Comparativo', href: '/companies/compare' },
          { name: 'Relatórios', href: '/companies/reports' }
        ]
      },
      {
        name: 'Convites',
        icon: UserPlus,
        href: '/invites'
      },
      {
        name: 'Jornadas',
        icon: Target,
        href: '/jornadas',
        children: getJourneyChildren(accessibleJourneys)
      },
      {
        name: 'Gestão de Processos',
        icon: Settings,
        href: '/process-management'
      },
      {
        name: 'CRM',
        icon: Users,
        href: '/crm'
      },
      {
        name: 'Financeiro',
        icon: DollarSign,
        href: '/financeiro',
        children: [
          { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
          { name: 'DRE', href: '/financeiro/dre' },
          { name: 'DFC', href: '/financeiro/dfc' },
          { name: 'Orçamento', href: '/financeiro/orcamento' }
        ]
      }
    ]
  }

  // Gestores Específicos - Acesso apenas às suas jornadas
  if (permissions.isAnyManager()) {
    
    return [
      ...baseItems,
      {
        name: 'Convites',
        icon: UserPlus,
        href: '/invites'
      },
      {
        name: 'Jornadas',
        icon: Target,
        href: '/jornadas',
        children: getJourneyChildren(accessibleJourneys)
      },
      // Adicionar seções específicas baseadas no tipo de gestor
      ...getManagerSpecificItems(permissions),
      {
        name: 'Gestão de Processos',
        icon: Settings,
        href: '/process-management'
      }
    ]
  }

  // Admin da Empresa - Gestão da empresa
  if (permissions.isCompanyAdmin()) {
    return [
      ...baseItems,
      {
        name: 'Gestão de Sistema',
        icon: Shield,
        href: '/admin',
        children: [
          { name: 'Usuários', href: '/admin/users' },
          { name: 'Atribuição de Jornadas', href: '/admin/journey-assignments' }
        ]
      },
      {
        name: 'Equipe',
        icon: Users,
        href: '/team',
        children: [
          { name: 'Membros', href: '/team/members' },
          { name: 'Convites', href: '/team/invites' },
          { name: 'Permissões', href: '/team/permissions' }
        ]
      },
      {
        name: 'Convites',
        icon: UserPlus,
        href: '/invites'
      },
      {
        name: 'Jornadas',
        icon: Target,
        href: '/jornadas',
        children: getJourneyChildren(['estrategica', 'financeira', 'pessoas-cultura', 'receita-crm', 'operacional'])
      },
      {
        name: 'Gestão de Processos',
        icon: Settings,
        href: '/process-management'
      },
      {
        name: 'CRM',
        icon: Users,
        href: '/crm'
      },
      {
        name: 'Financeiro',
        icon: DollarSign,
        href: '/financeiro',
        children: [
          { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
          { name: 'DRE', href: '/financeiro/dre' },
          { name: 'DFC', href: '/financeiro/dfc' },
          { name: 'Orçamento', href: '/financeiro/orcamento' }
        ]
      },
      {
        name: 'Relatórios',
        icon: BarChart3,
        href: '/reports',
        children: [
          { name: 'Vendas', href: '/reports/sales' },
          { name: 'Financeiro', href: '/reports/financial' },
          { name: 'Equipe', href: '/reports/team' }
        ]
      }
    ]
  }

  // Usuário comum - Acesso limitado
  return [
    ...baseItems,
    {
      name: 'CRM',
      icon: Users,
      href: '/crm'
    },
    {
      name: 'Relatórios',
      icon: BarChart3,
      href: '/reports',
      children: [
        { name: 'Minhas Vendas', href: '/reports/my-sales' },
        { name: 'Meu Desempenho', href: '/reports/my-performance' }
      ]
    }
  ]
}

// Função para obter subitens de jornadas baseados nos acessos permitidos
const getJourneyChildren = (accessibleJourneys) => {
  const allJourneys = [
    { key: 'estrategica', name: 'Estratégica', href: '/jornadas/estrategica' },
    { key: 'financeira', name: 'Financeira', href: '/jornadas/financeira' },
    { key: 'pessoas-cultura', name: 'Pessoas & Cultura', href: '/jornadas/pessoas' },
    { key: 'receita-crm', name: 'Receita/CRM', href: '/jornadas/receita' },
    { key: 'operacional', name: 'Operacional', href: '/jornadas/operacional' }
  ]

  return allJourneys
    .filter(journey => accessibleJourneys.includes(journey.key))
    .map(journey => ({ name: journey.name, href: journey.href }))
}

// Função para obter itens específicos baseados no tipo de gestor
const getManagerSpecificItems = (permissions) => {
  const items = []

  // Gestor Financeiro - Acesso completo ao financeiro
  if (permissions.isGestorFinanceiro()) {
    items.push({
      name: 'Financeiro',
      icon: DollarSign,
      href: '/financeiro',
      children: [
        { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
        { name: 'DRE', href: '/financeiro/dre' },
        { name: 'DFC', href: '/financeiro/dfc' },
        { name: 'Orçamento', href: '/financeiro/orcamento' },
        { name: 'Análises', href: '/financeiro/analises' }
      ]
    })
  }

  // Gestor de Vendas/Marketing - Acesso completo ao CRM
  if (permissions.isGestorVendasMarketing()) {
    items.push({
      name: 'CRM & Vendas',
      icon: Users,
      href: '/crm',
      children: [
        { name: 'Dashboard', href: '/crm/dashboard' },
        { name: 'Leads', href: '/crm/leads' },
        { name: 'Oportunidades', href: '/crm/opportunities' },
        { name: 'Campanhas', href: '/crm/campaigns' },
        { name: 'Relatórios', href: '/crm/reports' }
      ]
    })
  }

  // Gestor de Pessoas & Cultura - Acesso a RH
  if (permissions.isGestorPessoasCultura()) {
    items.push({
      name: 'Pessoas & RH',
      icon: Users,
      href: '/rh',
      children: [
        { name: 'Colaboradores', href: '/rh/employees' },
        { name: 'Recrutamento', href: '/rh/recruitment' },
        { name: 'Avaliações', href: '/rh/evaluations' },
        { name: 'Treinamentos', href: '/rh/training' }
      ]
    })
  }

  // Gestor Operacional - Acesso a operações
  if (permissions.isGestorOperacional()) {
    items.push({
      name: 'Operações',
      icon: Settings,
      href: '/operations',
      children: [
        { name: 'Processos', href: '/operations/processes' },
        { name: 'Qualidade', href: '/operations/quality' },
        { name: 'Produção', href: '/operations/production' },
        { name: 'Logística', href: '/operations/logistics' }
      ]
    })
  }

  // Gestor Estratégico - Acesso a estratégia e planejamento
  if (permissions.isGestorEstrategico()) {
    items.push({
      name: 'Estratégia',
      icon: Target,
      href: '/strategy',
      children: [
        { name: 'Planejamento', href: '/strategy/planning' },
        { name: 'Objetivos', href: '/strategy/objectives' },
        { name: 'KPIs', href: '/strategy/kpis' },
        { name: 'Análise Mercado', href: '/strategy/market-analysis' }
      ]
    })
  }

  return items
}

// Função para obter texto do badge do gestor
const getManagerBadgeText = (permissions) => {
  if (permissions.isSuperAdmin()) return 'Super Admin'
  if (permissions.isGestor()) return 'Gestor Geral'
  if (permissions.isGestorFinanceiro()) return 'Gestor Financeiro'
  if (permissions.isGestorEstrategico()) return 'Gestor Estratégico'
  if (permissions.isGestorPessoasCultura()) return 'Gestor Pessoas & Cultura'
  if (permissions.isGestorVendasMarketing()) return 'Gestor Vendas & Marketing'
  if (permissions.isGestorOperacional()) return 'Gestor Operacional'
  return 'Gestor'
}

// Função para obter nome de exibição da jornada
const getJourneyDisplayName = (journey) => {
  const journeyNames = {
    'estrategica': 'Estratégica',
    'financeira': 'Financeira', 
    'pessoas-cultura': 'Pessoas & Cultura',
    'receita-crm': 'Receita/CRM',
    'operacional': 'Operacional'
  }
  return journeyNames[journey] || journey
}

const Sidebar = ({ isOpen, onClose, className }) => {
  const location = useLocation()
  const { profile } = useAuth()
  const permissions = usePermissions()
  const [expandedItems, setExpandedItems] = React.useState(['Jornadas'])
  const [accessibleJourneys, setAccessibleJourneys] = React.useState([])
  const [journeysLoading, setJourneysLoading] = React.useState(true)
  const [journeysLoaded, setJourneysLoaded] = React.useState(false)

  // Carregar jornadas acessíveis sempre que o perfil mudar (sistema simplificado)
  React.useEffect(() => {
    let isMounted = true
    
    const loadAccessibleJourneys = async () => {
      console.log('🔍 Sidebar: Carregando jornadas para usuário:', profile?.id)
      
      if (!profile?.id) {
        console.log('❌ Sidebar: Sem perfil - definindo jornadas vazias')
        if (isMounted) {
          // Sistema simplificado: sem perfil = sem jornadas
          setAccessibleJourneys([])
          setJourneysLoading(false)
        }
        return
      }

      // SISTEMA SIMPLIFICADO: Sempre recarregar jornadas (sem cache)
      try {
        if (isMounted) setJourneysLoading(true)
        console.log('🔄 Sidebar: Chamando getAccessibleJourneys...')
        const journeys = await permissions.getAccessibleJourneys()
        console.log('📊 Sidebar: Jornadas recebidas:', journeys)
        
        if (isMounted) {
          setAccessibleJourneys(journeys)
          setJourneysLoaded(true)
          console.log('✅ Sidebar: Jornadas definidas no estado:', journeys)
        }
      } catch (error) {
        console.error('❌ Sidebar: Erro ao carregar jornadas:', error)
        if (isMounted) {
          // Sistema simplificado: erro = sem jornadas (não usa fallback de role)
          setAccessibleJourneys([])
          setJourneysLoaded(true)
        }
      } finally {
        if (isMounted) setJourneysLoading(false)
      }
    }

    loadAccessibleJourneys()

    // Cleanup function
    return () => {
      isMounted = false
    }
  }, [profile?.id]) // Removido journeysLoaded para sempre recarregar

  // Obter itens de navegação baseados no usuário atual
  const navigationItems = React.useMemo(() => {
    // USUÁRIOS NÃO VINCULADOS: Interface simplificada
    if (permissions.isUnlinkedUser()) {
      return [
        {
          name: 'Dashboard',
          icon: Home,
          href: '/'
        },
        {
          name: 'Metas Atribuídas',
          icon: Target,
          href: '/goals/assigned'
        }
      ]
    }
    
    // Usuários vinculados: interface normal
    return getNavigationItems(profile, permissions, accessibleJourneys, journeysLoading)
  }, [profile, accessibleJourneys, journeysLoading, permissions.isUnlinkedUser()])

  // Obter ações rápidas baseadas no usuário atual
  const quickActions = React.useMemo(() => {
    // Usuários não vinculados não têm ações rápidas
    if (permissions.isUnlinkedUser()) {
      return []
    }
    
    return getQuickActions(permissions)
  }, [permissions.isUnlinkedUser()])

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isCurrentPath = (href) => {
    return location.pathname === href
  }

  const hasActiveChild = (children) => {
    return children?.some(child => location.pathname === child.href)
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-72 h-full bg-neutral-500 border-r border-neutral-600 rounded-r-[3rem] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-10 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header da Sidebar com Logo e Badge de Role */}
        <div className="flex items-center justify-between h-20 px-6 flex-shrink-0">
          <div className="flex flex-col items-center justify-center w-full">
            <img 
              src="/LOGO 2.png" 
              alt="BG2 Logo" 
              className="h-10 w-auto object-contain mb-1"
            />
            {/* Badge do tipo de gestor */}
            {permissions.isAnyManager() && (
              <div className="bg-primary-500 text-background px-2 py-1 rounded-full text-xs font-semibold">
                {getManagerBadgeText(permissions)}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-neutral-600 text-background absolute right-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          
          {/* Seção de Ações Rápidas */}
          {quickActions.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center px-3 mb-3">
                <Zap className="w-4 h-4 text-neutral-300 mr-2" />
                <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  Ações Rápidas
                </h3>
              </div>
              
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const getColorClasses = (color) => {
                    const colorMap = {
                      blue: 'bg-primary-100 hover:bg-primary-200 border-primary-300 text-primary-800',
                      green: 'bg-primary-100 hover:bg-primary-200 border-primary-300 text-primary-800',
                      purple: 'bg-primary-100 hover:bg-primary-200 border-primary-300 text-primary-800',
                      orange: 'bg-primary-100 hover:bg-primary-200 border-primary-300 text-primary-800'
                    }
                    return colorMap[color] || colorMap.blue
                  }

                  return (
                    <Link
                      key={action.title}
                      to={action.href}
                      className={cn(
                        "group flex items-center p-3 text-sm font-medium rounded-lg border transition-colors",
                        getColorClasses(action.color)
                      )}
                      onClick={onClose}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background border mr-3">
                        <action.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{action.title}</p>
                        <p className="text-xs opacity-75 truncate">{action.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Seção de Navegação Principal */}
          <div className="mb-3">
            <div className="flex items-center px-3 mb-3">
              <Home className="w-4 h-4 text-neutral-300 mr-2" />
              <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                Navegação
              </h3>
            </div>
            
            {/* Mensagem para usuários não vinculados */}
            {permissions.isUnlinkedUser() && (
              <div className="px-3 mb-3">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-xs font-medium text-yellow-800">Status da Conta</span>
                  </div>
                  <div className="text-xs text-yellow-700">
                    <p className="mb-1 font-medium">Aguardando Vinculação</p>
                    <p>Entre em contato com o administrador da sua empresa para solicitar vinculação.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador de jornadas acessíveis para gestores específicos */}
            {permissions.isAnyManager() && !permissions.isGestor() && !permissions.isSuperAdmin() && !permissions.isUnlinkedUser() && (
              <div className="px-3 mb-3">
                <div className="bg-neutral-600 rounded-lg p-3 border border-neutral-500">
                  <div className="flex items-center mb-2">
                    <Target className="w-4 h-4 text-primary-300 mr-2" />
                    <span className="text-xs font-medium text-neutral-200">Suas Jornadas</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {journeysLoading ? (
                      <span className="px-2 py-1 bg-neutral-500 text-background text-xs rounded-full animate-pulse">
                        Carregando...
                      </span>
                    ) : (
                      accessibleJourneys.map((journey) => (
                        <span 
                          key={journey}
                          className="px-2 py-1 bg-primary-500 text-background text-xs rounded-full font-medium"
                        >
                          {getJourneyDisplayName(journey)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = isCurrentPath(item.href) || hasActiveChild(item.children)
              
              return (
                <div key={item.name}>
                  {item.children ? (
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={cn(
                        "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                        isActive
                          ? "bg-primary-500 text-background"
                          : "text-neutral-100 hover:text-background hover:bg-primary-500"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-background" : "text-neutral-300 group-hover:text-background"
                        )}
                      />
                      <span className="flex-1">{item.name}</span>
                      <ChevronRight
                        className={cn(
                          "ml-3 h-4 w-4 transition-transform",
                          expandedItems.includes(item.name) ? "rotate-90" : ""
                        )}
                      />
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary-500 text-background"
                          : "text-neutral-100 hover:text-background hover:bg-primary-500"
                      )}
                      onClick={onClose}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-background" : "text-neutral-300 group-hover:text-background"
                        )}
                      />
                      <span className="flex-1">{item.name}</span>
                    </Link>
                  )}

                  {/* Subitens */}
                  {item.children && expandedItems.includes(item.name) && (
                    <div className="mt-1 ml-6 space-y-1">
                      {item.children.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          className={cn(
                            "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isCurrentPath(subItem.href)
                              ? "text-background bg-primary-500"
                              : "text-neutral-200 hover:text-background hover:bg-primary-500"
                          )}
                          onClick={onClose}
                        >
                          <span 
                            className={cn(
                              "w-2 h-2 rounded-full mr-3 flex-shrink-0",
                              isCurrentPath(subItem.href) ? "bg-background" : "bg-neutral-400"
                            )}
                          ></span>
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer da Sidebar */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-600">
          <Link
            to="/settings"
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isCurrentPath('/settings')
                ? "bg-primary-500 text-background"
                : "text-neutral-100 hover:text-background hover:bg-primary-500"
            )}
            onClick={onClose}
          >
            <Settings 
              className={cn(
                "mr-3 h-5 w-5",
                isCurrentPath('/settings') ? "text-background" : "text-neutral-300 group-hover:text-background"
              )}
            />
            Configurações
          </Link>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
