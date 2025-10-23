import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions as useAuthPermissions } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
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
  ChevronLeft,
  Home,
  X,
  UserPlus,
  Shield,
  Database,
  Plus,
  AlertCircle,
  LogOut,
  Calendar,
  Kanban,
  CheckSquare,
  ChevronRight,
  Menu
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Injetar animação CSS para o dropdown
if (typeof document !== 'undefined' && !document.getElementById('sidebar-dropdown-animation')) {
  const style = document.createElement('style')
  style.id = 'sidebar-dropdown-animation'
  style.textContent = `
    @keyframes dropdown-open {
      0% {
        opacity: 0;
        transform: translateY(-50%) translateX(-10px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(-50%) translateX(0) scale(1);
      }
    }
    
    @keyframes dropdown-close {
      0% {
        opacity: 1;
        transform: translateY(-50%) translateX(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-50%) translateX(-10px) scale(0.95);
      }
    }
    
    .animate-dropdown-open {
      animation: dropdown-open 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .animate-dropdown-close {
      animation: dropdown-close 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `
  document.head.appendChild(style)
}


// Função para obter itens de navegação baseados no perfil do usuário
const getNavigationItems = (profile, permissions, accessibleJourneys = [], journeysLoading = true) => {
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
          { name: 'Empresas', href: '/admin/companies' },
          { name: 'Solicitações de Processos', href: '/admin/process-requests' },
          { name: 'Todos os Processos', href: '/admin/all-processes' }
        ]
      },
      {
        name: 'Gerenciamento de Jornadas',
        icon: Target,
        href: '/journey-management/overview'
      },
      {
        name: 'Criar Empresa',
        icon: Building2,
        href: '/companies/new'
      },
      {
        name: 'Relatórios de Uso',
        icon: BarChart3,
        href: '/reports',
        children: [
          { name: 'Atividade de Usuários', href: '/reports/user-activity' },
          { name: 'Uso por Empresa', href: '/reports/company-usage' },
          { name: 'Métricas da Plataforma', href: '/reports/platform-metrics' }
        ]
      }
    ]
  }

  // Gestor Geral (antigo consultant) - Múltiplas empresas, todas as jornadas
  if (permissions.isGestor()) {
    // Obter itens específicos baseados nas jornadas atribuídas
    const managerSpecificItems = getManagerSpecificItems(accessibleJourneys)
    
    return [
      ...baseItems,
      {
        name: 'Planejamento Estratégico',
        icon: Kanban,
        href: '/planejamento-estrategico'
      },
      {
        name: 'Tarefas em Andamento',
        icon: CheckSquare,
        href: '/tarefas-andamento'
      },
      {
        name: 'Usuários Ativos',
        icon: Users,
        href: '/usuarios-ativos'
      },
      // Adicionar itens específicos baseados nas jornadas atribuídas
      ...managerSpecificItems
    ]
  }

  // Gestores Específicos - Acesso apenas às suas jornadas
  if (permissions.isAnyManager()) {
    const managerSpecificItems = getManagerSpecificItems(accessibleJourneys)
    
    return [
      ...baseItems,
      {
        name: 'Planejamento Estratégico',
        icon: Kanban,
        href: '/planejamento-estrategico'
      },
      {
        name: 'Jornadas',
        icon: Target,
        href: '/jornadas',
        children: getJourneyChildren(accessibleJourneys)
      },
      // Adicionar seções específicas baseadas no tipo de gestor E nas jornadas atribuídas
      ...managerSpecificItems,
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
        name: 'Avaliação de Processos',
        icon: CheckSquare,
        href: '/journey-management/overview'
      },
      {
        name: 'Políticas Operacionais',
        icon: FileText,
        href: '/operational-policies'
      },
      {
        name: 'Relatórios',
        icon: BarChart3,
        href: '/reports',
        children: [
          { name: 'Atividade de Usuários', href: '/reports/user-activity' }
        ]
      }
    ]
  }

  // Usuário comum - Verificar se tem jornadas atribuídas para adicionar menus especiais
  const userItems = [...baseItems]
  
  // Se o usuário tem jornadas atribuídas, adicionar funcionalidades específicas
  if (accessibleJourneys && accessibleJourneys.length > 0) {
    // Adicionar itens específicos baseados nas jornadas (como Financeiro)
    const specialItems = getManagerSpecificItems(accessibleJourneys)
    userItems.push(...specialItems)
  }
  
  return userItems
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

