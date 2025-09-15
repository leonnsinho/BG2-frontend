-- DADOS SEED - MATRIZ BOSSA DIGITALIZADA
-- 5 Jornadas + 143 Processos da Metodologia Bossa Focus

-- =============================================
-- 1. INSERIR AS 5 JORNADAS PRINCIPAIS
-- =============================================

INSERT INTO journeys (name, slug, description, color, icon, order_index) VALUES
(
  'Jornada Estratégica',
  'estrategica',
  'Planejamento estratégico, visão, missão, valores e direcionamento organizacional',
  '#3B82F6', -- Blue
  'target',
  1
),
(
  'Jornada Financeira', 
  'financeira',
  'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário',
  '#10B981', -- Green
  'trending-up',
  2
),
(
  'Jornada Pessoas e Cultura',
  'pessoas-cultura', 
  'Gestão de pessoas, cultura organizacional, desenvolvimento e performance',
  '#F59E0B', -- Amber
  'users',
  3
),
(
  'Jornada Receita/CRM',
  'receita-crm',
  'Gestão comercial, vendas, relacionamento com clientes e geração de receita',
  '#EF4444', -- Red
  'trending-up',
  4
),
(
  'Jornada Operacional',
  'operacional',
  'Processos operacionais, qualidade, automações e excelência operacional',
  '#8B5CF6', -- Purple
  'settings',
  5
);

-- =============================================
-- 2. CRIAR VERSÃO INICIAL DA MATRIZ
-- =============================================

INSERT INTO matrix_versions (version_number, description, is_active, total_journeys, total_processes) VALUES
(
  '1.0.0',
  'Versão inicial da Matriz Bossa com 5 jornadas e 143 processos fundamentais',
  true,
  5,
  143
);

-- =============================================
-- 3. PROCESSOS DA JORNADA ESTRATÉGICA (30 processos)
-- =============================================

-- Obter ID da jornada estratégica
DO $$
DECLARE
    journey_estrategica_id uuid;
