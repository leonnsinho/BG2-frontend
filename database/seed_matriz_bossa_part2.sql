-- DADOS SEED - MATRIZ BOSSA DIGITALIZADA - PARTE 2
-- Continuação dos 143 processos: Pessoas/Cultura + Receita/CRM + Operacional

-- =============================================
-- 5. PROCESSOS DA JORNADA PESSOAS E CULTURA (28 processos)
-- =============================================

DO $$
DECLARE
    journey_pessoas_id uuid;
BEGIN
    SELECT id INTO journey_pessoas_id FROM journeys WHERE slug = 'pessoas-cultura';
    
    -- CATEGORIA: Recrutamento e Seleção (6 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_pessoas_id, 'PES001', 'Planejamento de RH', 'Planejamento estratégico de recursos humanos', 'Recrutamento e Seleção', 63, 1.00),
    (journey_pessoas_id, 'PES002', 'Descrição de Cargos', 'Elaboração e atualização de descrições de cargos', 'Recrutamento e Seleção', 64, 0.90),
    (journey_pessoas_id, 'PES003', 'Processo de Recrutamento', 'Processos estruturados de recrutamento', 'Recrutamento e Seleção', 65, 1.00),
    (journey_pessoas_id, 'PES004', 'Processo de Seleção', 'Metodologias e processos de seleção', 'Recrutamento e Seleção', 66, 1.00),
    (journey_pessoas_id, 'PES005', 'Onboarding', 'Processo de integração de novos colaboradores', 'Recrutamento e Seleção', 67, 1.00),
    (journey_pessoas_id, 'PES006', 'Período de Experiência', 'Acompanhamento durante período de experiência', 'Recrutamento e Seleção', 68, 0.80),
    
    -- CATEGORIA: Desenvolvimento e Treinamento (7 processos)
    (journey_pessoas_id, 'PES007', 'Levantamento de Necessidades de Treinamento', 'Identificação de necessidades de capacitação', 'Desenvolvimento e Treinamento', 69, 1.00),
    (journey_pessoas_id, 'PES008', 'Plano de Treinamento', 'Elaboração de plano anual de treinamento', 'Desenvolvimento e Treinamento', 70, 1.00),
    (journey_pessoas_id, 'PES009', 'Treinamentos Técnicos', 'Capacitação técnica específica por função', 'Desenvolvimento e Treinamento', 71, 0.90),
    (journey_pessoas_id, 'PES010', 'Desenvolvimento de Liderança', 'Programas de desenvolvimento de líderes', 'Desenvolvimento e Treinamento', 72, 1.00),
    (journey_pessoas_id, 'PES011', 'Plano de Carreira', 'Estruturação de planos de carreira', 'Desenvolvimento e Treinamento', 73, 0.90),
    (journey_pessoas_id, 'PES012', 'Avaliação de Treinamentos', 'Avaliação da eficácia dos treinamentos', 'Desenvolvimento e Treinamento', 74, 0.80),
    (journey_pessoas_id, 'PES013', 'Educação Corporativa', 'Sistema de educação corporativa continuada', 'Desenvolvimento e Treinamento', 75, 0.70),
    
    -- CATEGORIA: Avaliação de Performance (6 processos)
    (journey_pessoas_id, 'PES014', 'Sistema de Avaliação de Desempenho', 'Metodologia estruturada de avaliação', 'Avaliação de Performance', 76, 1.00),
    (journey_pessoas_id, 'PES015', 'Definição de Metas Individuais', 'Estabelecimento de metas individuais', 'Avaliação de Performance', 77, 1.00),
    (journey_pessoas_id, 'PES016', 'Feedback Contínuo', 'Sistema de feedback regular e estruturado', 'Avaliação de Performance', 78, 1.00),
    (journey_pessoas_id, 'PES017', 'Avaliação 360 Graus', 'Avaliação multifonte de competências', 'Avaliação de Performance', 79, 0.80),
    (journey_pessoas_id, 'PES018', 'Plano de Desenvolvimento Individual', 'PDI baseado em avaliações de performance', 'Avaliação de Performance', 80, 0.90),
    (journey_pessoas_id, 'PES019', 'Reconhecimento e Recompensa', 'Sistema de reconhecimento de performance', 'Avaliação de Performance', 81, 0.90),
    
    -- CATEGORIA: Remuneração e Benefícios (5 processos)
    (journey_pessoas_id, 'PES020', 'Estrutura Salarial', 'Definição de estrutura salarial por cargo', 'Remuneração e Benefícios', 82, 1.00),
    (journey_pessoas_id, 'PES021', 'Política de Remuneração', 'Políticas claras de remuneração', 'Remuneração e Benefícios', 83, 1.00),
    (journey_pessoas_id, 'PES022', 'Programa de Benefícios', 'Estruturação de pacote de benefícios', 'Remuneração e Benefícios', 84, 0.90),
    (journey_pessoas_id, 'PES023', 'Remuneração Variável', 'Sistema de remuneração variável por performance', 'Remuneração e Benefícios', 85, 0.80),
    (journey_pessoas_id, 'PES024', 'Pesquisa Salarial', 'Pesquisa de mercado para posicionamento salarial', 'Remuneração e Benefícios', 86, 0.80),
    
    -- CATEGORIA: Cultura e Clima (4 processos)
    (journey_pessoas_id, 'PES025', 'Pesquisa de Clima Organizacional', 'Avaliação periódica do clima organizacional', 'Cultura e Clima', 87, 1.00),
    (journey_pessoas_id, 'PES026', 'Programa de Cultura', 'Iniciativas para fortalecimento da cultura', 'Cultura e Clima', 88, 0.90),
    (journey_pessoas_id, 'PES027', 'Comunicação Interna', 'Sistema estruturado de comunicação interna', 'Cultura e Clima', 89, 0.90),
    (journey_pessoas_id, 'PES028', 'Programa de Qualidade de Vida', 'Iniciativas de qualidade de vida no trabalho', 'Cultura e Clima', 90, 0.80);
