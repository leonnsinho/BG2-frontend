-- ================================================================
-- NINE BOX - AVALIAÇÃO DE DESEMPENHO
-- ================================================================

-- Tabela de Avaliações Nine Box
CREATE TABLE IF NOT EXISTS performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Posição na matriz (1-3 para cada eixo)
  performance_level INT NOT NULL CHECK (performance_level BETWEEN 1 AND 3),
  potential_level INT NOT NULL CHECK (potential_level BETWEEN 1 AND 3),
  
  -- Classificação resultante
  classification VARCHAR(50) NOT NULL, -- 'star', 'promise', 'enigma', 'pillar', 'core', 'risk', 'specialist', 'maintainer', 'low_performer'
  
  -- Informações da avaliação
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Data da avaliação
  notes TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  development_plan TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Movimentações (tracking de evolução)
CREATE TABLE IF NOT EXISTS performance_evaluation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES performance_evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Posição anterior e nova
  previous_performance INT,
  previous_potential INT,
  new_performance INT NOT NULL,
  new_potential INT NOT NULL,
  
  -- Classificação
  previous_classification VARCHAR(50),
  new_classification VARCHAR(50) NOT NULL,
  
  -- Razão da mudança
  change_reason TEXT,
  evaluator_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Metas e Ações de Desenvolvimento
CREATE TABLE IF NOT EXISTS performance_development_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES performance_evaluations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  action_type VARCHAR(50) NOT NULL, -- 'training', 'mentoring', 'project', 'goal', 'other'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_performance_evaluations_user ON performance_evaluations(user_id);
CREATE INDEX idx_performance_evaluations_company ON performance_evaluations(company_id);
CREATE INDEX idx_performance_evaluations_date ON performance_evaluations(evaluation_date);
CREATE INDEX idx_performance_evaluations_classification ON performance_evaluations(classification);
CREATE INDEX idx_performance_history_user ON performance_evaluation_history(user_id);
CREATE INDEX idx_development_actions_user ON performance_development_actions(user_id);
CREATE INDEX idx_development_actions_status ON performance_development_actions(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_performance_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_performance_evaluation_updated_at
BEFORE UPDATE ON performance_evaluations
FOR EACH ROW
EXECUTE FUNCTION update_performance_evaluation_updated_at();

CREATE TRIGGER trigger_update_development_actions_updated_at
BEFORE UPDATE ON performance_development_actions
FOR EACH ROW
EXECUTE FUNCTION update_performance_evaluation_updated_at();

-- RLS Policies
ALTER TABLE performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_evaluation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_development_actions ENABLE ROW LEVEL SECURITY;

-- Política: Super Admin pode tudo
CREATE POLICY "Super Admin full access to evaluations"
ON performance_evaluations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super Admin full access to history"
ON performance_evaluation_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "Super Admin full access to actions"
ON performance_development_actions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

-- Política: Company Admin pode ver/editar avaliações da sua empresa
CREATE POLICY "Company Admin access to evaluations"
ON performance_evaluations
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
    AND role = 'company_admin'
  )
);

CREATE POLICY "Company Admin access to history"
ON performance_evaluation_history
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
    AND role = 'company_admin'
  )
);

CREATE POLICY "Company Admin access to actions"
ON performance_development_actions
FOR ALL
USING (
  company_id IN (
    SELECT company_id FROM user_companies
    WHERE user_id = auth.uid()
    AND role = 'company_admin'
  )
);

-- Política: Usuários podem ver suas próprias avaliações
CREATE POLICY "Users can view their own evaluations"
ON performance_evaluations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own history"
ON performance_evaluation_history
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own actions"
ON performance_development_actions
FOR SELECT
USING (user_id = auth.uid());

-- Função para obter classificação baseada na posição
CREATE OR REPLACE FUNCTION get_nine_box_classification(perf INT, pot INT)
RETURNS VARCHAR AS $$
BEGIN
  -- Performance: 3=Alto, 2=Médio, 1=Baixo
  -- Potential: 3=Alto, 2=Médio, 1=Baixo
  CASE
    WHEN perf = 3 AND pot = 3 THEN RETURN 'star';           -- Estrela
    WHEN perf = 3 AND pot = 2 THEN RETURN 'pillar';         -- Pilar
    WHEN perf = 3 AND pot = 1 THEN RETURN 'specialist';     -- Especialista
    WHEN perf = 2 AND pot = 3 THEN RETURN 'promise';        -- Promessa
    WHEN perf = 2 AND pot = 2 THEN RETURN 'core';           -- Core Player
    WHEN perf = 2 AND pot = 1 THEN RETURN 'maintainer';     -- Mantenedor
    WHEN perf = 1 AND pot = 3 THEN RETURN 'enigma';         -- Enigma
    WHEN perf = 1 AND pot = 2 THEN RETURN 'risk';           -- Risco
    WHEN perf = 1 AND pot = 1 THEN RETURN 'low_performer';  -- Baixo Desempenho
    ELSE RETURN 'unknown';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- View para estatísticas da matriz (última avaliação de cada usuário)
CREATE OR REPLACE VIEW nine_box_statistics AS
SELECT 
  company_id,
  DATE_TRUNC('month', evaluation_date) as evaluation_month,
  classification,
  COUNT(*) as count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER (PARTITION BY company_id, DATE_TRUNC('month', evaluation_date)) * 100, 2) as percentage
FROM (
  SELECT DISTINCT ON (user_id, company_id)
    user_id,
    company_id,
    evaluation_date,
    classification
  FROM performance_evaluations
  ORDER BY user_id, company_id, evaluation_date DESC
) latest_evaluations
GROUP BY company_id, DATE_TRUNC('month', evaluation_date), classification;

COMMENT ON TABLE performance_evaluations IS 'Avaliações de desempenho usando metodologia Nine Box - permite múltiplas avaliações por usuário ao longo do tempo';
COMMENT ON TABLE performance_evaluation_history IS 'Histórico de mudanças nas avaliações para tracking de evolução';
COMMENT ON TABLE performance_development_actions IS 'Planos de desenvolvimento e ações para colaboradores';