// Função para obter itens específicos baseados nas jornadas atribuídas
const getManagerSpecificItems = (accessibleJourneys = []) => {
  const items = []

  // Se tem jornada financeira - Acesso ao menu Financeiro
  if (accessibleJourneys.includes('financeira')) {
    items.push({
      name: 'Financeiro',
      icon: DollarSign,
      href: '/financeiro',
      children: [
        { name: 'Fluxo de Caixa', href: '/financeiro/fluxo-caixa' },
        { name: 'DRE', href: '/financeiro/dre' },
        { name: 'DFC', href: '/financeiro/dfc' }
      ]
    })
  }

  // Se tem jornada de receita/CRM - Acesso ao CRM
  if (accessibleJourneys.includes('receita-crm')) {
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

  // Se tem jornada de pessoas & cultura - Acesso a RH
  if (accessibleJourneys.includes('pessoas-cultura')) {
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

  // Se tem jornada operacional - Acesso a operações
  if (accessibleJourneys.includes('operacional')) {
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

  // Nota: Jornada estratégica não adiciona menu separado, 
  // usa o "Planejamento Estratégico" que já está no menu base

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

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, className }) => {
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const { getAccessibleJourneys } = useAuthPermissions()
  const permissions = usePermissions()
  const [expandedItems, setExpandedItems] = React.useState(['Jornadas'])
  const [accessibleJourneys, setAccessibleJourneys] = React.useState([])
  const [journeysLoading, setJourneysLoading] = React.useState(true)
  const [journeysLoaded, setJourneysLoaded] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState(null)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 })
  const [isClosing, setIsClosing] = React.useState(false)

  // Carregar jornadas acessíveis sempre que o perfil mudar (sistema simplificado)
  React.useEffect(() => {
    let isMounted = true
    
    const loadAccessibleJourneys = async () => {
      if (!profile?.id) {
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
        const journeys = await getAccessibleJourneys()
        
        if (isMounted) {
          setAccessibleJourneys(journeys)
          setJourneysLoaded(true)
        }
      } catch (error) {
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
    const items = getNavigationItems(profile, permissions, accessibleJourneys, journeysLoading)
    return items
  }, [profile?.role, profile?.user_companies?.length, accessibleJourneys, journeysLoading])

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

  // Handler para abrir dropdown quando colapsado
  const handleItemClick = (event, item) => {
    if (isCollapsed && item.children) {
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      
      // Usar coordenadas absolutas da viewport
      setDropdownPosition({
        top: rect.top + (rect.height / 2), // Centro vertical do botão
        left: rect.right + 12 // Logo após o botão com espaço para seta
      })
      
      if (hoveredItem === item.name) {
        // Fechar com animação
        setIsClosing(true)
        setTimeout(() => {
          setHoveredItem(null)
          setIsClosing(false)
        }, 200)
      } else {
        // Abrir
        setIsClosing(false)
        setHoveredItem(item.name)
      }
    } else if (item.children) {
      toggleExpanded(item.name)
    }
  }

  // Função para fechar dropdown com animação
  const closeDropdown = () => {
    setIsClosing(true)
    setTimeout(() => {
      setHoveredItem(null)
      setIsClosing(false)
    }, 200)
  }

  // Fechar dropdown ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (hoveredItem && !event.target.closest('[data-dropdown]') && !event.target.closest('[data-dropdown-trigger]')) {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [hoveredItem])

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
          "fixed top-0 left-0 z-40 h-full bg-neutral-500 border-r border-neutral-600 rounded-r-[3rem] transform transition-all duration-300 ease-in-out lg:z-10 flex flex-col",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: collapse/expand
          isCollapsed ? "lg:w-20" : "lg:w-72",
          "w-72", // Mobile sempre full width
          className
        )}
      >
        {/* Header da Sidebar com Logo e Badge de Role */}
        <div className="flex items-center justify-between h-24 flex-shrink-0 pt-4 relative">
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full px-6">
              {/* Ícone principal - centralizado */}
              <div className="bg-primary-500 rounded-full p-2">
                <Building2 className="h-6 w-6 text-background" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center w-full px-6">
                <img 
                  src="/LOGO 2.png" 
                  alt="BG2 Logo" 
                  className="h-12 w-auto object-contain mb-2"
                />
                {/* Badge do tipo de gestor */}
                {permissions.isAnyManager() && (
                  <div className="bg-primary-500 text-background px-2 py-1 rounded-full text-xs font-semibold">
                    {getManagerBadgeText(permissions)}
                  </div>
                )}
              </div>
              
              {/* Botão de toggle para desktop - no canto quando expandido */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:block p-2 rounded-md hover:bg-neutral-600 text-background absolute right-4 top-4 transition-transform duration-300"
                title="Colapsar sidebar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Botão de fechar para mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-neutral-600 text-background absolute right-4 top-4"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          
          {/* Seção de Navegação Principal */}
          <div className="mb-3">
            
            {/* Mensagem para usuários não vinculados */}
            {permissions.isUnlinkedUser() && !isCollapsed && (
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
            {permissions.isAnyManager() && !permissions.isGestor() && !permissions.isSuperAdmin() && !permissions.isUnlinkedUser() && !isCollapsed && (
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
              const isDashboard = item.name === 'Dashboard'
              const ItemIcon = item.icon || ChevronLeft
              const isDropdownOpen = hoveredItem === item.name
              
              return (
                <div key={item.name}>
                  {item.children ? (
                    <button
                      onClick={(e) => handleItemClick(e, item)}
                      data-dropdown-trigger
                      className={cn(
                        "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive || isDropdownOpen
                          ? "bg-primary-500 text-background shadow-lg"
                          : "text-neutral-100 hover:text-background hover:bg-primary-500/80 hover:shadow-md",
                        isCollapsed ? "justify-center" : "text-left"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isCollapsed ? (
                        <ItemIcon className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <>
                          <ChevronLeft
                            className={cn(
                              "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300",
                              expandedItems.includes(item.name) ? "rotate-90" : ""
                            )}
                          />
                          <span className="flex-1 text-left">{item.name}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isActive
                          ? "bg-primary-500 text-background shadow-lg"
                          : "text-neutral-100 hover:text-background hover:bg-primary-500/80 hover:shadow-md",
                        isCollapsed ? "justify-center" : "text-left"
                      )}
                      onClick={onClose}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isCollapsed ? (
                        <ItemIcon className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <>
                          {isDashboard ? (
                            <Home
                              className={cn(
                                "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                                isActive ? "text-background" : "text-neutral-300 group-hover:text-background"
                              )}
                            />
                          ) : (
                            <ChevronLeft
                              className="mr-3 h-5 w-5 flex-shrink-0 text-neutral-400 transition-colors duration-200"
                            />
                          )}
                          <span className="flex-1 text-left">{item.name}</span>
                        </>
                      )}
                    </Link>
                  )}

                  {/* Subitens com animação suave - apenas quando não colapsado */}
                  {item.children && !isCollapsed && (
                    <div 
                      className={cn(
                        "overflow-hidden transition-all duration-300 ease-in-out",
                        expandedItems.includes(item.name) 
                          ? "max-h-96 opacity-100" 
                          : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="mt-1 ml-6 space-y-1">
                        {item.children.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={cn(
                              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 text-left",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              isCurrentPath(subItem.href)
                                ? "text-background bg-primary-500 shadow-lg"
                                : "text-neutral-200 hover:text-background hover:bg-primary-500/80 hover:shadow-md"
                            )}
                            onClick={onClose}
                          >
                            <span 
                              className={cn(
                                "w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-colors duration-200",
                                isCurrentPath(subItem.href) ? "bg-background" : "bg-neutral-400"
                              )}
                            ></span>
                            <span className="flex-1 text-left">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Footer da Sidebar */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-600 space-y-2">
          {/* Botão de toggle para desktop quando colapsado - acima do botão Sair */}
          {isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center justify-center w-full p-2 rounded-md hover:bg-neutral-600 text-background transition-transform duration-300"
              title="Expandir sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          
          {/* Botão de Logout */}
          <button
            onClick={async () => {
              await signOut()
              onClose()
            }}
            className={cn(
              "group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 text-neutral-100 hover:text-background hover:bg-red-500/80 hover:shadow-md active:scale-[0.98]",
              isCollapsed ? "justify-center" : "text-left"
            )}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut 
              className={cn(
                "h-5 w-5 text-neutral-300 group-hover:text-background transition-colors duration-200",
                !isCollapsed && "mr-3"
              )}
            />
            {!isCollapsed && <span className="flex-1 text-left">Sair</span>}
          </button>

          {/* Link de Configurações do Perfil */}
          <Link
            to="/settings"
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              isCurrentPath('/settings')
                ? "bg-primary-500 text-background shadow-lg"
                : "text-neutral-100 hover:text-background hover:bg-primary-500/80 hover:shadow-md",
              isCollapsed ? "justify-center" : "text-left"
            )}
            onClick={onClose}
            title={isCollapsed ? "Configurações" : undefined}
          >
            <Settings 
              className={cn(
                "h-5 w-5 transition-colors duration-200",
                isCurrentPath('/settings') ? "text-background" : "text-neutral-300 group-hover:text-background",
                !isCollapsed && "mr-3"
              )}
            />
            {!isCollapsed && <span className="flex-1 text-left">Configurações</span>}
          </Link>
        </div>
      </aside>

      {/* Dropdown Menu Flutuante para itens com subitens quando colapsado */}
      {isCollapsed && hoveredItem && (
        <>
          {/* Backdrop sutil */}
          <div 
            className="fixed inset-0 z-35 bg-transparent"
            onClick={closeDropdown}
          />
          
          {/* Menu Dropdown */}
          {navigationItems
            .filter(item => item.name === hoveredItem && item.children)
            .map(item => {
              const ItemIcon = item.icon || ChevronLeft
              return (
                <div
                  key={item.name}
                  data-dropdown
                  className={cn(
                    "fixed z-50",
                    isClosing ? "animate-dropdown-close" : "animate-dropdown-open"
                  )}
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`
                  }}
                >
                  {/* Seta conectora - ANTES do conteúdo */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -left-2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-neutral-600"
                  />
                  
                  <div className="bg-neutral-500 rounded-2xl shadow-2xl border border-neutral-600 overflow-hidden min-w-[200px] relative">
                    {/* Header do Dropdown */}
                    <div className="px-4 py-3 bg-neutral-600/50 border-b border-neutral-600 flex items-center gap-3">
                      <ItemIcon className="h-5 w-5 text-primary-400" />
                      <span className="text-sm font-semibold text-background">{item.name}</span>
                    </div>
                    
                    {/* Lista de Subitens */}
                    <div className="py-2">
                      {item.children.map((subItem) => (
                        <Link
                          key={subItem.name}
                          to={subItem.href}
                          onClick={() => {
                            closeDropdown()
                            onClose()
                          }}
                          className={cn(
                            "flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-200",
                            "hover:bg-primary-500/80 hover:text-background",
                            isCurrentPath(subItem.href)
                              ? "bg-primary-500 text-background"
                              : "text-neutral-100"
                          )}
                        >
                          <span 
                            className={cn(
                              "w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-colors duration-200",
                              isCurrentPath(subItem.href) ? "bg-background" : "bg-neutral-400"
                            )}
                          />
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
        </>
      )}
    </>
  )
}

export { Sidebar }
