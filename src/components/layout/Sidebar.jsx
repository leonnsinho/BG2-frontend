import React from 'react'
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
  X
} from 'lucide-react'
import { cn } from '../../utils/cn'

const navigationItems = [
  {
    name: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    current: true
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
    icon: FileText,
    href: '/relatorios'
  },
  {
    name: 'Analytics',
    icon: TrendingUp,
    href: '/analytics'
  },
  {
    name: 'Empresa',
    icon: Building2,
    href: '/empresa'
  },
  {
    name: 'Usuários',
    icon: UserCircle,
    href: '/usuarios'
  }
]

const Sidebar = ({ isOpen, onClose, className }) => {
  const [expandedItems, setExpandedItems] = React.useState(['Jornadas'])

  const toggleExpanded = (itemName) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        {/* Header da Sidebar */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <div key={item.name}>
                <a
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    item.current
                      ? "bg-primary-50 text-primary-700 border-r-2 border-primary-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={(e) => {
                    if (item.children) {
                      e.preventDefault()
                      toggleExpanded(item.name)
                    }
                  }}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      item.current ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.children && (
                    <ChevronRight
                      className={cn(
                        "ml-3 h-4 w-4 transition-transform",
                        expandedItems.includes(item.name) ? "rotate-90" : ""
                      )}
                    />
                  )}
                </a>

                {/* Subitens */}
                {item.children && expandedItems.includes(item.name) && (
                  <div className="mt-1 ml-6 space-y-1">
                    {item.children.map((subItem) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50"
                      >
                        <span className="w-2 h-2 bg-gray-300 rounded-full mr-3 flex-shrink-0"></span>
                        {subItem.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer da Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <a
            href="/configuracoes"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
          >
            <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Configurações
          </a>
        </div>
      </aside>
    </>
  )
}

export { Sidebar }
