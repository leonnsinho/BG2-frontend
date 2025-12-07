-- ==========================================
-- RECRIAR VIEW user_activity_summary COMPLETA
-- Com todos os campos necessários incluindo tasks_overdue
-- ==========================================

-- Dropar view se existir
DROP VIEW IF EXISTS user_activity_summary CASCADE;

-- Criar view completa
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  
  -- ROLE: usar profiles.role se for super_admin/consultant, senão buscar de user_companies
  CASE
    WHEN p.role IN ('super_admin', 'consultant') THEN p.role
    ELSE COALESCE(
      (SELECT uc.role 
       FROM user_companies uc 
       WHERE uc.user_id = p.id 
         AND uc.is_active = true 
       ORDER BY uc.created_at ASC 
       LIMIT 1),
      'user'
    )
  END as role,
  
  p.last_login_at,
  p.login_count,
  p.first_login_at,
  p.last_activity_at,
  p.created_at as registered_at,
  p.is_active,
  
  -- Calcular dias desde último login
  CASE 
    WHEN p.last_login_at IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (NOW() - p.last_login_at))::INTEGER
  END as days_since_last_login,
  
  -- Determinar status do usuário
  CASE
    WHEN p.last_login_at IS NULL THEN 'never_accessed'
    WHEN EXTRACT(DAY FROM (NOW() - p.last_login_at)) < 7 THEN 'active'
    WHEN EXTRACT(DAY FROM (NOW() - p.last_login_at)) < 30 THEN 'moderate'
    WHEN EXTRACT(DAY FROM (NOW() - p.last_login_at)) < 90 THEN 'inactive'
    ELSE 'very_inactive'
  END as activity_status,
  
  -- Contagem de tarefas ATRIBUÍDAS ao usuário
  (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id) as tasks_created,
  
  -- Contagem de tarefas atribuídas e concluídas
  (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id AND status = 'completed') as tasks_completed,
  
  -- 🔥 NOVO: Contagem de tarefas ATRASADAS (due_date passou e status não é completed)
  (SELECT COUNT(*) 
   FROM tasks 
   WHERE assigned_to = p.id 
     AND due_date < NOW() 
     AND status != 'completed'
  ) as tasks_overdue,
  
  -- Taxa de conclusão de tarefas atribuídas
  CASE 
    WHEN (SELECT COUNT(*) FROM tasks WHERE assigned_to = p.id) = 0 THEN 0
    ELSE ROUND(
      (SELECT COUNT(*)::DECIMAL FROM tasks WHERE assigned_to = p.id AND status = 'completed') / 
      (SELECT COUNT(*)::DECIMAL FROM tasks WHERE assigned_to = p.id) * 100,
      2
    )
  END as task_completion_rate,
  
  -- Contagem de comentários
  (SELECT COUNT(*) FROM task_comments WHERE user_id = p.id) as comments_made,
  
  -- Empresas associadas
  (SELECT COUNT(*) FROM user_companies WHERE user_id = p.id AND is_active = true) as companies_count,
  
  -- Nome da empresa principal (primeira ativa)
  (SELECT c.name 
   FROM user_companies uc 
   JOIN companies c ON c.id = uc.company_id 
   WHERE uc.user_id = p.id AND uc.is_active = true 
   ORDER BY uc.created_at ASC
   LIMIT 1) as primary_company_name,
   
  -- ID da empresa principal
  (SELECT uc.company_id
   FROM user_companies uc 
   WHERE uc.user_id = p.id AND uc.is_active = true 
   ORDER BY uc.created_at ASC
   LIMIT 1) as primary_company_id

FROM profiles p;

-- Comentário da view
COMMENT ON VIEW user_activity_summary IS 'View agregada com métricas de atividade de usuários. Inclui tasks_overdue. Roles são buscados de user_companies exceto para super_admin e consultant.';

-- Permissões
ALTER VIEW user_activity_summary OWNER TO postgres;
GRANT SELECT ON user_activity_summary TO authenticated;

-- ==========================================
-- TESTE: Verificar dados
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ View user_activity_summary recriada com sucesso!';
  RAISE NOTICE '📊 Total de usuários na view: %', (SELECT COUNT(*) FROM user_activity_summary);
  RAISE NOTICE '📋 Colunas disponíveis:';
  RAISE NOTICE '   - id, email, full_name, role';
  RAISE NOTICE '   - last_login_at, login_count, first_login_at';
  RAISE NOTICE '   - activity_status, days_since_last_login';
  RAISE NOTICE '   - tasks_created, tasks_completed, tasks_overdue';
  RAISE NOTICE '   - task_completion_rate, comments_made';
  RAISE NOTICE '   - companies_count, primary_company_name, primary_company_id';
END $$;

-- Ver alguns exemplos
SELECT 
  email,
  role,
  primary_company_name,
  activity_status,
  tasks_created,
  tasks_completed,
  tasks_overdue
FROM user_activity_summary
ORDER BY last_login_at DESC NULLS LAST
LIMIT 5;