BEGIN
    SELECT id INTO journey_estrategica_id FROM journeys WHERE slug = 'estrategica';
    
    -- CATEGORIA: Visão e Propósito (6 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_estrategica_id, 'EST001', 'Definição da Visão Organizacional', 'Estabelecimento de uma visão clara e inspiradora para o futuro da organização', 'Visão e Propósito', 1, 1.00),
    (journey_estrategica_id, 'EST002', 'Formulação da Missão', 'Definição da missão organizacional e razão de existir da empresa', 'Visão e Propósito', 2, 1.00),
    (journey_estrategica_id, 'EST003', 'Estabelecimento de Valores', 'Definição e comunicação dos valores organizacionais fundamentais', 'Visão e Propósito', 3, 0.90),
    (journey_estrategica_id, 'EST004', 'Propósito Organizacional', 'Clarificação do propósito maior da organização na sociedade', 'Visão e Propósito', 4, 0.90),
    (journey_estrategica_id, 'EST005', 'Cultura Organizacional Desejada', 'Definição da cultura organizacional almejada', 'Visão e Propósito', 5, 0.80),
    (journey_estrategica_id, 'EST006', 'Comunicação do Propósito', 'Processos para comunicar efetivamente o propósito organizacional', 'Visão e Propósito', 6, 0.80),
    
    -- CATEGORIA: Análise e Diagnóstico (8 processos)
    (journey_estrategica_id, 'EST007', 'Análise SWOT', 'Análise sistemática de forças, fraquezas, oportunidades e ameaças', 'Análise e Diagnóstico', 7, 1.00),
    (journey_estrategica_id, 'EST008', 'Análise de Mercado', 'Estudo detalhado do mercado de atuação e tendências', 'Análise e Diagnóstico', 8, 1.00),
    (journey_estrategica_id, 'EST009', 'Análise da Concorrência', 'Mapeamento e análise sistemática dos concorrentes', 'Análise e Diagnóstico', 9, 0.90),
    (journey_estrategica_id, 'EST010', 'Diagnóstico Organizacional', 'Avaliação abrangente da situação atual da organização', 'Análise e Diagnóstico', 10, 1.00),
    (journey_estrategica_id, 'EST011', 'Análise de Stakeholders', 'Identificação e análise das partes interessadas', 'Análise e Diagnóstico', 11, 0.80),
    (journey_estrategica_id, 'EST012', 'Análise de Cenários', 'Desenvolvimento de cenários futuros possíveis', 'Análise e Diagnóstico', 12, 0.90),
    (journey_estrategica_id, 'EST013', 'Benchmarking', 'Comparação com melhores práticas do mercado', 'Análise e Diagnóstico', 13, 0.70),
    (journey_estrategica_id, 'EST014', 'Análise de Riscos Estratégicos', 'Identificação e avaliação de riscos estratégicos', 'Análise e Diagnóstico', 14, 0.90),
    
    -- CATEGORIA: Planejamento Estratégico (10 processos)
    (journey_estrategica_id, 'EST015', 'Definição de Objetivos Estratégicos', 'Estabelecimento de objetivos estratégicos de longo prazo', 'Planejamento Estratégico', 15, 1.00),
    (journey_estrategica_id, 'EST016', 'Formulação de Estratégias', 'Desenvolvimento das estratégias para alcançar os objetivos', 'Planejamento Estratégico', 16, 1.00),
    (journey_estrategica_id, 'EST017', 'Definição de Metas SMART', 'Estabelecimento de metas específicas, mensuráveis e alcançáveis', 'Planejamento Estratégico', 17, 1.00),
    (journey_estrategica_id, 'EST018', 'Plano de Ação Estratégico', 'Desenvolvimento de planos de ação detalhados', 'Planejamento Estratégico', 18, 1.00),
    (journey_estrategica_id, 'EST019', 'Orçamento Estratégico', 'Alocação de recursos para iniciativas estratégicas', 'Planejamento Estratégico', 19, 0.90),
    (journey_estrategica_id, 'EST020', 'Cronograma Estratégico', 'Definição de prazos e marcos do planejamento', 'Planejamento Estratégico', 20, 0.80),
    (journey_estrategica_id, 'EST021', 'Indicadores Estratégicos (KPIs)', 'Definição de indicadores para monitoramento', 'Planejamento Estratégico', 21, 1.00),
    (journey_estrategica_id, 'EST022', 'Balanced Scorecard', 'Implementação de sistema de gestão estratégica balanceada', 'Planejamento Estratégico', 22, 0.80),
    (journey_estrategica_id, 'EST023', 'Planos de Contingência', 'Desenvolvimento de planos alternativos para cenários adversos', 'Planejamento Estratégico', 23, 0.70),
    (journey_estrategica_id, 'EST024', 'Portfolio de Projetos', 'Gestão do portfolio de projetos estratégicos', 'Planejamento Estratégico', 24, 0.80),
    
    -- CATEGORIA: Execução e Monitoramento (6 processos)
    (journey_estrategica_id, 'EST025', 'Implementação da Estratégia', 'Processos para colocar a estratégia em prática', 'Execução e Monitoramento', 25, 1.00),
    (journey_estrategica_id, 'EST026', 'Monitoramento de KPIs', 'Acompanhamento regular dos indicadores estratégicos', 'Execução e Monitoramento', 26, 1.00),
    (journey_estrategica_id, 'EST027', 'Reuniões de Acompanhamento', 'Reuniões periódicas de acompanhamento estratégico', 'Execução e Monitoramento', 27, 0.90),
    (journey_estrategica_id, 'EST028', 'Relatórios de Progresso', 'Elaboração de relatórios de progresso estratégico', 'Execução e Monitoramento', 28, 0.80),
    (journey_estrategica_id, 'EST029', 'Revisão e Ajuste da Estratégia', 'Processos de revisão e ajuste do plano estratégico', 'Execução e Monitoramento', 29, 1.00),
    (journey_estrategica_id, 'EST030', 'Comunicação Estratégica', 'Comunicação efetiva da estratégia para toda a organização', 'Execução e Monitoramento', 30, 0.90);
END $$;

-- =============================================
-- 4. PROCESSOS DA JORNADA FINANCEIRA (32 processos)
-- =============================================

DO $$
DECLARE
    journey_financeira_id uuid;
