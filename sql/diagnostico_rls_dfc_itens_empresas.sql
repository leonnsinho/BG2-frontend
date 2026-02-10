-- ===================================================================
-- DIAGNÓSTICO RLS - dfc_itens_empresas
-- ===================================================================
-- Este script ajuda a diagnosticar por que company_admin vê apenas
-- 2 de 193 associações na tabela dfc_itens_empresas
-- ===================================================================

-- 1. Verificar políticas RLS ativas em dfc_itens_empresas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'dfc_itens_empresas'
ORDER BY policyname;

-- 2. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'dfc_itens_empresas';

-- 3. Contar total de associações na tabela
SELECT COUNT(*) as total_associacoes
FROM dfc_itens_empresas;

-- 4. Ver distribuição de associações por empresa
SELECT 
  c.id,
  c.name as empresa,
  COUNT(die.id) as total_associacoes
FROM companies c
LEFT JOIN dfc_itens_empresas die ON die.company_id = c.id
GROUP BY c.id, c.name
ORDER BY total_associacoes DESC;

-- 5. Ver dados do usuário atual (substitua o email pelo email do company_admin)
-- ALTERE O EMAIL ABAIXO:
WITH current_user_data AS (
  SELECT 
    p.id as user_id,
    p.email,
    p.role as profile_role,
    p.nome
  FROM profiles p
  WHERE p.email = 'SEU_EMAIL_AQUI@example.com'  -- ← ALTERE AQUI
)
SELECT 
  cud.*,
  uc.company_id,
  uc.role as user_company_role,
  uc.is_active,
  c.name as company_name
FROM current_user_data cud
LEFT JOIN user_companies uc ON uc.user_id = cud.user_id
LEFT JOIN companies c ON c.id = uc.company_id;

-- 6. Simular query que company_admin está fazendo
-- (Substitua o UUID pelo ID do usuário descoberto no passo 5)
SELECT 
  die.id,
  die.item_id,
  die.company_id,
  c.name as company_name
FROM dfc_itens_empresas die
JOIN companies c ON c.id = die.company_id
WHERE die.company_id IN (
  SELECT uc.company_id
  FROM user_companies uc
  WHERE uc.user_id = 'UUID_DO_USUARIO_AQUI'::uuid  -- ← ALTERE AQUI
  AND uc.is_active = true
)
ORDER BY die.created_at DESC
LIMIT 10;

-- 7. Verificar se há associações sem empresa (NULL company_id)
SELECT COUNT(*) as associacoes_sem_empresa
FROM dfc_itens_empresas
WHERE company_id IS NULL;

-- ===================================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- ===================================================================
-- Se o passo 1 retornar políticas, RLS está configurado
-- Se o passo 6 retornar poucas linhas, o problema é:
--   a) user_companies não tem o company_id correto para o usuário
--   b) as associações foram criadas para uma empresa diferente
-- ===================================================================