END $$;

-- =============================================
-- 6. PROCESSOS DA JORNADA RECEITA/CRM (28 processos)
-- =============================================

DO $$
DECLARE
    journey_receita_id uuid;
BEGIN
    SELECT id INTO journey_receita_id FROM journeys WHERE slug = 'receita-crm';
    
    -- CATEGORIA: Estratégia Comercial (7 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_receita_id, 'CRM001', 'Planejamento Comercial', 'Planejamento estratégico de vendas e metas', 'Estratégia Comercial', 91, 1.00),
    (journey_receita_id, 'CRM002', 'Segmentação de Mercado', 'Definição e análise de segmentos de mercado', 'Estratégia Comercial', 92, 1.00),
    (journey_receita_id, 'CRM003', 'Definição de Persona', 'Criação de personas detalhadas dos clientes', 'Estratégia Comercial', 93, 0.90),
    (journey_receita_id, 'CRM004', 'Posicionamento de Mercado', 'Estratégia de posicionamento competitivo', 'Estratégia Comercial', 94, 0.90),
    (journey_receita_id, 'CRM005', 'Política de Preços', 'Definição de estratégia e política de preços', 'Estratégia Comercial', 95, 1.00),
    (journey_receita_id, 'CRM006', 'Canais de Vendas', 'Estruturação e gestão de canais de vendas', 'Estratégia Comercial', 96, 1.00),
    (journey_receita_id, 'CRM007', 'Território de Vendas', 'Definição e gestão de territórios comerciais', 'Estratégia Comercial', 97, 0.80),
    
    -- CATEGORIA: Processo de Vendas (8 processos)
    (journey_receita_id, 'CRM008', 'Funil de Vendas', 'Estruturação e gestão do funil de vendas', 'Processo de Vendas', 98, 1.00),
    (journey_receita_id, 'CRM009', 'Prospecção de Clientes', 'Processos estruturados de prospecção', 'Processo de Vendas', 99, 1.00),
    (journey_receita_id, 'CRM010', 'Qualificação de Leads', 'Metodologia para qualificação de leads', 'Processo de Vendas', 100, 1.00),
    (journey_receita_id, 'CRM011', 'Apresentação de Vendas', 'Padronização de apresentações comerciais', 'Processo de Vendas', 101, 0.90),
    (journey_receita_id, 'CRM012', 'Negociação e Fechamento', 'Técnicas e processos de negociação', 'Processo de Vendas', 102, 1.00),
    (journey_receita_id, 'CRM013', 'Follow-up de Vendas', 'Sistema estruturado de follow-up', 'Processo de Vendas', 103, 0.90),
    (journey_receita_id, 'CRM014', 'Proposta Comercial', 'Padronização de propostas comerciais', 'Processo de Vendas', 104, 0.90),
    (journey_receita_id, 'CRM015', 'Contratos e Documentação', 'Gestão de contratos e documentação de vendas', 'Processo de Vendas', 105, 0.80),
    
    -- CATEGORIA: Relacionamento com Cliente (7 processos)
    (journey_receita_id, 'CRM016', 'Sistema CRM', 'Implementação e gestão de sistema CRM', 'Relacionamento com Cliente', 106, 1.00),
    (journey_receita_id, 'CRM017', 'Atendimento ao Cliente', 'Processos de atendimento e suporte', 'Relacionamento com Cliente', 107, 1.00),
    (journey_receita_id, 'CRM018', 'Pós-venda', 'Sistema estruturado de pós-venda', 'Relacionamento com Cliente', 108, 1.00),
    (journey_receita_id, 'CRM019', 'Programa de Fidelização', 'Iniciativas para fidelização de clientes', 'Relacionamento com Cliente', 109, 0.80),
    (journey_receita_id, 'CRM020', 'Pesquisa de Satisfação', 'Avaliação regular de satisfação do cliente', 'Relacionamento com Cliente', 110, 1.00),
    (journey_receita_id, 'CRM021', 'Cross-sell e Up-sell', 'Estratégias de vendas cruzadas e adicionais', 'Relacionamento com Cliente', 111, 0.90),
    (journey_receita_id, 'CRM022', 'Gestão de Reclamações', 'Sistema para gestão de reclamações', 'Relacionamento com Cliente', 112, 1.00),
    
    -- CATEGORIA: Análise e Performance (6 processos)
    (journey_receita_id, 'CRM023', 'Métricas de Vendas', 'Definição e acompanhamento de KPIs comerciais', 'Análise e Performance', 113, 1.00),
    (journey_receita_id, 'CRM024', 'Análise de Conversão', 'Análise de taxas de conversão do funil', 'Análise e Performance', 114, 1.00),
    (journey_receita_id, 'CRM025', 'Previsão de Vendas', 'Sistema de forecasting de vendas', 'Análise e Performance', 115, 1.00),
    (journey_receita_id, 'CRM026', 'Análise de Rentabilidade por Cliente', 'Avaliação de rentabilidade por cliente', 'Análise e Performance', 116, 1.00),
    (journey_receita_id, 'CRM027', 'Dashboard Comercial', 'Dashboard executivo de vendas', 'Análise e Performance', 117, 0.90),
    (journey_receita_id, 'CRM028', 'Relatórios Comerciais', 'Relatórios gerenciais de vendas', 'Análise e Performance', 118, 0.80);