BEGIN
    SELECT id INTO journey_financeira_id FROM journeys WHERE slug = 'financeira';
    
    -- CATEGORIA: Planejamento Financeiro (8 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_financeira_id, 'FIN001', 'Orçamento Anual', 'Elaboração do orçamento anual detalhado por centro de custo', 'Planejamento Financeiro', 31, 1.00),
    (journey_financeira_id, 'FIN002', 'Planejamento de Fluxo de Caixa', 'Projeção de entradas e saídas de caixa', 'Planejamento Financeiro', 32, 1.00),
    (journey_financeira_id, 'FIN003', 'Planejamento Tributário', 'Estratégias de otimização tributária legal', 'Planejamento Financeiro', 33, 0.90),
    (journey_financeira_id, 'FIN004', 'Projeções Financeiras', 'Projeções de receitas, custos e resultados', 'Planejamento Financeiro', 34, 1.00),
    (journey_financeira_id, 'FIN005', 'Análise de Cenários Financeiros', 'Modelagem de diferentes cenários financeiros', 'Planejamento Financeiro', 35, 0.80),
    (journey_financeira_id, 'FIN006', 'Planejamento de Investimentos', 'Planejamento de investimentos de capital', 'Planejamento Financeiro', 36, 0.90),
    (journey_financeira_id, 'FIN007', 'Gestão de Capital de Giro', 'Planejamento e gestão do capital de giro', 'Planejamento Financeiro', 37, 1.00),
    (journey_financeira_id, 'FIN008', 'Política de Dividendos', 'Definição de política de distribuição de resultados', 'Planejamento Financeiro', 38, 0.70),
    
    -- CATEGORIA: Controle Financeiro (10 processos)
    (journey_financeira_id, 'FIN009', 'Controle de Fluxo de Caixa', 'Monitoramento diário do fluxo de caixa', 'Controle Financeiro', 39, 1.00),
    (journey_financeira_id, 'FIN010', 'Controle Orçamentário', 'Acompanhamento e controle do orçamento', 'Controle Financeiro', 40, 1.00),
    (journey_financeira_id, 'FIN011', 'Conciliação Bancária', 'Processo de conciliação das contas bancárias', 'Controle Financeiro', 41, 1.00),
    (journey_financeira_id, 'FIN012', 'Controle de Contas a Receber', 'Gestão e controle das contas a receber', 'Controle Financeiro', 42, 1.00),
    (journey_financeira_id, 'FIN013', 'Controle de Contas a Pagar', 'Gestão e controle das contas a pagar', 'Controle Financeiro', 43, 1.00),
    (journey_financeira_id, 'FIN014', 'Gestão de Inadimplência', 'Processos de cobrança e gestão de inadimplência', 'Controle Financeiro', 44, 0.90),
    (journey_financeira_id, 'FIN015', 'Controle de Estoque Financeiro', 'Valoração e controle financeiro de estoques', 'Controle Financeiro', 45, 0.80),
    (journey_financeira_id, 'FIN016', 'Controle de Imobilizado', 'Gestão e controle do ativo imobilizado', 'Controle Financeiro', 46, 0.80),
    (journey_financeira_id, 'FIN017', 'Auditoria Interna', 'Processos de auditoria e controle interno', 'Controle Financeiro', 47, 0.90),
    (journey_financeira_id, 'FIN018', 'Compliance Financeiro', 'Conformidade com normas e regulamentações', 'Controle Financeiro', 48, 0.90),
    
    -- CATEGORIA: Análise e Relatórios (8 processos)
    (journey_financeira_id, 'FIN019', 'Demonstrativo de Resultado (DRE)', 'Elaboração e análise da DRE mensal', 'Análise e Relatórios', 49, 1.00),
    (journey_financeira_id, 'FIN020', 'Balanço Patrimonial', 'Elaboração e análise do balanço patrimonial', 'Análise e Relatórios', 50, 1.00),
    (journey_financeira_id, 'FIN021', 'Demonstração de Fluxo de Caixa (DFC)', 'Elaboração da demonstração de fluxo de caixa', 'Análise e Relatórios', 51, 1.00),
    (journey_financeira_id, 'FIN022', 'Análise de Indicadores', 'Cálculo e análise de indicadores financeiros', 'Análise e Relatórios', 52, 1.00),
    (journey_financeira_id, 'FIN023', 'Análise de Rentabilidade', 'Análise de rentabilidade por produto/serviço', 'Análise e Relatórios', 53, 1.00),
    (journey_financeira_id, 'FIN024', 'Análise de Custos', 'Sistema de custeio e análise de custos', 'Análise e Relatórios', 54, 1.00),
    (journey_financeira_id, 'FIN025', 'Relatórios Gerenciais', 'Elaboração de relatórios gerenciais financeiros', 'Análise e Relatórios', 55, 0.90),
    (journey_financeira_id, 'FIN026', 'Dashboard Financeiro', 'Dashboard executivo com indicadores financeiros', 'Análise e Relatórios', 56, 0.80),
    
    -- CATEGORIA: Gestão de Riscos e Crédito (6 processos)
    (journey_financeira_id, 'FIN027', 'Análise de Crédito', 'Processos de análise de crédito de clientes', 'Gestão de Riscos', 57, 0.90),
    (journey_financeira_id, 'FIN028', 'Gestão de Risco Financeiro', 'Identificação e gestão de riscos financeiros', 'Gestão de Riscos', 58, 0.90),
    (journey_financeira_id, 'FIN029', 'Política de Crédito', 'Definição e aplicação de políticas de crédito', 'Gestão de Riscos', 59, 0.80),
    (journey_financeira_id, 'FIN030', 'Seguros e Proteções', 'Gestão de seguros e proteções patrimoniais', 'Gestão de Riscos', 60, 0.70),
    (journey_financeira_id, 'FIN031', 'Contratos Financeiros', 'Gestão e controle de contratos financeiros', 'Gestão de Riscos', 61, 0.80),
    (journey_financeira_id, 'FIN032', 'Relacionamento Bancário', 'Gestão do relacionamento com instituições financeiras', 'Gestão de Riscos', 62, 0.80);
END $$;