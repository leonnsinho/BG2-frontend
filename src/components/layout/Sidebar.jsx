import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions as useAuthPermissions } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { useMaturityApprovals } from '../../hooks/useMaturityApprovals'
import { useToolPermissions } from '../../hooks/useToolPermissions'
import { supabase } from '../../services/supabase' // 🔥 NOVO: Import do supabase
import NotificationBadge from '../common/NotificationBadge'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Target, 
  Settings,
  FileText,
  TrendingUp,
  TrendingDown,
  Building2,
  UserCircle,
  ChevronLeft,
  Home,
  X,
  UserPlus,
  Shield,
  Database,
  Key,
  Plus,
  AlertCircle,
  LogOut,
  Calendar,
  Kanban,
  CheckSquare,
  ChevronRight,
  Menu,
  ThumbsUp,
  Download,
  Bell,
  Grid3x3,
  Lock
} from 'lucide-react'
import { cn } from '../../utils/cn'

// Variável global para capturar o evento o mais cedo possível
let globalDeferredPrompt = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    globalDeferredPrompt = e
  })
}

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

// Mapa de rotas para slugs de ferramentas
const ROUTE_TO_TOOL_SLUG = {
  '/performance-evaluation': 'performance-evaluation',
  '/planejamento-estrategico': 'planejamento-estrategico',
  '/business-model': 'business-model',
  '/journey-management/overview': 'journey-overview',
  '/dfc': 'dfc-complete',
  '/dfc/entradas': 'dfc-entradas',
  '/dfc/saidas': 'dfc-saidas',
  '/indicators': 'management-indicators',
  '/indicators/manage': 'management-indicators'
}