END $$;

-- =============================================
-- 7. PROCESSOS DA JORNADA OPERACIONAL (25 processos)
-- =============================================

DO $$
DECLARE
    journey_operacional_id uuid;
BEGIN
    SELECT id INTO journey_operacional_id FROM journeys WHERE slug = 'operacional';
    
    -- CATEGORIA: Gestão de Processos (8 processos)
    INSERT INTO processes (journey_id, code, name, description, category, order_index, weight) VALUES
    (journey_operacional_id, 'OPE001', 'Mapeamento de Processos', 'Mapeamento detalhado dos processos organizacionais', 'Gestão de Processos', 119, 1.00),
    (journey_operacional_id, 'OPE002', 'Padronização de Processos', 'Padronização e documentação de processos', 'Gestão de Processos', 120, 1.00),
    (journey_operacional_id, 'OPE003', 'Melhoria Contínua', 'Sistema estruturado de melhoria contínua', 'Gestão de Processos', 121, 1.00),
    (journey_operacional_id, 'OPE004', 'Indicadores de Processo', 'Definição de KPIs operacionais por processo', 'Gestão de Processos', 122, 1.00),
    (journey_operacional_id, 'OPE005', 'Análise de Capacidade', 'Análise de capacidade dos processos', 'Gestão de Processos', 123, 0.90),
    (journey_operacional_id, 'OPE006', 'Gestão de Gargalos', 'Identificação e gestão de gargalos operacionais', 'Gestão de Processos', 124, 1.00),
    (journey_operacional_id, 'OPE007', 'Automação de Processos', 'Identificação e implementação de automações', 'Gestão de Processos', 125, 0.90),
    (journey_operacional_id, 'OPE008', 'Controle de Workflow', 'Sistema de controle de fluxo de trabalho', 'Gestão de Processos', 126, 0.80),
    
    -- CATEGORIA: Qualidade (7 processos)
    (journey_operacional_id, 'OPE009', 'Sistema de Gestão da Qualidade', 'Implementação de SGQ (ISO 9001 ou similar)', 'Qualidade', 127, 1.00),
    (journey_operacional_id, 'OPE010', 'Controle de Qualidade', 'Processos de controle de qualidade de produtos/serviços', 'Qualidade', 128, 1.00),
    (journey_operacional_id, 'OPE011', 'Auditoria de Qualidade', 'Sistema de auditorias internas de qualidade', 'Qualidade', 129, 0.90),
    (journey_operacional_id, 'OPE012', 'Tratamento de Não Conformidades', 'Gestão de não conformidades e ações corretivas', 'Qualidade', 130, 1.00),
    (journey_operacional_id, 'OPE013', 'Calibração e Manutenção', 'Sistema de calibração de equipamentos', 'Qualidade', 131, 0.80),
    (journey_operacional_id, 'OPE014', 'Satisfação do Cliente Interno', 'Avaliação de satisfação de clientes internos', 'Qualidade', 132, 0.80),
    (journey_operacional_id, 'OPE015', 'Certificações e Normas', 'Gestão de certificações e conformidade com normas', 'Qualidade', 133, 0.80),
    
    -- CATEGORIA: Produtividade e Eficiência (6 processos)
    (journey_operacional_id, 'OPE016', 'Medição de Produtividade', 'Sistema de medição de produtividade', 'Produtividade e Eficiência', 134, 1.00),
    (journey_operacional_id, 'OPE017', 'Gestão de Recursos', 'Otimização no uso de recursos operacionais', 'Produtividade e Eficiência', 135, 1.00),
    (journey_operacional_id, 'OPE018', 'Planejamento da Produção', 'Sistema de planejamento e controle da produção', 'Produtividade e Eficiência', 136, 0.90),
    (journey_operacional_id, 'OPE019', 'Gestão de Estoques', 'Controle e otimização de estoques', 'Produtividade e Eficiência', 137, 0.90),
    (journey_operacional_id, 'OPE020', 'Logística Interna', 'Otimização da logística interna', 'Produtividade e Eficiência', 138, 0.80),
    (journey_operacional_id, 'OPE021', 'Gestão de Fornecedores', 'Sistema de gestão e avaliação de fornecedores', 'Produtividade e Eficiência', 139, 0.90),
    
    -- CATEGORIA: Tecnologia e Inovação (4 processos)
    (journey_operacional_id, 'OPE022', 'Gestão de TI', 'Governança e gestão de tecnologia da informação', 'Tecnologia e Inovação', 140, 0.90),
    (journey_operacional_id, 'OPE023', 'Segurança da Informação', 'Sistema de segurança da informação', 'Tecnologia e Inovação', 141, 0.90),
    (journey_operacional_id, 'OPE024', 'Inovação Operacional', 'Processos de inovação em operações', 'Tecnologia e Inovação', 142, 0.80),
    (journey_operacional_id, 'OPE025', 'Gestão do Conhecimento', 'Sistema de gestão do conhecimento organizacional', 'Tecnologia e Inovação', 143, 0.80);
END $$;

-- =============================================
-- 8. RESUMO FINAL E VALIDAÇÃO
-- =============================================

-- Validar contagem total de processos
SELECT 
    j.name as jornada,
    COUNT(p.id) as total_processos
FROM journeys j
LEFT JOIN processes p ON j.id = p.journey_id
GROUP BY j.id, j.name, j.order_index
ORDER BY j.order_index;

-- Validar total geral
SELECT COUNT(*) as total_processos_geral FROM processes;

-- =============================================
-- MATRIZ BOSSA COMPLETA!
-- 5 Jornadas ✓
-- 143 Processos ✓
-- Sistema de versionamento ✓
-- Estrutura de avaliação ✓
-- =============================================