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
  Zap
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
      show: permissions.isSuperAdmin() || permissions.isConsultant()
    },
    {
      title: 'Convidar Usuário',
      description: 'Enviar convite para novo usuário',
      icon: Users,
      href: '/users/invite',
      color: 'green',
      show: permissions.isCompanyAdmin() || permissions.isSuperAdmin() || permissions.isConsultant()
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
const getNavigationItems = (profile, permissions) => {
  const baseItems = [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      roles: ['super_admin', 'consultant', 'company_admin', 'user']
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
          { name: 'Empresas', href: '/admin/companies' },
          { name: 'Configurações', href: '/admin/settings' }
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

  // Consultor - Múltiplas empresas
  if (permissions.isConsultant()) {
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
        children: [
          { name: 'Estratégica', href: '/jornadas/estrategica' },
          { name: 'Financeira', href: '/jornadas/financeira' },
          { name: 'Pessoas & Cultura', href: '/jornadas/pessoas' },
          { name: 'Receita', href: '/jornadas/receita' },
          { name: 'Operacional', href: '/jornadas/operacional' }
        ]
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

  // Admin da Empresa - Gestão da empresa
  if (permissions.isCompanyAdmin()) {
    return [
      ...baseItems,
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
        children: [
          { name: 'Estratégica', href: '/jornadas/estrategica' },
          { name: 'Financeira', href: '/jornadas/financeira' },
          { name: 'Pessoas & Cultura', href: '/jornadas/pessoas' },
          { name: 'Receita', href: '/jornadas/receita' },
          { name: 'Operacional', href: '/jornadas/operacional' }
        ]
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

const Sidebar = ({ isOpen, onClose, className }) => {
  const location = useLocation()
  const { profile } = useAuth()
  const permissions = usePermissions()
  const [expandedItems, setExpandedItems] = React.useState(['Jornadas'])

  // Obter itens de navegação baseados no usuário atual
  const navigationItems = React.useMemo(() => {
    return getNavigationItems(profile, permissions)
  }, [profile, permissions])

  // Obter ações rápidas baseadas no usuário atual
  const quickActions = React.useMemo(() => {
    return getQuickActions(permissions)
  }, [permissions])

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
          "fixed top-0 left-0 z-40 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-10 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
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
                <Zap className="w-4 h-4 text-gray-400 mr-2" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações Rápidas
                </h3>
              </div>
              
              <div className="space-y-2">
                {quickActions.map((action) => {
                  const getColorClasses = (color) => {
                    const colorMap = {
                      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
                      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
                      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
                      orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
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
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white border mr-3">
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
              <Home className="w-4 h-4 text-gray-400 mr-2" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Navegação
              </h3>
            </div>
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
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
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
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      onClick={onClose}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-5 w-5 flex-shrink-0",
                          isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
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
                              ? "text-primary-700 bg-primary-50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                          onClick={onClose}
                        >
                          <span 
                            className={cn(
                              "w-2 h-2 rounded-full mr-3 flex-shrink-0",
                              isCurrentPath(subItem.href) ? "bg-primary-500" : "bg-gray-300"
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
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <Link
            to="/settings"
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isCurrentPath('/settings')
                ? "bg-primary-50 text-primary-700"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            )}
            onClick={onClose}
          >
            <Settings 
              className={cn(
                "mr-3 h-5 w-5",
                isCurrentPath('/settings') ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
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
