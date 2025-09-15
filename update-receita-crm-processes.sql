-- ATUALIZAÇÃO DOS PROCESSOS DA JORNADA RECEITA/CRM
-- 32 processos atualizados conforme metodologia Bossa Focus

-- Desabilitar trigger de histórico temporariamente
ALTER TABLE processes DISABLE TRIGGER process_history_trigger;

-- Primeiro, vamos limpar os processos existentes da jornada receita-crm
DO $$
DECLARE
    journey_receita_id uuid;
BEGIN
    SELECT id INTO journey_receita_id FROM journeys WHERE slug = 'receita-crm';
    
    -- Remover processos existentes (sem trigger de histórico)
    DELETE FROM processes WHERE journey_id = journey_receita_id;
    
    -- CATEGORIA: Estratégia e Posicionamento (5 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC001', 'Proposta de valor', 'Definição clara da proposta de valor da empresa', 'Estratégia e Posicionamento', 1, 1.00),
    (journey_receita_id, 'RC002', 'Público-alvo', 'Definição e segmentação do público-alvo', 'Estratégia e Posicionamento', 2, 1.00),
    (journey_receita_id, 'RC003', 'Estratégia de posicionamento', 'Estratégia de posicionamento no mercado', 'Estratégia e Posicionamento', 3, 1.00),
    (journey_receita_id, 'RC004', 'Segmentação de mercado', 'Segmentação detalhada do mercado-alvo', 'Estratégia e Posicionamento', 4, 1.00),
    (journey_receita_id, 'RC005', 'Análise de concorrência e benchmarking', 'Análise competitiva e benchmarking de mercado', 'Estratégia e Posicionamento', 5, 0.90);
    
    -- CATEGORIA: Identidade e Marca (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC006', 'Identidade visual', 'Desenvolvimento e padronização da identidade visual', 'Identidade e Marca', 6, 0.90),
    (journey_receita_id, 'RC007', 'Gestão de marca (brand management)', 'Gestão estratégica da marca corporativa', 'Identidade e Marca', 7, 0.90),
    (journey_receita_id, 'RC008', 'Produção de conteúdo (inbound marketing)', 'Estratégia de produção de conteúdo para atração', 'Identidade e Marca', 8, 0.90);
    
    -- CATEGORIA: Processos Comerciais (6 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC009', 'Processos comerciais definidos', 'Estruturação de processos comerciais padronizados', 'Processos Comerciais', 9, 1.00),
    (journey_receita_id, 'RC010', 'Funil de vendas', 'Estruturação e gestão do funil de vendas', 'Processos Comerciais', 10, 1.00),
    (journey_receita_id, 'RC011', 'Proposta comercial', 'Padronização de propostas comerciais', 'Processos Comerciais', 11, 1.00),
    (journey_receita_id, 'RC012', 'Prospecção ativa', 'Processo estruturado de prospecção de clientes', 'Processos Comerciais', 12, 1.00),
    (journey_receita_id, 'RC013', 'Treinamento comercial', 'Programa de treinamento para equipe comercial', 'Processos Comerciais', 13, 1.00),
    (journey_receita_id, 'RC014', 'Gestão de canais de vendas (diretos, indiretos, parceiros)', 'Gestão de múltiplos canais de vendas', 'Processos Comerciais', 14, 0.90);
    
    -- CATEGORIA: CRM e Controle (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC015', 'Controle CRM', 'Sistema de CRM para gestão de relacionamento', 'CRM e Controle', 15, 1.00),
    (journey_receita_id, 'RC016', 'CRM social (integração com redes sociais)', 'Integração do CRM com redes sociais', 'CRM e Controle', 16, 0.80),
    (journey_receita_id, 'RC017', 'Automatização de marketing (e-mail, CRM, nutrição)', 'Automatização de processos de marketing', 'CRM e Controle', 17, 0.90),
    (journey_receita_id, 'RC018', 'Canais de aquisição', 'Gestão de canais de aquisição de clientes', 'CRM e Controle', 18, 1.00);
    
    -- CATEGORIA: Experiência do Cliente (5 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC019', 'Jornada do cliente', 'Mapeamento e gestão da jornada do cliente', 'Experiência do Cliente', 19, 1.00),
    (journey_receita_id, 'RC020', 'Pós-vendas', 'Processo estruturado de pós-vendas', 'Experiência do Cliente', 20, 1.00),
    (journey_receita_id, 'RC021', 'Retenção de clientes', 'Estratégias de retenção de clientes', 'Experiência do Cliente', 21, 1.00),
    (journey_receita_id, 'RC022', 'Satisfação NPS', 'Medição e gestão da satisfação via NPS', 'Experiência do Cliente', 22, 1.00),
    (journey_receita_id, 'RC023', 'Estratégias de fidelização', 'Programas e estratégias de fidelização', 'Experiência do Cliente', 23, 0.90);
    
    -- CATEGORIA: Métricas e Performance (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC024', 'Metas comerciais', 'Definição e acompanhamento de metas comerciais', 'Métricas e Performance', 24, 1.00),
    (journey_receita_id, 'RC025', 'Principais números', 'Controle dos principais indicadores comerciais', 'Métricas e Performance', 25, 1.00),
    (journey_receita_id, 'RC026', 'Indicadores de funil (taxa de conversão, CAC, LTV etc.)', 'Acompanhamento de indicadores do funil de vendas', 'Métricas e Performance', 26, 1.00),
    (journey_receita_id, 'RC027', 'Estratégia omnichannel', 'Integração de canais para experiência omnichannel', 'Métricas e Performance', 27, 0.80);
    
    -- CATEGORIA: Crescimento e Expansão (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC028', 'Novos negócios', 'Desenvolvimento de novos negócios', 'Crescimento e Expansão', 28, 1.00),
    (journey_receita_id, 'RC029', 'Novos mercados', 'Expansão para novos mercados', 'Crescimento e Expansão', 29, 0.90),
    (journey_receita_id, 'RC030', 'Planejamento de crescimento (growth plan)', 'Planejamento estratégico de crescimento', 'Crescimento e Expansão', 30, 0.90);
    
    -- CATEGORIA: Marketing Estratégico (2 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'RC031', 'Planejamento de campanhas', 'Planejamento e execução de campanhas de marketing', 'Marketing Estratégico', 31, 0.90),
    (journey_receita_id, 'RC032', 'Planejamento de lançamento de produtos/serviços', 'Estratégia de lançamento de novos produtos/serviços', 'Marketing Estratégico', 32, 0.90);
    
    -- Validar total de processos inseridos
    RAISE NOTICE 'Processos da Jornada Receita/CRM atualizados. Total: %', (SELECT COUNT(*) FROM processes WHERE journey_id = journey_receita_id);
END $$;

-- Reabilitar trigger de histórico
ALTER TABLE processes ENABLE TRIGGER process_history_trigger;

-- Verificar resultado
SELECT 
    'Jornada Receita/CRM' as jornada,
    COUNT(p.id) as total_processos,
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category) as categorias
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'receita-crm'
GROUP BY j.id, j.name;

-- Listar processos por categoria
SELECT 
    p.category,
    COUNT(*) as processos_na_categoria,
    STRING_AGG(p.name, ' | ' ORDER BY p.order_index) as processos
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'receita-crm'
GROUP BY p.category
ORDER BY MIN(p.order_index);