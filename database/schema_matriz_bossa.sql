-- MATRIZ BOSSA DIGITALIZADA - DATABASE SCHEMA
-- Marco 3 - Estrutura Base para 5 Jornadas e 143 Processos

-- =============================================
-- 1. TABELA DE JORNADAS (5 principais)
-- =============================================

CREATE TABLE IF NOT EXISTS journeys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'target',
  order_index integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS journeys_slug_idx ON journeys(slug);
CREATE INDEX IF NOT EXISTS journeys_active_idx ON journeys(is_active);
CREATE INDEX IF NOT EXISTS journeys_order_idx ON journeys(order_index);

-- =============================================
-- 2. TABELA DE PROCESSOS (143 total)
-- =============================================

CREATE TABLE IF NOT EXISTS processes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  journey_id uuid REFERENCES journeys(id) ON DELETE CASCADE,
  code text NOT NULL, -- Código único do processo (ex: EST001, FIN001)
  name text NOT NULL,
  description text,
  detailed_description text,
  category text, -- Sub-categoria dentro da jornada
  order_index integer NOT NULL,
  weight decimal(3,2) DEFAULT 1.00, -- Peso do processo no cálculo geral
  evaluation_criteria jsonb, -- Critérios específicos de avaliação
  best_practices text[], -- Array de melhores práticas
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(journey_id, code)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS processes_journey_idx ON processes(journey_id);
CREATE INDEX IF NOT EXISTS processes_code_idx ON processes(code);
CREATE INDEX IF NOT EXISTS processes_category_idx ON processes(category);
CREATE INDEX IF NOT EXISTS processes_active_idx ON processes(is_active);

-- =============================================
-- 3. TABELA DE AVALIAÇÕES/SCORES (0-5)
-- =============================================

CREATE TABLE IF NOT EXISTS process_evaluations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  diagnosis_id uuid, -- Referência ao diagnóstico específico
  evaluator_id uuid REFERENCES profiles(id), -- Quem fez a avaliação
  
  -- Scores (0-5 scale)
  current_score integer CHECK (current_score >= 0 AND current_score <= 5),
  target_score integer CHECK (target_score >= 0 AND target_score <= 5),
  
  -- Dados da avaliação
  evaluation_notes text,
  evidence_files text[], -- Links para arquivos de evidência
  improvement_plan text,
  deadline date,
  responsible_user_id uuid REFERENCES profiles(id),
  
  -- Status e controle
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  confidence_level integer CHECK (confidence_level >= 1 AND confidence_level <= 5),
  
  -- Auditoria
  evaluated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  UNIQUE(company_id, process_id, diagnosis_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS evaluations_company_idx ON process_evaluations(company_id);
CREATE INDEX IF NOT EXISTS evaluations_process_idx ON process_evaluations(process_id);
CREATE INDEX IF NOT EXISTS evaluations_diagnosis_idx ON process_evaluations(diagnosis_id);
CREATE INDEX IF NOT EXISTS evaluations_status_idx ON process_evaluations(status);
CREATE INDEX IF NOT EXISTS evaluations_evaluator_idx ON process_evaluations(evaluator_id);

-- =============================================
-- 4. TABELA DE DIAGNÓSTICOS POR EMPRESA
-- =============================================

CREATE TABLE IF NOT EXISTS company_diagnoses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  consultant_id uuid REFERENCES profiles(id), -- Consultor responsável
  
  -- Dados do diagnóstico
  name text NOT NULL,
  description text,
  diagnosis_type text DEFAULT 'complete' CHECK (diagnosis_type IN ('initial', 'follow_up', 'complete', 'partial')),
  
  -- Status e progresso
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'approved', 'archived')),
  completion_percentage decimal(5,2) DEFAULT 0.00,
  
  -- Scores gerais calculados
  overall_maturity_score decimal(5,2), -- Score geral de maturidade
  journey_scores jsonb, -- Scores por jornada: {"strategic": 3.2, "financial": 2.8, ...}
  
  -- Datas importantes
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  approved_at timestamp with time zone,
  
  -- Dados de baseline e meta
  baseline_date date,
  target_date date,
  
  -- Relatório e arquivos
  executive_summary text,
  detailed_report text,
  recommendations jsonb, -- Recomendações estruturadas
  attachments text[], -- Links para arquivos anexos
  
  -- Auditoria
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS diagnoses_company_idx ON company_diagnoses(company_id);
CREATE INDEX IF NOT EXISTS diagnoses_consultant_idx ON company_diagnoses(consultant_id);
CREATE INDEX IF NOT EXISTS diagnoses_status_idx ON company_diagnoses(status);
CREATE INDEX IF NOT EXISTS diagnoses_type_idx ON company_diagnoses(diagnosis_type);

-- =============================================
-- 5. SISTEMA DE VERSIONAMENTO
-- =============================================

CREATE TABLE IF NOT EXISTS matrix_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version_number text NOT NULL UNIQUE,
  description text,
  changes_summary jsonb, -- Resumo das mudanças
  
  -- Controle de ativação
  is_active boolean DEFAULT false,
  activated_at timestamp with time zone,
  activated_by uuid REFERENCES profiles(id),
  
  -- Dados da versão
  total_journeys integer,
  total_processes integer,
  migration_notes text,
  
  -- Auditoria
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 6. TABELA DE HISTÓRICO DE MUDANÇAS
-- =============================================

