-- ============================================
-- FIX: Converter coluna due_date de timestamptz para date
-- ============================================
-- Problema: A coluna due_date está como timestamptz, causando
-- problemas de timezone (salva dia 20, aparece dia 19)
-- Solução: Converter para tipo DATE puro
-- ============================================

-- Passo 1: Remover todas as views que dependem da tabela tasks
DROP VIEW IF EXISTS tasks_with_details CASCADE;
DROP VIEW IF EXISTS user_activity_summary CASCADE;

-- Passo 2: Alterar o tipo da coluna de timestamptz para date
-- Isso converterá automaticamente os valores existentes
ALTER TABLE tasks 
ALTER COLUMN due_date TYPE date USING due_date::date;

-- Passo 3: Recriar a view tasks_with_details
CREATE OR REPLACE VIEW tasks_with_details AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.assigned_to,
  t.assigned_to_name,
  t.process_id,
  t.journey_id,
  t.company_id,
  t.status,
  t.priority,
  t.due_date,
  t.created_at,
  t.created_by,
  t.updated_at,
  t.completed_at,
  t.verified_at,
  t.verified_by,
  t.contributes_to_maturity,
  p.name as process_name,
  j.name as journey_name,
  creator.full_name as created_by_name,
  assignee.full_name as assigned_to_full_name
FROM tasks t
LEFT JOIN processes p ON t.process_id = p.id
LEFT JOIN journeys j ON t.journey_id = j.id
LEFT JOIN profiles creator ON t.created_by = creator.id
LEFT JOIN profiles assignee ON t.assigned_to = assignee.id;

-- Passo 4: Recriar a view user_activity_summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_tasks,
  COUNT(DISTINCT CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN t.id END) as overdue_tasks
FROM profiles p
LEFT JOIN tasks t ON p.id = t.assigned_to
GROUP BY p.id, p.full_name, p.email;

-- Passo 5: Verificar se funcionou
SELECT 
  id,
  title,
  due_date,
  pg_typeof(due_date) as tipo_coluna
FROM tasks 
WHERE due_date IS NOT NULL
LIMIT 5;

-- ============================================
-- RESULTADO ESPERADO:
-- tipo_coluna deve mostrar "date" ao invés de "timestamp with time zone"
-- ============================================