// Função para obter itens de navegação baseados no perfil do usuário
const getNavigationItems = (profile, permissions, accessibleJourneys = [], journeysLoading = true, pendingApprovalsCount = 0, toolPermissions = null) => {
  const baseItems = [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      roles: ['super_admin', 'gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional', 'company_admin', 'user']
    }
  ]
  
  // 🔥 Itens após Dashboard (excluindo Super Admin)
  const afterDashboardItems = [
    {
      name: 'Minhas Ações',
      icon: CheckSquare,
      href: '/tarefas',
      roles: ['gestor', 'gestor_financeiro', 'gestor_estrategico', 'gestor_pessoas_cultura', 'gestor_vendas_marketing', 'gestor_operacional', 'company_admin', 'user']
    }
  ]

  // Super Admin - Acesso total
  if (permissions.isSuperAdmin()) {
    // Filtrar baseItems para remover itens que Super Admin não deve ver
    const filteredBaseItems = baseItems.filter(item => 
      item.roles.includes('super_admin')
    )
    
    return [
      ...filteredBaseItems,
      {
        name: 'Empresas',
        icon: Building2,
        href: '/admin/company-dashboard'
      },
      {
        name: 'Gestão de Sistema',
        icon: Shield,
        href: '/admin',
        children: [
          { name: 'Usuários', href: '/admin/users' },
          { name: 'Empresas', href: '/admin/companies' },
          { name: 'Categorias', href: '/admin/categories' },
          { name: 'Solicitações de Processos', href: '/admin/process-requests' },
          { name: 'Todos os Processos', href: '/admin/all-processes' },
          { name: 'Packs de Tarefas', href: '/admin/task-packs' }
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
        name: 'Avaliação de Desempenho',
        icon: Grid3x3,
        href: '/performance-evaluation'
      },
      {
        name: 'Indicadores',
        icon: TrendingUp,
        href: '/indicators'
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
      },
      {
        name: 'Demonstrativo de Fluxo de Caixa',
        icon: TrendingDown,
        href: '/dfc',
        children: [
          { name: 'Dashboard', href: '/dfc' },
          { name: 'Entradas', href: '/dfc/entradas' },
          { name: 'Saídas', href: '/dfc/saidas' },
          { name: 'Plano de Contas', href: '/dfc/plano-contas' }
        ]
      },
      {
        name: 'API',
        icon: Key,
        href: '/admin/api-keys',
        disabled: true,
        badge: 'Em breve'
      }
    ]
  }

  // Gestor Geral (antigo consultant) - Múltiplas empresas, todas as jornadas
  if (permissions.isGestor()) {
    // Obter itens específicos baseados nas jornadas atribuídas
    const managerSpecificItems = getManagerSpecificItems(accessibleJourneys)
    
    return [
      ...baseItems,
      ...afterDashboardItems,
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
      ...afterDashboardItems,
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
      // 2) Aprovações
      {
        name: 'Aprovações',
        icon: Bell,
        href: '/approvals',
        hasPendingNotification: pendingApprovalsCount > 0,
        children: [
          { name: 'Maturidade', href: '/maturity-approvals' }
        ]
      },
      // 3) Minhas Ações
      ...afterDashboardItems,
      // 4) Estratégia
      {
        name: 'Estratégia',
        icon: Target,
        href: '/journey-management/overview',
        children: [
          { name: 'Diagnóstico do Negócio', href: '/journey-management/overview' },
          { name: 'Modelo de Negócio', href: '/business-model' }
        ]
      },
      // 5) Execução
      {
        name: 'Execução',
        icon: Kanban,
        href: '/planejamento-estrategico',
        children: [
          { name: 'Planejamento Estratégico', href: '/planejamento-estrategico' },
          {
            name: 'Políticas de Gestão',
            href: '/operational-policies',
            children: [
              { name: 'Estratégica', href: '/operational-policies?journey=estrategica' },
              { name: 'Financeira', href: '/operational-policies?journey=financeira' },
              { name: 'Pessoas & Cultura', href: '/operational-policies?journey=pessoas-cultura' },
              { name: 'Receita', href: '/operational-policies?journey=receita' }
            ]
          }
        ]
      },
      // 6) Performance
      {
        name: 'Performance',
        icon: TrendingUp,
        href: '/indicators',
        children: [
          { name: 'Indicadores de Gestão', href: '/indicators' },
          { name: 'Relatórios', href: '/reports', comingSoon: true }
        ]
      },
      // 7) Administração
      {
        name: 'Administração',
        icon: Shield,
        href: '/admin',
        children: [
          { name: 'Usuários', href: '/admin/users' }
        ]
      }
    ]
  }

  // 🔥 Usuário comum - APENAS Dashboard e Minhas Tarefas (se tiver empresa)
  const userItems = [...baseItems]
  
  // Se o usuário está associado a uma empresa (via user_companies)
  const hasCompany = profile?.company_id || (profile?.user_companies && profile.user_companies.length > 0)

  if (hasCompany) {
    userItems.push({
      name: 'Minhas Ações',
      icon: CheckSquare,
      href: '/tarefas',
      roles: ['user']
    })
  }

  return userItems
}

// Função para obter subitens de jornadas baseados nos acessos permitidos
const getJourneyChildren = (accessibleJourneys) => {
  const allJourneys = [
    { key: 'estrategica', name: 'Estratégica', href: '/jornadas/estrategica' },
    { key: 'financeira', name: 'Financeira', href: '/jornadas/financeira' },
    { key: 'pessoas-cultura', name: 'Pessoas & Cultura', href: '/jornadas/pessoas' },
    { key: 'receita-crm', name: 'Receita', href: '/jornadas/receita' },
    { key: 'operacional', name: 'Operacional', href: '/jornadas/operacional' }
  ]

  return allJourneys
    .filter(journey => accessibleJourneys.includes(journey.key))
    .map(journey => ({ name: journey.name, href: journey.href }))
}