CREATE TABLE IF NOT EXISTS process_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES profiles(id),
  change_type text CHECK (change_type IN ('created', 'updated', 'deleted', 'activated', 'deactivated')),
  
  -- Dados da mudança
  old_data jsonb,
  new_data jsonb,
  change_description text,
  
  -- Contexto
  matrix_version_id uuid REFERENCES matrix_versions(id),
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 7. VIEWS ÚTEIS PARA CONSULTAS
-- =============================================

-- View para diagnósticos com dados agregados
CREATE OR REPLACE VIEW diagnosis_summary AS
SELECT 
  cd.*,
  c.name as company_name,
  p.full_name as consultant_name,
  COUNT(pe.id) as total_evaluations,
  COUNT(CASE WHEN pe.current_score IS NOT NULL THEN 1 END) as completed_evaluations,
  AVG(pe.current_score) as average_current_score,
  AVG(pe.target_score) as average_target_score
FROM company_diagnoses cd
LEFT JOIN companies c ON cd.company_id = c.id
LEFT JOIN profiles p ON cd.consultant_id = p.id
LEFT JOIN process_evaluations pe ON pe.diagnosis_id = cd.id
GROUP BY cd.id, c.name, p.full_name;

-- View para maturidade por jornada
CREATE OR REPLACE VIEW journey_maturity AS
SELECT 
  j.id as journey_id,
  j.name as journey_name,
  cd.id as diagnosis_id,
  cd.company_id,
  AVG(pe.current_score) as current_maturity,
  AVG(pe.target_score) as target_maturity,
  COUNT(pe.id) as total_processes,
  COUNT(CASE WHEN pe.current_score IS NOT NULL THEN 1 END) as evaluated_processes
FROM journeys j
LEFT JOIN processes pr ON pr.journey_id = j.id
LEFT JOIN process_evaluations pe ON pe.process_id = pr.id
LEFT JOIN company_diagnoses cd ON cd.id = pe.diagnosis_id
WHERE j.is_active = true AND pr.is_active = true
GROUP BY j.id, j.name, cd.id, cd.company_id;

-- =============================================
-- 8. TRIGGERS PARA AUDITORIA E ATUALIZAÇÃO
-- =============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas principais
CREATE TRIGGER update_journeys_updated_at BEFORE UPDATE ON journeys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON process_evaluations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON company_diagnoses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_versions_updated_at BEFORE UPDATE ON matrix_versions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger para histórico de processos
CREATE OR REPLACE FUNCTION log_process_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO process_history (process_id, change_type, old_data, changed_by)
        VALUES (OLD.id, 'deleted', row_to_json(OLD), null);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO process_history (process_id, change_type, old_data, new_data, changed_by)
        VALUES (NEW.id, 'updated', row_to_json(OLD), row_to_json(NEW), null);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO process_history (process_id, change_type, new_data, changed_by)
        VALUES (NEW.id, 'created', row_to_json(NEW), null);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER process_history_trigger
    AFTER INSERT OR UPDATE OR DELETE ON processes
    FOR EACH ROW EXECUTE PROCEDURE log_process_changes();

-- =============================================
-- 9. RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_versions ENABLE ROW LEVEL SECURITY;

-- Policies básicas (Super Admin vê tudo)
CREATE POLICY "Super admins can do everything on journeys" ON journeys
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Super admins can do everything on processes" ON processes
  FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

-- Consultores podem ver avaliações das suas empresas
CREATE POLICY "Consultants can manage their companies evaluations" ON process_evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_companies uc 
      WHERE uc.user_id = auth.uid() 
      AND uc.company_id = process_evaluations.company_id 
      AND uc.is_active = true
      AND uc.role IN ('consultant', 'company_admin')
    )
  );

-- Company Admins podem gerenciar diagnósticos da sua empresa
CREATE POLICY "Company admins can manage their company diagnoses" ON company_diagnoses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_companies uc 
      WHERE uc.user_id = auth.uid() 
      AND uc.company_id = company_diagnoses.company_id 
      AND uc.is_active = true
      AND uc.role IN ('consultant', 'company_admin')
    )
  );

-- =============================================
-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE journeys IS 'As 5 jornadas principais da metodologia Bossa Focus';
COMMENT ON TABLE processes IS 'Os 143 processos distribuídos entre as jornadas';
COMMENT ON TABLE process_evaluations IS 'Avaliações de maturidade dos processos por empresa';
COMMENT ON TABLE company_diagnoses IS 'Diagnósticos completos de empresas';
COMMENT ON TABLE matrix_versions IS 'Controle de versões da matriz de processos';
COMMENT ON TABLE process_history IS 'Histórico de mudanças nos processos';

-- =============================================
-- ESTRUTURA COMPLETA CRIADA!
-- Total: 6 tabelas principais + 2 views + triggers + RLS
-- Preparada para receber os dados das 5 jornadas e 143 processos
-- =============================================