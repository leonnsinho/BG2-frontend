-- Adicionar coluna 'order' na tabela tasks para permitir ordenação customizada
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna order (se não existir)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- 2. Inicializar valores de order baseado na data de criação
-- (tarefas mais antigas terão order menor)
WITH ranked_tasks AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY process_id ORDER BY created_at) - 1 as new_order
  FROM tasks
)
UPDATE tasks
SET "order" = ranked_tasks.new_order
FROM ranked_tasks
WHERE tasks.id = ranked_tasks.id;

-- 3. Verificar resultados
SELECT 
  id, 
  title, 
  process_id, 
  "order", 
  created_at 
FROM tasks 
ORDER BY process_id, "order";

-- 4. Comentário sobre a coluna
COMMENT ON COLUMN tasks."order" IS 'Ordem customizada da tarefa dentro do processo (0-based index)';
