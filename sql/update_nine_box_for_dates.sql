-- Migração: Atualizar Nine Box para usar datas em vez de períodos

-- 1. Adicionar coluna evaluation_date se não existir
ALTER TABLE performance_evaluations 
ADD COLUMN IF NOT EXISTS evaluation_date DATE DEFAULT CURRENT_DATE;

-- 2. Migrar dados existentes de evaluation_period para evaluation_date
-- (converter períodos como "2025" para 2025-01-01, "2025 Q1" para 2025-01-01, etc.)
UPDATE performance_evaluations
SET evaluation_date = CASE
  WHEN evaluation_period ~ '^\d{4}$' THEN (evaluation_period || '-01-01')::DATE
  WHEN evaluation_period LIKE '% Q1' THEN (SPLIT_PART(evaluation_period, ' ', 1) || '-01-01')::DATE
  WHEN evaluation_period LIKE '% Q2' THEN (SPLIT_PART(evaluation_period, ' ', 1) || '-04-01')::DATE
  WHEN evaluation_period LIKE '% Q3' THEN (SPLIT_PART(evaluation_period, ' ', 1) || '-07-01')::DATE
  WHEN evaluation_period LIKE '% Q4' THEN (SPLIT_PART(evaluation_period, ' ', 1) || '-10-01')::DATE
  ELSE CURRENT_DATE
END
WHERE evaluation_date IS NULL;

-- 3. Tornar evaluation_date NOT NULL
ALTER TABLE performance_evaluations 
ALTER COLUMN evaluation_date SET NOT NULL;

-- 4. Remover constraint UNIQUE antiga se existir
ALTER TABLE performance_evaluations 
DROP CONSTRAINT IF EXISTS performance_evaluations_user_id_company_id_evaluation_period_key;

-- 5. Criar novo índice em evaluation_date
CREATE INDEX IF NOT EXISTS idx_performance_evaluations_date ON performance_evaluations(evaluation_date);
DROP INDEX IF EXISTS idx_performance_evaluations_period;

-- 6. Atualizar view de estatísticas
DROP VIEW IF EXISTS nine_box_statistics;
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

-- 7. Comentários
COMMENT ON COLUMN performance_evaluations.evaluation_date IS 'Data em que a avaliação foi realizada - permite múltiplas avaliações ao longo do tempo';
