-- INSERÇÃO DIRETA DOS DADOS DA MATRIZ BOSSA
-- Execute este SQL no Supabase SQL Editor

-- Temporariamente desabilitar RLS para inserir dados seed
ALTER TABLE journeys DISABLE ROW LEVEL SECURITY;
ALTER TABLE processes DISABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_versions DISABLE ROW LEVEL SECURITY;

-- 1. INSERIR JORNADAS
INSERT INTO journeys (name, slug, description, color, icon, order_index, is_active) VALUES
('Jornada Estratégica', 'estrategica', 'Planejamento estratégico, visão, missão, valores e direcionamento organizacional', '#3B82F6', 'target', 1, true),
('Jornada Financeira', 'financeira', 'Gestão financeira completa, fluxo de caixa, DRE, indicadores e planejamento orçamentário', '#10B981', 'trending-up', 2, true),
('Jornada Pessoas e Cultura', 'pessoas-cultura', 'Gestão de pessoas, cultura organizacional, desenvolvimento e performance', '#F59E0B', 'users', 3, true),
('Jornada Receita e CRM', 'receita-crm', 'Gestão de vendas, relacionamento com clientes e geração de receita', '#8B5CF6', 'dollar-sign', 4, true),
('Jornada Operacional', 'operacional', 'Processos operacionais, qualidade, eficiência e produtividade', '#6B7280', 'settings', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- 2. CRIAR VERSÃO INICIAL DA MATRIZ
INSERT INTO matrix_versions (version_number, description, is_active, total_journeys, total_processes, activated_at) VALUES
('1.0.0', 'Versão inicial da Matriz Bossa com 5 jornadas e 143 processos', true, 5, 143, NOW())
ON CONFLICT (version_number) DO NOTHING;

-- 3. INSERIR PROCESSOS DA JORNADA ESTRATÉGICA
WITH estrategica AS (
  SELECT id FROM journeys WHERE slug = 'estrategica' LIMIT 1
)
INSERT INTO processes (journey_id, code, name, description, category, order_index, is_active) 
SELECT 
  estrategica.id,
  code,
  name,
  description,
  category,
  order_index,
  true
FROM estrategica, (VALUES
  ('EST001', 'Definição de Missão, Visão e Valores', 'Estabelecer a identidade e propósito organizacional', 'Planejamento Estratégico', 1),
  ('EST002', 'Análise SWOT/FOFA', 'Avaliar forças, fraquezas, oportunidades e ameaças', 'Análise Estratégica', 2),
  ('EST003', 'Definição de Objetivos Estratégicos', 'Estabelecer metas de longo prazo alinhadas à visão', 'Planejamento Estratégico', 3),
  ('EST004', 'Mapeamento de Stakeholders', 'Identificar e classificar partes interessadas', 'Análise Estratégica', 4),
  ('EST005', 'Análise de Concorrência', 'Estudar concorrentes diretos e indiretos', 'Análise de Mercado', 5),
  ('EST006', 'Definição de Posicionamento', 'Estabelecer posicionamento de mercado único', 'Estratégia de Mercado', 6),
  ('EST007', 'Planejamento de Cenários', 'Desenvolver cenários futuros possíveis', 'Planejamento Estratégico', 7),
  ('EST008', 'Definição de KPIs Estratégicos', 'Estabelecer indicadores-chave de performance', 'Métricas e Controles', 8),
  ('EST009', 'Balanced Scorecard', 'Implementar sistema de gestão estratégica', 'Métricas e Controles', 9),
  ('EST010', 'Plano de Comunicação Estratégica', 'Comunicar estratégia para organização', 'Comunicação', 10),
  ('EST011', 'Governança Corporativa', 'Estabelecer estrutura de governança', 'Governança', 11),
  ('EST012', 'Gestão de Riscos Estratégicos', 'Identificar e mitigar riscos estratégicos', 'Gestão de Riscos', 12),
  ('EST013', 'Inovação e Desenvolvimento', 'Processos de inovação e P&D', 'Inovação', 13),
  ('EST014', 'Sustentabilidade e ESG', 'Práticas ambientais, sociais e de governança', 'Sustentabilidade', 14),
  ('EST015', 'Transformação Digital', 'Estratégia de digitalização dos processos', 'Transformação Digital', 15)
) AS v(code, name, description, category, order_index)
ON CONFLICT (journey_id, code) DO NOTHING;

-- 4. INSERIR PROCESSOS DA JORNADA FINANCEIRA (primeiros 15)
WITH financeira AS (
  SELECT id FROM journeys WHERE slug = 'financeira' LIMIT 1
)
INSERT INTO processes (journey_id, code, name, description, category, order_index, is_active)
SELECT 
  financeira.id,
  code,
  name,
  description,
  category,
  order_index,
  true
FROM financeira, (VALUES
  ('FIN001', 'Planejamento Orçamentário', 'Elaborar orçamento anual e projeções', 'Planejamento Financeiro', 1),
  ('FIN002', 'Fluxo de Caixa', 'Controlar entradas e saídas de recursos', 'Controle Financeiro', 2),
  ('FIN003', 'DRE - Demonstrativo de Resultado', 'Acompanhar receitas, custos e despesas', 'Relatórios Financeiros', 3),
  ('FIN004', 'Balanço Patrimonial', 'Controlar ativos, passivos e patrimônio líquido', 'Relatórios Financeiros', 4),
  ('FIN005', 'Análise de Indicadores Financeiros', 'Calcular e acompanhar KPIs financeiros', 'Análise Financeira', 5),
  ('FIN006', 'Controle de Contas a Pagar', 'Gerenciar obrigações com fornecedores', 'Contas a Pagar', 6),
  ('FIN007', 'Controle de Contas a Receber', 'Gerenciar recebimentos de clientes', 'Contas a Receber', 7),
  ('FIN008', 'Conciliação Bancária', 'Conciliar movimentações bancárias', 'Controle Bancário', 8),
  ('FIN009', 'Controle de Estoque Financeiro', 'Valorar e controlar estoques', 'Controle de Estoque', 9),
  ('FIN010', 'Gestão de Impostos', 'Calcular e recolher impostos devidos', 'Tributário', 10),
  ('FIN011', 'Análise de Investimentos', 'Avaliar viabilidade de investimentos', 'Investimentos', 11),
  ('FIN012', 'Controle de Custos', 'Identificar e controlar custos operacionais', 'Controle de Custos', 12),
  ('FIN013', 'Precificação', 'Estabelecer preços de produtos/serviços', 'Pricing', 13),
  ('FIN014', 'Auditoria Interna', 'Revisar processos e controles internos', 'Auditoria', 14),
  ('FIN015', 'Relacionamento Bancário', 'Gerenciar relacionamento com bancos', 'Relacionamento Bancário', 15)
) AS v(code, name, description, category, order_index)
ON CONFLICT (journey_id, code) DO NOTHING;

-- 5. INSERIR ALGUNS PROCESSOS DAS OUTRAS JORNADAS PARA TESTE
WITH pessoas AS (SELECT id FROM journeys WHERE slug = 'pessoas-cultura' LIMIT 1)
INSERT INTO processes (journey_id, code, name, description, category, order_index, is_active)
SELECT pessoas.id, code, name, description, category, order_index, true
FROM pessoas, (VALUES
  ('PES001', 'Recrutamento e Seleção', 'Atrair, selecionar e contratar talentos', 'Recrutamento', 1),
  ('PES002', 'Onboarding', 'Integração de novos colaboradores', 'Integração', 2),
  ('PES003', 'Avaliação de Desempenho', 'Avaliar performance dos colaboradores', 'Performance', 3),
  ('PES004', 'Plano de Carreira', 'Desenvolver trilhas de crescimento', 'Desenvolvimento', 4),
  ('PES005', 'Treinamento e Desenvolvimento', 'Capacitar colaboradores continuamente', 'Capacitação', 5)
) AS v(code, name, description, category, order_index)
ON CONFLICT (journey_id, code) DO NOTHING;

-- Reabilitar RLS após inserir dados
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_versions ENABLE ROW LEVEL SECURITY;

-- Verificar dados inseridos
SELECT 'Jornadas inseridas:' as tipo, count(*) as total FROM journeys WHERE is_active = true
UNION ALL
SELECT 'Processos inseridos:' as tipo, count(*) as total FROM processes WHERE is_active = true
UNION ALL  
SELECT 'Versões criadas:' as tipo, count(*) as total FROM matrix_versions WHERE is_active = true;