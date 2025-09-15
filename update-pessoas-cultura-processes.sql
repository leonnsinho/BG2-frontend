-- ATUALIZAÇÃO DOS PROCESSOS DA JORNADA PESSOAS E CULTURA
-- 28 processos atualizados conforme metodologia Bossa Focus

-- Desabilitar trigger de histórico temporariamente
ALTER TABLE processes DISABLE TRIGGER process_history_trigger;

-- Primeiro, vamos limpar os processos existentes da jornada pessoas-cultura
DO $$
DECLARE
    journey_pessoas_id uuid;
BEGIN
    SELECT id INTO journey_pessoas_id FROM journeys WHERE slug = 'pessoas-cultura';
    
    -- Remover processos existentes (sem trigger de histórico)
    DELETE FROM processes WHERE journey_id = journey_pessoas_id;
    
    -- CATEGORIA: Cultura e Valores (4 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC001', 'Valores', 'Definição e implementação dos valores organizacionais', 'Cultura e Valores', 1, 1.00),
    (journey_pessoas_id, 'PC002', 'Manual de cultura', 'Elaboração e manutenção do manual de cultura corporativa', 'Cultura e Valores', 2, 1.00),
    (journey_pessoas_id, 'PC003', 'Cultura de aprendizagem contínua', 'Fomento de uma cultura organizacional voltada ao aprendizado', 'Cultura e Valores', 3, 0.90),
    (journey_pessoas_id, 'PC004', 'Inclusão e diversidade', 'Políticas e práticas de inclusão e diversidade organizacional', 'Cultura e Valores', 4, 0.90);
    
    -- CATEGORIA: Estrutura Organizacional (4 processos)  
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC005', 'Funções dos sócios', 'Definição clara de funções e responsabilidades dos sócios', 'Estrutura Organizacional', 5, 1.00),
    (journey_pessoas_id, 'PC006', 'Estrutura de cargos e organograma funcional', 'Estruturação formal de cargos e organograma', 'Estrutura Organizacional', 6, 1.00),
    (journey_pessoas_id, 'PC007', 'Plano de cargos e salários', 'Estruturação de plano de cargos e política salarial', 'Estrutura Organizacional', 7, 1.00),
    (journey_pessoas_id, 'PC008', 'Estruturação de comitês internos (ex: comitê de cultura ou diversidade)', 'Criação de comitês para governança de temas específicos', 'Estrutura Organizacional', 8, 0.80);
    
    -- CATEGORIA: Recrutamento e Seleção (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC009', 'Processo de recrutamento', 'Processo estruturado de recrutamento e seleção', 'Recrutamento e Seleção', 9, 1.00),
    (journey_pessoas_id, 'PC010', 'Perfil comportamental', 'Avaliação e mapeamento de perfis comportamentais', 'Recrutamento e Seleção', 10, 0.90),
    (journey_pessoas_id, 'PC011', 'Jornada do colaborador (onboarding ao offboarding)', 'Processo completo da jornada do colaborador', 'Recrutamento e Seleção', 11, 1.00);
    
    -- CATEGORIA: Desenvolvimento e Treinamento (5 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC012', 'Treinamento', 'Programa estruturado de treinamento e capacitação', 'Desenvolvimento e Treinamento', 12, 1.00),
    (journey_pessoas_id, 'PC013', 'Plano de Desenvolvimento Individual', 'PDI estruturado para desenvolvimento dos colaboradores', 'Desenvolvimento e Treinamento', 13, 1.00),
    (journey_pessoas_id, 'PC014', 'Formação de lideranças', 'Programa de formação e desenvolvimento de líderes', 'Desenvolvimento e Treinamento', 14, 1.00),
    (journey_pessoas_id, 'PC015', 'Programa de liderança contínuo', 'Programa contínuo de desenvolvimento de liderança', 'Desenvolvimento e Treinamento', 15, 0.90),
    (journey_pessoas_id, 'PC016', 'Framework de competências', 'Estruturação de framework de competências organizacionais', 'Desenvolvimento e Treinamento', 16, 0.90);
    
    -- CATEGORIA: Avaliação e Performance (5 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC017', 'Avaliação de desempenho', 'Sistema formal de avaliação de desempenho', 'Avaliação e Performance', 17, 1.00),
    (journey_pessoas_id, 'PC018', 'Feedback estruturado e contínuo', 'Processo estruturado de feedback contínuo', 'Avaliação e Performance', 18, 1.00),
    (journey_pessoas_id, 'PC019', 'Avaliação 360º', 'Sistema de avaliação 360 graus', 'Avaliação e Performance', 19, 0.90),
    (journey_pessoas_id, 'PC020', 'Comunicação de desempenho com base em dados', 'Comunicação de performance baseada em dados', 'Avaliação e Performance', 20, 0.90),
    (journey_pessoas_id, 'PC021', 'Indicadores de RH (turnover, eNPS, absenteísmo)', 'Acompanhamento de indicadores-chave de RH', 'Avaliação e Performance', 21, 1.00);
    
    -- CATEGORIA: Gestão de Equipes (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC022', 'Construção de time', 'Estratégias e práticas de construção de equipes', 'Gestão de Equipes', 22, 1.00),
    (journey_pessoas_id, 'PC023', 'Gestão de clima organizacional', 'Monitoramento e gestão do clima organizacional', 'Gestão de Equipes', 23, 1.00),
    (journey_pessoas_id, 'PC024', 'Plano de sucessão', 'Planejamento de sucessão para posições-chave', 'Gestão de Equipes', 24, 0.90);
    
    -- CATEGORIA: Políticas e Comunicação (3 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC025', 'Comunicação interna', 'Sistema estruturado de comunicação interna', 'Políticas e Comunicação', 25, 1.00),
    (journey_pessoas_id, 'PC026', 'Políticas internas (home office, dress code, conduta etc.)', 'Definição de políticas internas da organização', 'Políticas e Comunicação', 26, 1.00),
    (journey_pessoas_id, 'PC027', 'Partnership', 'Estruturação de parcerias estratégicas com colaboradores', 'Políticas e Comunicação', 27, 0.80);
    
    -- CATEGORIA: Bem-estar e Reconhecimento (2 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PC028', 'Saúde e bem-estar', 'Programas de saúde e bem-estar dos colaboradores', 'Bem-estar e Reconhecimento', 28, 0.90),
    (journey_pessoas_id, 'PC029', 'Reconhecimento e valorização não financeira', 'Sistema de reconhecimento e valorização não monetária', 'Bem-estar e Reconhecimento', 29, 0.90);
    
    -- Validar total de processos inseridos
    RAISE NOTICE 'Processos da Jornada Pessoas e Cultura atualizados. Total: %', (SELECT COUNT(*) FROM processes WHERE journey_id = journey_pessoas_id);
END $$;

-- Reabilitar trigger de histórico
ALTER TABLE processes ENABLE TRIGGER process_history_trigger;

-- Verificar resultado
SELECT 
    'Jornada Pessoas e Cultura' as jornada,
    COUNT(p.id) as total_processos,
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category) as categorias
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'pessoas-cultura'
GROUP BY j.id, j.name;

-- Listar processos por categoria
SELECT 
    p.category,
    COUNT(*) as processos_na_categoria,
    STRING_AGG(p.name, ' | ' ORDER BY p.order_index) as processos
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
WHERE j.slug = 'pessoas-cultura'
GROUP BY p.category
ORDER BY MIN(p.order_index);