// Função para obter itens específicos baseados nas jornadas atribuídas
const getManagerSpecificItems = (accessibleJourneys = []) => {
  const items = []

  // Se tem jornada financeira - Acesso ao DFC
  if (accessibleJourneys.includes('financeira')) {
    items.push({
      name: 'Financeiro',
      icon: DollarSign,
      href: '/dfc',
      children: [
        { name: 'Dashboard DFC', href: '/dfc' },
        { name: 'Entradas', href: '/dfc/entradas' },
        { name: 'Saídas', href: '/dfc/saidas' },
        { name: 'Plano de Contas', href: '/dfc/plano-contas' }
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
    'receita-crm': 'Receita',
    'operacional': 'Operacional'
  }
  return journeyNames[journey] || journey
}

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, className }) => {
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const { getAccessibleJourneys } = useAuthPermissions()
  const permissions = usePermissions()
  const { pendingCount } = useMaturityApprovals() // 🔥 NOVO: Hook de aprovações pendentes
  const { hasToolAccess, loading: toolPermissionsLoading } = useToolPermissions() // 🔥 NOVO: Hook de permissões de ferramentas
  const [expandedItems, setExpandedItems] = React.useState(['Jornadas'])
  const [expandedSubItems, setExpandedSubItems] = React.useState(() => {
    // Auto-expandir se a rota atual for de um sub-sub-item
    const path = window.location.pathname + window.location.search
    if (path.startsWith('/operational-policies')) return ['Políticas de Gestão']
    return []
  })
  const [accessibleJourneys, setAccessibleJourneys] = React.useState([])
  const [journeysLoading, setJourneysLoading] = React.useState(true)
  const [journeysLoaded, setJourneysLoaded] = React.useState(false)
  const [hoveredItem, setHoveredItem] = React.useState(null)
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 })
  const [isClosing, setIsClosing] = React.useState(false)
  const [avatarUrl, setAvatarUrl] = React.useState('') // 🔥 NOVO: URL assinada do avatar
  const [appVersion, setAppVersion] = React.useState('3.0.11') // Versão padrão
  // Inicializa com o valor global se existir
  const [deferredPrompt, setDeferredPrompt] = React.useState(globalDeferredPrompt)
  const [isInstallable, setIsInstallable] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(false)

  // 🔥 NOVO: Capturar evento de instalação PWA
  React.useEffect(() => {
    // Verificar se já está instalado
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                            window.navigator.standalone || 
                            document.referrer.includes('android-app://')
    
    setIsStandalone(checkStandalone)
    
    // Se tiver prompt global ou não estiver instalado, mostra botão
    if (globalDeferredPrompt || !checkStandalone) {
      if (globalDeferredPrompt) setDeferredPrompt(globalDeferredPrompt)
      setIsInstallable(true)
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      globalDeferredPrompt = e
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      globalDeferredPrompt = null
      setDeferredPrompt(null)
      setIsStandalone(true)
      setIsInstallable(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Função para instalar PWA
  const handleInstallPWA = async () => {
    // Tenta usar o prompt local ou o global
    const promptToUse = deferredPrompt || globalDeferredPrompt

    if (!promptToUse) {
      alert('Seu navegador não permitiu a instalação automática. Tente pelo menu do navegador (três pontos > Instalar App).')
      return
    }

    try {
      await promptToUse.prompt()
      const { outcome } = await promptToUse.userChoice

      if (outcome === 'accepted') {
        setIsStandalone(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        globalDeferredPrompt = null
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }

  // 🔥 NOVO: Buscar versão do Service Worker
  React.useEffect(() => {
    const getVersion = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const messageChannel = new MessageChannel()
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'VERSION_RESPONSE' && event.data.version) {
              setAppVersion(event.data.version)
            }
          }
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_VERSION' },
            [messageChannel.port2]
          )
        } catch (error) {
          // Silently ignore version fetch errors
        }
      }
    }
    getVersion()
  }, [])

  // 🔥 NOVO: Carregar URL assinada do avatar
  React.useEffect(() => {
    const loadAvatarUrl = async () => {
      if (!profile?.avatar_url) {
        setAvatarUrl('')
        return
      }

      try {
        const { data, error } = await supabase.storage
          .from('profile-avatars')
          .createSignedUrl(profile.avatar_url, 3600) // 1 hora

        if (error) throw error
        setAvatarUrl(data.signedUrl)
      } catch (error) {
        console.error('Erro ao carregar avatar:', error)
        setAvatarUrl('')
      }
    }

    loadAvatarUrl()
  }, [profile?.avatar_url])

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
    
    // Se as permissões de ferramentas ainda estão carregando, mostrar skeleton
    // (evita mostrar tudo e depois esconder)
    if (toolPermissionsLoading) {
      return [
        {
          name: 'Carregando...',
          icon: '⏳',
          skeleton: true,
          isLoading: true
        },
        {
          name: 'Carregando...',
          icon: '⏳',
          skeleton: true,
          isLoading: true
        },
        {
          name: 'Carregando...',
          icon: '⏳',
          skeleton: true,
          isLoading: true
        }
      ]
    }
    
    // Usuários vinculados: interface normal
    const items = getNavigationItems(profile, permissions, accessibleJourneys, journeysLoading, pendingCount, hasToolAccess)

    // Filtrar itens baseado nas permissões de ferramentas
    const filteredItems = items.filter(item => {
      // Se o item tem um href mapeado para tool_slug, verificar permissão
      const toolSlug = ROUTE_TO_TOOL_SLUG[item.href]
      if (toolSlug) {
        const access = hasToolAccess(toolSlug)
        if (!access) {
          return false
        }
      }

      // Se tem children, filtrar os filhos também
      if (item.children) {
        item.children = item.children.filter(child => {
          const childToolSlug = ROUTE_TO_TOOL_SLUG[child.href]
          if (childToolSlug) {
            return hasToolAccess(childToolSlug)
          }
          return true
        })
      }

      return true
    })

    return filteredItems
  }, [profile?.role, profile?.user_companies?.length, accessibleJourneys, journeysLoading, pendingCount, hasToolAccess])

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // Auto-expandir sub-itens com base na rota atual
  React.useEffect(() => {
    if (location.pathname.startsWith('/operational-policies')) {
      setExpandedSubItems(prev => prev.includes('Políticas de Gestão') ? prev : [...prev, 'Políticas de Gestão'])
    }
  }, [location.pathname])

  const isCurrentPath = (href) => {
    // Se o href contém query parameters, comparar pathname + search
    if (href.includes('?')) {
      const [path, query] = href.split('?')
      return location.pathname === path && location.search === `?${query}`
    }
    // Caso contrário, comparar apenas pathname
    return location.pathname === href
  }

  const hasActiveChild = (children) => {
    return children?.some(child => {
      // Se o child.href contém query parameters, comparar pathname + search
      if (child.href?.includes('?')) {
        const [path, query] = child.href.split('?')
        return location.pathname === path && location.search === `?${query}`
      }
      // Caso contrário, comparar apenas pathname
      if (location.pathname === child.href) return true
      // Verificar sub-sub-itens
      if (child.children) return hasActiveChild(child.children)
      return false
    })
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-neutral-500 border-r border-neutral-600 transform transition-all duration-300 ease-in-out lg:z-10 flex flex-col",
          // Mobile: slide in/out com arredondamento
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop: collapse/expand com arredondamento
          isCollapsed ? "lg:w-20" : "lg:w-80",
          "w-[85vw] max-w-[320px] sm:w-80 lg:rounded-r-[3rem]", // Mobile otimizado
          className
        )}
      >
        {/* Header da Sidebar com Logo e Badge de Role */}
        <div className="flex items-center justify-between h-20 sm:h-24 flex-shrink-0 pt-3 sm:pt-4 relative">
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full px-4 sm:px-6">
              {/* Ícone principal - centralizado */}
              <div className="bg-primary-500 rounded-full p-2">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-background" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center w-full px-4 sm:px-6">
                <img 
                  src="/LOGO 2.png" 
                  alt="BG2 Logo" 
                  className="h-10 sm:h-12 w-auto object-contain mb-1.5 sm:mb-2"
                />
                {/* Badge do tipo de gestor */}
                {permissions.isAnyManager() && (
                  <div className="bg-primary-500 text-background px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
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
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-600 active:bg-neutral-700 text-background absolute right-3 sm:right-4 top-3 sm:top-4 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4 sm:py-6 px-2 sm:px-3 scrollbar-hide overscroll-contain">
          
          {/* Seção de Navegação Principal */}
          <div className="mb-3">
            
            {/* Mensagem para usuários não vinculados */}
            {permissions.isUnlinkedUser() && !isCollapsed && (
              <div className="px-2 sm:px-3 mb-3">
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center mb-1.5 sm:mb-2">
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
              // Se é um item skeleton (loading), renderizar animação
              if (item.isLoading) {
                return (
                  <div 
                    key={item.name + Math.random()} 
                    className="w-full px-3 py-2.5 sm:py-2 rounded-lg sm:rounded-md animate-pulse"
                  >
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-neutral-700 rounded mr-3"></div>
                      {!isCollapsed && (
                        <div className="h-4 bg-neutral-700 rounded flex-1"></div>
                      )}
                    </div>
                  </div>
                )
              }

              const isActive = isCurrentPath(item.href) || hasActiveChild(item.children)
              const isDashboard = item.name === 'Dashboard'
              const ItemIcon = item.icon || ChevronLeft
              const isDropdownOpen = hoveredItem === item.name
              
              return (
                <div key={item.name}>
                  {item.children ? (
                    <button
                      onClick={(e) => item.disabled ? e.preventDefault() : handleItemClick(e, item)}
                      data-dropdown-trigger
                      className={cn(
                        "w-full group flex items-center px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0",
                        item.disabled ? "cursor-not-allowed opacity-50" : "hover:scale-[1.02] active:scale-[0.98]",
                        isActive || isDropdownOpen
                          ? "bg-primary-500 text-background shadow-lg"
                          : item.disabled 
                            ? "text-neutral-400 bg-neutral-800"
                            : "text-neutral-100 hover:text-background hover:bg-primary-500/80 hover:shadow-md",
                        isCollapsed ? "justify-center" : "text-left"
                      )}
                      title={isCollapsed ? item.name : undefined}
                      disabled={item.disabled}
                    >
                      {isCollapsed ? (
                        <div className="relative">
                          <ItemIcon className="h-5 w-5 flex-shrink-0" />
                          {/* � Ícone de cadeado para itens desabilitados */}
                          {item.disabled && (
                            <span className="absolute -bottom-1 -right-1 flex h-3 w-3 bg-neutral-900 rounded-full items-center justify-center">
                              <Lock className="h-2 w-2 text-yellow-400" />
                            </span>
                          )}
                          {/* �🔥 Ponto vermelho para notificações pendentes */}
                          {item.hasPendingNotification && (
                            <span className="absolute top-0 right-0 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {/* Badge numérico para outros itens */}
                          {item.badge && item.badge > 0 && !item.hasPendingNotification && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[8px] font-bold text-white">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          {item.name === 'Aprovações' && item.icon ? (
                            <>
                              <div className="relative mr-3">
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {item.hasPendingNotification && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                  </span>
                                )}
                              </div>
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-transform duration-300",
                                  expandedItems.includes(item.name) ? "rotate-90" : ""
                                )}
                              />
                            </>
                          ) : (
                            <>
                              <ChevronRight
                                className={cn(
                                  "mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300",
                                  expandedItems.includes(item.name) ? "rotate-90" : ""
                                )}
                              />
                              <span className="flex-1 text-left">{item.name}</span>
                              {/* � Ícone de cadeado para itens desabilitados */}
                              {item.disabled && (
                                <>
                                  <Lock className="h-4 w-4 mr-2 text-yellow-400" />
                                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    Em Desenvolvimento
                                  </span>
                                </>
                              )}
                              {/* �🔥 Ponto vermelho para notificações pendentes */}
                              {item.hasPendingNotification && (
                                <span className="flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
                            </>
                          )}
                          {/* Badge numérico para outros itens */}
                          {item.badge && item.badge > 0 && !item.hasPendingNotification && (
                            <NotificationBadge count={item.badge} size="sm" pulse={true} />
                          )}
                        </>
                      )}
                    </button>
                  ) : item.disabled ? (
                    <div
                      className={cn(
                        "flex items-center px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-md cursor-not-allowed opacity-50",
                        isCollapsed ? "justify-center" : "text-left",
                        "text-neutral-400"
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isCollapsed ? (
                        <ItemIcon className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <>
                          <Lock className="mr-3 h-5 w-5 flex-shrink-0 text-neutral-500" />
                          <span className="flex-1 text-left">{item.name}</span>
                          {item.badge && typeof item.badge === 'string' && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-neutral-700 text-neutral-300">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        "group flex items-center px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200 touch-manipulation min-h-[44px] sm:min-h-0",
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
                        <div className="relative">
                          <ItemIcon className="h-5 w-5 flex-shrink-0" />
                          {/* 🔥 Ponto vermelho para notificações pendentes */}
                          {item.hasPendingNotification && (
                            <span className="absolute top-0 right-0 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {/* Badge numérico para outros itens */}
                          {item.badge && item.badge > 0 && !item.hasPendingNotification && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[8px] font-bold text-white">
                                {item.badge > 9 ? '9+' : item.badge}
                              </span>
                            </span>
                          )}
                        </div>
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
                            <ChevronRight
                              className="mr-3 h-5 w-5 flex-shrink-0 text-neutral-400 transition-colors duration-200"
                            />
                          )}
                          <span className="flex-1 text-left">{item.name}</span>
                          {/* 🔥 Ponto vermelho para notificações pendentes */}
                          {item.hasPendingNotification && (
                            <span className="flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {/* Badge numérico para outros itens */}
                          {item.badge && item.badge > 0 && !item.hasPendingNotification && (
                            <NotificationBadge count={item.badge} size="sm" pulse={true} />
                          )}
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
                          ? "max-h-[28rem] opacity-100" 
                          : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="mt-1 ml-6 space-y-1">
                        {item.children.map((subItem) => (
                          subItem.children ? (
                            // Sub-item com filhos: expansível
                            <div key={subItem.name}>
                              <button
                                onClick={() => setExpandedSubItems(prev =>
                                  prev.includes(subItem.name)
                                    ? prev.filter(n => n !== subItem.name)
                                    : [...prev, subItem.name]
                                )}
                                className={cn(
                                  "group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                                  "hover:scale-[1.02] active:scale-[0.98]",
                                  hasActiveChild(subItem.children)
                                    ? "text-background bg-primary-500 shadow-lg"
                                    : "text-neutral-200 hover:text-background hover:bg-primary-500/80 hover:shadow-md"
                                )}
                              >
                                <span className={cn(
                                  "w-2 h-2 rounded-full mr-3 flex-shrink-0 transition-colors duration-200",
                                  hasActiveChild(subItem.children) ? "bg-background" : "bg-neutral-400"
                                )} />
                                <span className="flex-1 text-left">{subItem.name}</span>
                                <ChevronRight className={cn(
                                  "h-3 w-3 transition-transform duration-200",
                                  expandedSubItems.includes(subItem.name) ? "rotate-90" : ""
                                )} />
                              </button>
                              <div className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out",
                                expandedSubItems.includes(subItem.name) ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                              )}>
                                <div className="mt-1 ml-5 space-y-1">
                                  {subItem.children.map((grandChild) => (
                                    <Link
                                      key={grandChild.name}
                                      to={grandChild.href}
                                      className={cn(
                                        "group flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
                                        "hover:scale-[1.02] active:scale-[0.98]",
                                        isCurrentPath(grandChild.href)
                                          ? "text-background bg-primary-500/90 shadow-md"
                                          : "text-neutral-300 hover:text-background hover:bg-primary-500/60"
                                      )}
                                      onClick={onClose}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 bg-neutral-500" />
                                      <span className="flex-1 text-left">{grandChild.name}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : subItem.comingSoon ? (
                          <div
                            key={subItem.name}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-not-allowed opacity-50 text-left"
                            title="Em breve"
                          >
                            <span className="w-2 h-2 rounded-full mr-3 flex-shrink-0 bg-neutral-500"></span>
                            <span className="flex-1 text-left text-neutral-400">{subItem.name}</span>
                            <span className="text-[10px] font-semibold bg-neutral-600 text-neutral-300 px-1.5 py-0.5 rounded-full">Em breve</span>
                          </div>
                          ) : (
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
                            {/* 🔥 Badge para subitem se existir */}
                            {subItem.badge && subItem.badge > 0 && (
                              <NotificationBadge count={subItem.badge} size="sm" pulse={true} />
                            )}
                          </Link>
                          )
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
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-neutral-600 space-y-2">
          {/* Botão de Instalar App PWA */}
          {isInstallable && (
            <button
              onClick={handleInstallPWA}
              className={cn(
                "group w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "bg-gradient-to-r from-[#EBA500] to-[#d99500] hover:from-[#d99500] hover:to-[#c88500]",
                "text-white font-semibold shadow-lg hover:shadow-xl",
                "hover:scale-[1.02] active:scale-[0.98]",
                isCollapsed ? "justify-center px-2" : ""
              )}
              title="Instalar App"
            >
              <Download className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm">Instalar App</span>}
            </button>
          )}
          
          {/* Perfil do Usuário */}
          <div className={cn(
            "flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-neutral-700/50 border border-neutral-600/50",
            isCollapsed ? "justify-center" : ""
          )}>
            {/* Avatar Circle */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-lg ring-2 ring-[#EBA500]/50"
                  onError={(e) => {
                    // Fallback para inicial se a imagem falhar
                    e.target.style.display = 'none'
                    e.target.nextElementSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              {!avatarUrl && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#EBA500] to-[#d99500] flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-neutral-700 rounded-full"></div>
            </div>

            {/* Nome do Usuário */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {profile?.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-neutral-400 truncate">
                  {profile?.email || ''}
                </p>
              </div>
            )}
          </div>

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
          
          {/* Botões de Logout e Configurações na mesma linha */}
          <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
            {/* Botão de Logout */}
            <button
              onClick={async () => {
                await signOut()
                onClose()
              }}
              className={cn(
                "group flex items-center justify-center px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200 text-neutral-100 hover:text-background hover:bg-red-500/80 hover:shadow-md active:scale-[0.98] touch-manipulation min-h-[44px] sm:min-h-0 flex-1"
              )}
              title="Sair"
            >
              <LogOut 
                className="h-5 w-5 text-neutral-300 group-hover:text-background transition-colors duration-200"
              />
            </button>

            {/* Link de Configurações do Perfil */}
            <Link
              to="/settings"
              className={cn(
                "group flex items-center justify-center px-3 py-2.5 sm:py-2 text-sm font-medium rounded-lg sm:rounded-md transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[44px] sm:min-h-0 flex-1",
                isCurrentPath('/settings')
                  ? "bg-primary-500 text-background shadow-lg"
                  : "text-neutral-100 hover:text-background hover:bg-primary-500/80 hover:shadow-md"
              )}
              onClick={onClose}
              title="Configurações"
            >
              <Settings 
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  isCurrentPath('/settings') ? "text-background" : "text-neutral-300 group-hover:text-background"
                )}
              />
            </Link>
          </div>
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
                        subItem.children ? (
                          <div key={subItem.name}>
                            {/* Sub-item label (não clicável, é um agrupador) */}}
                            <div className="flex items-center px-4 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full mr-3 bg-neutral-500 flex-shrink-0" />
                              {subItem.name}
                            </div>
                            {subItem.children.map((grandChild) => (
                              <Link
                                key={grandChild.name}
                                to={grandChild.href}
                                onClick={() => { closeDropdown(); onClose() }}
                                className={cn(
                                  "flex items-center pl-9 pr-4 py-2 text-sm font-medium transition-all duration-200",
                                  "hover:bg-primary-500/80 hover:text-background",
                                  isCurrentPath(grandChild.href)
                                    ? "bg-primary-500/90 text-background"
                                    : "text-neutral-200"
                                )}
                              >
                                <span className="w-1.5 h-1.5 rounded-full mr-3 flex-shrink-0 bg-neutral-500" />
                                <span className="flex-1">{grandChild.name}</span>
                              </Link>
                            ))}
                          </div>
                        ) : subItem.comingSoon ? (
                          <div
                            key={subItem.name}
                            className="flex items-center px-4 py-2.5 text-sm font-medium cursor-not-allowed opacity-50"
                            title="Em breve"
                          >
                            <span className="w-2 h-2 rounded-full mr-3 flex-shrink-0 bg-neutral-500" />
                            <span className="flex-1 text-neutral-400">{subItem.name}</span>
                            <span className="text-[10px] font-semibold bg-neutral-600 text-neutral-300 px-1.5 py-0.5 rounded-full">Em breve</span>
                          </div>
                        ) : (
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
                          <span className="flex-1">{subItem.name}</span>
                          {/* 🔥 Badge no dropdown se existir */}
                          {subItem.badge && subItem.badge > 0 && (
                            <NotificationBadge count={subItem.badge} size="sm" pulse={true} />
                          )}
                        </Link>
                        )
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
