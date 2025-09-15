-- ATUALIZAÇÃO DOS PROCESSOS DA JORNADA ESTRATÉGICA
-- 30 processos atualizados conforme metodologia Bossa Focus

-- Desabilitar trigger de histórico temporariamente
ALTER TABLE processes DISABLE TRIGGER process_history_trigger;

-- Primeiro, vamos limpar os processos existentes da jornada estratégica
DO $$
DECLARE
    journey_estrategica_id uuid;
BEGIN
    SELECT id INTO journey_estrategica_id FROM journeys WHERE slug = 'estrategica';
    
    -- Remover processos existentes (sem trigger de histórico)
    DELETE FROM processes WHERE journey_id = journey_estrategica_id;
    
    -- CATEGORIA: Fundamentos Estratégicos (6 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_estrategica_id, 'EST001', 'Modelo de Negócio', 'Definição clara do modelo de negócio da empresa', 'Fundamentos Estratégicos', 1, 1.00),
    (journey_estrategica_id, 'EST002', 'Sistema de Gestão', 'Implementação de sistema de gestão estruturado', 'Fundamentos Estratégicos', 2, 1.00),
    (journey_estrategica_id, 'EST003', 'Diretrizes estratégicas claras', 'Estabelecimento de diretrizes estratégicas bem definidas', 'Fundamentos Estratégicos', 3, 1.00),
    (journey_estrategica_id, 'EST004', 'Planejamento estratégico', 'Processo estruturado de planejamento estratégico', 'Fundamentos Estratégicos', 4, 1.00),
    (journey_estrategica_id, 'EST005', 'Organograma', 'Estrutura organizacional clara e definida', 'Fundamentos Estratégicos', 5, 0.90),
    (journey_estrategica_id, 'EST006', 'Proposta de valor clara', 'Definição clara da proposta de valor para clientes', 'Fundamentos Estratégicos', 6, 1.00),
    
    -- CATEGORIA: Metas e Indicadores (4 processos)
    (journey_estrategica_id, 'EST007', 'Metas estratégicas', 'Estabelecimento de metas estratégicas mensuráveis', 'Metas e Indicadores', 7, 1.00),
    (journey_estrategica_id, 'EST008', 'Indicadores e metas', 'Sistema de indicadores para acompanhamento das metas', 'Metas e Indicadores', 8, 1.00),
    (journey_estrategica_id, 'EST009', 'Estruturação de OKRs ou BSC', 'Implementação de OKRs ou Balanced Scorecard', 'Metas e Indicadores', 9, 0.90),
    (journey_estrategica_id, 'EST010', 'Roadmap estratégico de crescimento', 'Planejamento do roadmap de crescimento da empresa', 'Metas e Indicadores', 10, 0.90),
    
    -- CATEGORIA: Análise e Diagnóstico (5 processos)
    (journey_estrategica_id, 'EST011', 'Análises', 'Processos estruturados de análise estratégica', 'Análise e Diagnóstico', 11, 1.00),
    (journey_estrategica_id, 'EST012', 'Análise SWOT (ou outra ferramenta de diagnóstico estratégico)', 'Análise sistemática de forças, fraquezas, oportunidades e ameaças', 'Análise e Diagnóstico', 12, 1.00),
    (journey_estrategica_id, 'EST013', 'Definição de persona ou cliente ideal', 'Identificação e definição do perfil do cliente ideal', 'Análise e Diagnóstico', 13, 1.00),
    (journey_estrategica_id, 'EST014', 'Análise da concorrência', 'Mapeamento e análise sistemática dos concorrentes', 'Análise e Diagnóstico', 14, 0.90),
    (journey_estrategica_id, 'EST015', 'Posicionamento de marca', 'Definição do posicionamento estratégico da marca', 'Análise e Diagnóstico', 15, 0.90),
    
    -- CATEGORIA: Operações e Fornecedores (3 processos)
    (journey_estrategica_id, 'EST016', 'Gestão de fornecedores', 'Sistema estruturado de gestão de fornecedores', 'Operações e Fornecedores', 16, 0.90),
    (journey_estrategica_id, 'EST017', 'Atualização de produtos', 'Processos para atualização e melhoria de produtos', 'Operações e Fornecedores', 17, 0.80),
    (journey_estrategica_id, 'EST018', 'Gestão de portfólio de produtos/serviços', 'Gestão estratégica do portfólio de produtos e serviços', 'Operações e Fornecedores', 18, 0.90),
    
    -- CATEGORIA: Expansão e Crescimento (4 processos)
    (journey_estrategica_id, 'EST019', 'Novos segmentos', 'Estratégia para entrada em novos segmentos', 'Expansão e Crescimento', 19, 0.80),
    (journey_estrategica_id, 'EST020', 'Novos mercados', 'Planejamento para expansão em novos mercados', 'Expansão e Crescimento', 20, 0.80),
    (journey_estrategica_id, 'EST021', 'Investimentos', 'Planejamento e gestão de investimentos estratégicos', 'Expansão e Crescimento', 21, 0.90),
    (journey_estrategica_id, 'EST022', 'Parcerias e alianças estratégicas', 'Desenvolvimento de parcerias e alianças estratégicas', 'Expansão e Crescimento', 22, 0.80),
    
    -- CATEGORIA: Marketing e Diferenciação (3 processos)
    (journey_estrategica_id, 'EST023', 'Branding', 'Gestão e desenvolvimento da marca da empresa', 'Marketing e Diferenciação', 23, 0.80),
    (journey_estrategica_id, 'EST024', 'Estratégias de diferenciação', 'Desenvolvimento de estratégias de diferenciação competitiva', 'Marketing e Diferenciação', 24, 0.90),
    (journey_estrategica_id, 'EST025', 'Gestão da inovação', 'Sistema estruturado de gestão da inovação', 'Marketing e Diferenciação', 25, 0.90),
    
    -- CATEGORIA: Governança e Cultura (5 processos)
    (journey_estrategica_id, 'EST026', 'Governança', 'Sistema de governança corporativa estruturado', 'Governança e Cultura', 26, 1.00),
    (journey_estrategica_id, 'EST027', 'Planejamento de sucessão', 'Planejamento estruturado de sucessão de lideranças', 'Governança e Cultura', 27, 0.80),
    (journey_estrategica_id, 'EST028', 'Cultura orientada à estratégia', 'Desenvolvimento de cultura organizacional alinhada à estratégia', 'Governança e Cultura', 28, 0.90),
    (journey_estrategica_id, 'EST029', 'Comitê ou rituais de governança estratégica', 'Estruturação de comitês e rituais de governança', 'Governança e Cultura', 29, 0.90),
    (journey_estrategica_id, 'EST030', 'Estratégia ESG integrada ao negócio', 'Integração de critérios ESG na estratégia do negócio', 'Governança e Cultura', 30, 0.80);
    
    -- Validar total de processos inseridos
    RAISE NOTICE 'Processos da Jornada Estratégica atualizados. Total: %', (SELECT COUNT(*) FROM processes WHERE journey_id = journey_estrategica_id);
END $$;

-- Reabilitar trigger de histórico
ALTER TABLE processes ENABLE TRIGGER process_history_trigger;

-- Verificar resultado
SELECT 
    'Jornada Estratégica' as jornada,
    COUNT(p.id) as total_processos,
    STRING_AGG(p.category, ', ' ORDER BY p.order_index) as categorias
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'estrategica'
GROUP BY j.id, j.name;