-- ATUALIZAÇÃO DOS PROCESSOS DA JORNADA FINANCEIRA
-- 28 processos atualizados conforme metodologia Bossa Focus

-- Desabilitar trigger de histórico temporariamente
ALTER TABLE processes DISABLE TRIGGER process_history_trigger;

-- Primeiro, vamos limpar os processos existentes da jornada financeira
DO $$
DECLARE
    journey_financeira_id uuid;
BEGIN
    SELECT id INTO journey_financeira_id FROM journeys WHERE slug = 'financeira';
    
    -- Remover processos existentes (sem trigger de histórico)
    DELETE FROM processes WHERE journey_id = journey_financeira_id;
    
    -- CATEGORIA: Fundamentos Financeiros (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_financeira_id, 'FIN001', 'Registro e controle de informações', 'Sistema estruturado de registro e controle de informações financeiras', 'Fundamentos Financeiros', 1, 1.00),
    (journey_financeira_id, 'FIN002', 'Diferenciação de contas PF x PJ (Higiene financeira básica)', 'Separação clara entre contas pessoais e empresariais', 'Fundamentos Financeiros', 2, 1.00),
    (journey_financeira_id, 'FIN003', 'Controle de recebimentos (Fluxo de caixa inicial)', 'Controle básico de recebimentos e fluxo de caixa', 'Fundamentos Financeiros', 3, 1.00),
    (journey_financeira_id, 'FIN004', 'Controle contábil', 'Sistema de controle contábil estruturado', 'Fundamentos Financeiros', 4, 1.00),
    
    -- CATEGORIA: Gestão de Caixa e Capital (3 processos)
    (journey_financeira_id, 'FIN005', 'Capital de giro', 'Gestão e controle do capital de giro da empresa', 'Gestão de Caixa e Capital', 5, 1.00),
    (journey_financeira_id, 'FIN006', 'Gestão de caixa', 'Sistema de gestão e controle de caixa diário', 'Gestão de Caixa e Capital', 6, 1.00),
    (journey_financeira_id, 'FIN007', 'Projeção de fluxo de caixa', 'Projeções futuras de fluxo de caixa', 'Gestão de Caixa e Capital', 7, 1.00),
    
    -- CATEGORIA: Planejamento e Orçamento (3 processos)
    (journey_financeira_id, 'FIN008', 'Planejamento orçamentário', 'Elaboração de planejamento orçamentário anual', 'Planejamento e Orçamento', 8, 1.00),
    (journey_financeira_id, 'FIN009', 'Despesa x Investimento', 'Diferenciação e controle entre despesas e investimentos', 'Planejamento e Orçamento', 9, 1.00),
    (journey_financeira_id, 'FIN010', 'Controle orçamentário', 'Acompanhamento e controle da execução orçamentária', 'Planejamento e Orçamento', 10, 1.00),
    
    -- CATEGORIA: Indicadores e Performance (4 processos)
    (journey_financeira_id, 'FIN011', 'Indicadores de desempenho', 'Definição e acompanhamento de KPIs financeiros', 'Indicadores e Performance', 11, 1.00),
    (journey_financeira_id, 'FIN012', 'Margem de contribuição', 'Cálculo e análise da margem de contribuição', 'Indicadores e Performance', 12, 1.00),
    (journey_financeira_id, 'FIN013', 'Ticket médio', 'Análise e gestão do ticket médio de vendas', 'Indicadores e Performance', 13, 0.90),
    (journey_financeira_id, 'FIN014', 'Análise de ponto de equilíbrio', 'Cálculo e análise do ponto de equilíbrio operacional', 'Indicadores e Performance', 14, 1.00),
    
    -- CATEGORIA: Precificação e Custos (3 processos)
    (journey_financeira_id, 'FIN015', 'Precificação adequada', 'Metodologia estruturada de precificação', 'Precificação e Custos', 15, 1.00),
    (journey_financeira_id, 'FIN016', 'Gestão de custos', 'Sistema de gestão e controle de custos', 'Precificação e Custos', 16, 1.00),
    (journey_financeira_id, 'FIN017', 'Estruturação de centro de custos', 'Organização por centros de custos para melhor controle', 'Precificação e Custos', 17, 0.90),
    
    -- CATEGORIA: Análise e Relatórios (3 processos)
    (journey_financeira_id, 'FIN018', 'Planejamento tributário', 'Estratégias de planejamento tributário eficiente', 'Análise e Relatórios', 18, 0.90),
    (journey_financeira_id, 'FIN019', 'Análise de viabilidade econômica', 'Análise de viabilidade de projetos e investimentos', 'Análise e Relatórios', 19, 0.90),
    (journey_financeira_id, 'FIN020', 'Relatórios gerenciais financeiros mensais', 'Elaboração de relatórios gerenciais mensais', 'Análise e Relatórios', 20, 1.00),
    
    -- CATEGORIA: Análise Avançada (3 processos)
    (journey_financeira_id, 'FIN021', 'Análise de endividamento e alavancagem', 'Análise dos níveis de endividamento e alavancagem', 'Análise Avançada', 21, 0.90),
    (journey_financeira_id, 'FIN022', 'Simulações de cenários financeiros', 'Modelagem de diferentes cenários financeiros', 'Análise Avançada', 22, 0.80),
    (journey_financeira_id, 'FIN023', 'Avaliação de valuation (quando aplicável)', 'Processos de avaliação da empresa (valuation)', 'Análise Avançada', 23, 0.70),
    
    -- CATEGORIA: Crédito e Cobrança (2 processos)
    (journey_financeira_id, 'FIN024', 'Políticas de crédito e cobrança', 'Definição de políticas de crédito e cobrança', 'Crédito e Cobrança', 24, 0.90),
    (journey_financeira_id, 'FIN025', 'Gestão de inadimplência', 'Sistema de gestão e controle da inadimplência', 'Crédito e Cobrança', 25, 0.90),
    
    -- CATEGORIA: Captação e Investimentos (1 processo)
    (journey_financeira_id, 'FIN026', 'Planejamento para captação de recursos (bancários ou investidores)', 'Planejamento estratégico para captação de recursos', 'Captação e Investimentos', 26, 0.80),
    
    -- CATEGORIA: Governança e Compliance (2 processos)
    (journey_financeira_id, 'FIN027', 'Governança financeira (definição de papéis, aprovações e auditorias)', 'Sistema de governança financeira estruturado', 'Governança e Compliance', 27, 1.00),
    (journey_financeira_id, 'FIN028', 'Compliance e conformidade fiscal', 'Conformidade com normas e regulamentações fiscais', 'Governança e Compliance', 28, 1.00);
    
    -- Validar total de processos inseridos
    RAISE NOTICE 'Processos da Jornada Financeira atualizados. Total: %', (SELECT COUNT(*) FROM processes WHERE journey_id = journey_financeira_id);
END $$;

-- Reabilitar trigger de histórico
ALTER TABLE processes ENABLE TRIGGER process_history_trigger;

-- Verificar resultado
SELECT 
    'Jornada Financeira' as jornada,
    COUNT(p.id) as total_processos,
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category) as categorias
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'financeira'
GROUP BY j.id, j.name;