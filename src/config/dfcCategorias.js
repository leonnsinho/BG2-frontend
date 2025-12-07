// Configuração das Categorias e Itens do DFC
// Estrutura baseada no documento de categorias fornecido

export const DFC_CATEGORIAS = [
  {
    id: 'impostos',
    nome: 'IMPOSTOS',
    sigla: 'IMPOSTOS',
    itens: [
      'Simples Nacional',
      'ISSQN',
      'TFA - Licença Municipal'
    ]
  },
  {
    id: 'custo_produto_servico',
    nome: 'CUSTO DO PRODUTO OU SERVIÇO',
    sigla: 'CSV',
    itens: [
      'Gráfica (CSV)',
      'Gasolina (CSV)',
      'Pedágios (CSV)',
      'Créditos PDA',
      'Estacionamento (CSV)',
      'Hotel (CSV)',
      'Coquetel (CSV)',
      'Desenvolvimento digital (CSV)',
      'Alimentação (CSV)'
    ]
  },
  {
    id: 'despesas_comerciais',
    nome: 'DESPESAS OPERACIONAIS - Despesas Comerciais',
    sigla: 'DESP.COM',
    itens: [
      'Produção audiovisual',
      'Tráfego pago',
      'Gasolina (comercial)',
      'Pedágio (comercial)',
      'Estacionamento (comercial)',
      'Alimentação (comercial)',
      'Hotel (comercial)',
      'Eventos',
      'CRM',
      'Comissões',
      'Digital',
      'Agência de marketing',
      'Gráfica (comercial)'
    ]
  },
  {
    id: 'despesas_administrativas',
    nome: 'DESPESAS OPERACIONAIS - Despesas Administrativas',
    sigla: 'DESP.ADM',
    itens: [
      'Aluguel',
      'Contabilidade',
      'Copa e Cozinha',
      'Água',
      'Energia Elétrica',
      'Segurança',
      'Limpeza',
      'Manutenção',
      'Sindicato',
      'Plataformas e assinaturas',
      'Material de Expediente',
      'Seguro',
      'Consultorias',
      'Telefone e Internet',
      'Assessoria jurídica',
      'Junta comercial',
      'Associações e conselhos'
    ]
  },
  {
    id: 'despesas_pessoal',
    nome: 'DESPESAS OPERACIONAIS - Despesas com Pessoal',
    sigla: 'DESP.PES',
    itens: [
      'Prolabore Jacson Cavalheiro',
      'Prolabore Jean Modelski',
      'Dividendos Jacson Cavalheiro',
      'Dividendos Jean Modelski',
      'Medicina do Trabalho',
      'FGTS',
      'INSS',
      'Férias - provisão',
      '13º salário - provisão',
      'IRRF sobre folha',
      'Confraternizações',
      'Taxa do agente integrador',
      'Bolsa auxílio',
      'Salários'
    ]
  },
  {
    id: 'despesas_financeiras',
    nome: 'DESPESAS OPERACIONAIS - Despesas Financeiras',
    sigla: 'DESP.FIN',
    itens: [
      'Manutenção de Conta',
      'Empréstimo',
      'IOF',
      'Tarifas Bancárias/Cobrança'
    ]
  },
  {
    id: 'investimento',
    nome: 'INVESTIMENTO',
    sigla: 'INVESTIMENTO',
    itens: [
      'Aplicação financeira',
      'Outros investimentos'
    ]
  }
]

// Função auxiliar para obter categoria por ID
export const getCategoriaById = (id) => {
  return DFC_CATEGORIAS.find(cat => cat.id === id)
}

// Função auxiliar para obter todos os itens de uma categoria
export const getItensByCategoria = (categoriaId) => {
  const categoria = getCategoriaById(categoriaId)
  return categoria ? categoria.itens : []
}

// Função auxiliar para validar se um item existe em uma categoria
export const isValidItem = (categoriaId, item) => {
  const itens = getItensByCategoria(categoriaId)
  return itens.includes(item)
}
