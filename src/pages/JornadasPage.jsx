import { useParams, Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { 
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Settings,
  ArrowLeft
} from 'lucide-react'

const JORNADA_INFO = {
  'estrategica': {
    name: 'Jornada Estratégica',
    icon: Target,
    color: 'blue',
    description: 'Planejamento estratégico, visão, missão e direcionamento organizacional'
  },
  'financeira': {
    name: 'Jornada Financeira', 
    icon: TrendingUp,
    color: 'green',
    description: 'Gestão financeira, fluxo de caixa, DRE e indicadores'
  },
  'pessoas': {
    name: 'Jornada Pessoas & Cultura',
    icon: Users,
    color: 'orange', 
    description: 'Gestão de pessoas, cultura organizacional e desenvolvimento'
  },
  'receita': {
    name: 'Jornada Receita',
    icon: DollarSign,
    color: 'purple',
    description: 'Gestão de vendas, CRM e geração de receita'
  },
  'operacional': {
    name: 'Jornada Operacional',
    icon: Settings,
    color: 'gray',
    description: 'Processos operacionais, qualidade e eficiência'
  }
}

export default function JornadasPage() {
  const { slug } = useParams()
  
  // Se não há slug, mostrar lista de jornadas
  if (!slug) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Jornadas de Negócio
            </h1>
            <p className="text-lg text-gray-600">
              Escolha uma jornada para explorar os processos e ferramentas disponíveis.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(JORNADA_INFO).map(([key, jornada]) => {
              const IconComponent = jornada.icon
              
              return (
                <Link
                  key={key}
                  to={`/jornadas/${key}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 hover:border-gray-300"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg bg-${jornada.color}-100`}>
                      <IconComponent className={`w-6 h-6 text-${jornada.color}-600`} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {jornada.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm">
                    {jornada.description}
                  </p>
                  
                  <div className="mt-4 text-sm text-blue-600 font-medium">
                    Explorar →
                  </div>
                </Link>
              )
            })}
          </div>
          
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              💡 Procurando pela Matriz Bossa?
            </h3>
            <p className="text-blue-700 mb-4">
              A Matriz Bossa Digitalizada oferece uma avaliação completa da maturidade organizacional 
              com 143 processos estruturados.
            </p>
            <Link
              to="/matriz-bossa"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Acessar Matriz Bossa
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  // Se há slug específico, mostrar detalhes da jornada
  const jornada = JORNADA_INFO[slug]
  
  if (!jornada) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Jornada não encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              A jornada "{slug}" não existe ou não está disponível.
            </p>
            <Link
              to="/jornadas"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar às Jornadas
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const IconComponent = jornada.icon

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/jornadas"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Jornadas
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-4 rounded-xl bg-${jornada.color}-100`}>
              <IconComponent className={`w-8 h-8 text-${jornada.color}-600`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {jornada.name}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                {jornada.description}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo em desenvolvimento */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">!</span>
              </div>
            </div>
            <h3 className="ml-3 text-lg font-medium text-yellow-800">
              Área em Desenvolvimento
            </h3>
          </div>
          <p className="text-yellow-700">
            Esta seção da {jornada.name} está sendo desenvolvida. Em breve você terá acesso a:
          </p>
          <ul className="mt-3 text-yellow-700 list-disc list-inside space-y-1">
            <li>Processos específicos da jornada</li>
            <li>Ferramentas e templates</li>
            <li>Métricas e indicadores</li>
            <li>Guias e melhores práticas</li>
          </ul>
        </div>

        {/* Sugestão da Matriz Bossa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            💡 Enquanto isso, explore a Matriz Bossa
          </h3>
          <p className="text-blue-700 mb-4">
            A Matriz Bossa Digitalizada já oferece uma avaliação completa dos processos 
            desta jornada e de todas as outras, com 143 processos estruturados.
          </p>
          <div className="flex gap-3">
            <Link
              to="/matriz-bossa"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver Matriz Completa
            </Link>
            <Link
              to={`/matriz-bossa/${slug === 'pessoas' ? 'pessoas-cultura' : slug}`}
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
            >
              Ir para {jornada.name} na Matriz Bossa
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}