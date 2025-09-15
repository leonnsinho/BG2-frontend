-- ATUALIZAÇÃO DOS PROCESSOS DA JORNADA OPERACIONAL
-- 24 processos atualizados conforme metodologia Bossa Focus

-- Desabilitar trigger de histórico temporariamente
ALTER TABLE processes DISABLE TRIGGER process_history_trigger;

-- Primeiro, vamos limpar os processos existentes da jornada operacional
DO $$
DECLARE
    journey_operacional_id uuid;
BEGIN
    SELECT id INTO journey_operacional_id FROM journeys WHERE slug = 'operacional';
    
    -- Remover processos existentes (sem trigger de histórico)
    DELETE FROM processes WHERE journey_id = journey_operacional_id;
    
    -- CATEGORIA: Estruturação de Processos (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP001', 'Mapeamento de processos', 'Mapeamento completo dos processos operacionais', 'Estruturação de Processos', 1, 1.00),
    (journey_operacional_id, 'OP002', 'Manual de processos / POPs', 'Elaboração de manuais e procedimentos operacionais padrão', 'Estruturação de Processos', 2, 1.00),
    (journey_operacional_id, 'OP003', 'Prazos e entregas', 'Gestão de prazos e cronogramas de entrega', 'Estruturação de Processos', 3, 1.00),
    (journey_operacional_id, 'OP004', 'Controles de qualidade', 'Sistema de controles e garantia de qualidade', 'Estruturação de Processos', 4, 1.00);
    
    -- CATEGORIA: Gestão e Monitoramento (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP005', 'Indicadores operacionais (eficiência, retrabalho, SLA)', 'Acompanhamento de indicadores operacionais chave', 'Gestão e Monitoramento', 5, 1.00),
    (journey_operacional_id, 'OP006', 'Auditorias internas operacionais', 'Sistema de auditorias internas dos processos', 'Gestão e Monitoramento', 6, 0.90),
    (journey_operacional_id, 'OP007', 'Gestão de riscos operacionais', 'Identificação e gestão de riscos operacionais', 'Gestão e Monitoramento', 7, 1.00),
    (journey_operacional_id, 'OP008', 'Planejamento de contingência', 'Planos de contingência para operações críticas', 'Gestão e Monitoramento', 8, 0.90);
    
    -- CATEGORIA: Cadeia de Valor (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP009', 'Gestão de fornecedores e contratos', 'Gestão estratégica de fornecedores e contratos', 'Cadeia de Valor', 9, 1.00),
    (journey_operacional_id, 'OP010', 'Logística e cadeia de suprimentos', 'Gestão da cadeia logística e suprimentos', 'Cadeia de Valor', 10, 1.00),
    (journey_operacional_id, 'OP011', 'Planejamento e controle da produção (PCP)', 'Sistema de PCP para controle produtivo', 'Cadeia de Valor', 11, 1.00),
    (journey_operacional_id, 'OP012', 'Gestão da capacidade operacional', 'Planejamento e gestão da capacidade operacional', 'Cadeia de Valor', 12, 1.00);
    
    -- CATEGORIA: Melhoria Contínua (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP013', 'Ferramentas de melhoria contínua (PDCA, Kaizen, 5S)', 'Implementação de metodologias de melhoria contínua', 'Melhoria Contínua', 13, 0.90),
    (journey_operacional_id, 'OP014', 'Integração entre áreas operacionais e estratégicas', 'Alinhamento entre operação e estratégia', 'Melhoria Contínua', 14, 1.00),
    (journey_operacional_id, 'OP015', 'Cultura de inovação', 'Fomento de cultura de inovação operacional', 'Melhoria Contínua', 15, 0.80);
    
    -- CATEGORIA: Experiência e Conformidade (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP016', 'Gestão da experiência operacional do cliente (CX na operação)', 'Gestão da experiência do cliente na operação', 'Experiência e Conformidade', 16, 1.00),
    (journey_operacional_id, 'OP017', 'Segurança jurídica', 'Conformidade jurídica dos processos operacionais', 'Experiência e Conformidade', 17, 1.00),
    (journey_operacional_id, 'OP018', 'Regulamentação especializada', 'Adequação às regulamentações específicas do setor', 'Experiência e Conformidade', 18, 0.90),
    (journey_operacional_id, 'OP019', 'Sustentabilidade e gestão ambiental', 'Práticas sustentáveis e gestão ambiental', 'Experiência e Conformidade', 19, 0.80);
    
    -- CATEGORIA: Transformação Digital (5 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OP020', 'Omnichannel', 'Integração de canais para experiência omnichannel', 'Transformação Digital', 20, 0.80),
    (journey_operacional_id, 'OP021', 'Maturidade digital', 'Desenvolvimento da maturidade digital operacional', 'Transformação Digital', 21, 0.90),
    (journey_operacional_id, 'OP022', 'Automação de processos (RPA)', 'Automação robótica de processos operacionais', 'Transformação Digital', 22, 0.90),
    (journey_operacional_id, 'OP023', 'Governança de dados operacionais', 'Governança e gestão de dados operacionais', 'Transformação Digital', 23, 0.90),
    (journey_operacional_id, 'OP024', 'Implementação de Inteligência Artificial', 'Implementação de IA nos processos operacionais', 'Transformação Digital', 24, 0.70);
    
    -- Validar total de processos inseridos
    RAISE NOTICE 'Processos da Jornada Operacional atualizados. Total: %', (SELECT COUNT(*) FROM processes WHERE journey_id = journey_operacional_id);
END $$;

-- Reabilitar trigger de histórico
ALTER TABLE processes ENABLE TRIGGER process_history_trigger;

-- Verificar resultado
SELECT 
    'Jornada Operacional' as jornada,
    COUNT(p.id) as total_processos,
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category) as categorias
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'operacional'
GROUP BY j.id, j.name;

-- Listar processos por categoria
SELECT 
    p.category,
    COUNT(*) as processos_na_categoria,
    STRING_AGG(p.name, ' | ' ORDER BY p.order_index) as processos
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'operacional'
GROUP BY p.category
ORDER BY MIN(p.order_index);