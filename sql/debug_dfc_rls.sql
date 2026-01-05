-- Script para debug de RLS - verificar role e permissões do usuário

-- 1. Verificar role do usuário atual
SELECT 
  id,
  email,
  role,
  created_at
FROM profiles
WHERE id = auth.uid();

-- 2. Verificar empresas vinculadas
SELECT 
  uc.id,
  uc.user_id,
  uc.company_id,
  c.name as company_name,
  uc.is_active,
  p.role as user_role
FROM user_companies uc
JOIN companies c ON c.id = uc.company_id
JOIN profiles p ON p.id = uc.user_id
WHERE uc.user_id = auth.uid();

-- 3. Verificar se consegue inserir em dfc_itens (teste)
-- Substitua os valores conforme necessário
-- SELECT 
--   CASE 
--     WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'company_admin' 
--     THEN 'PODE INSERIR - É COMPANY_ADMIN'
--     WHEN (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' 
--     THEN 'PODE INSERIR - É SUPER_ADMIN'
--     ELSE 'NÃO PODE INSERIR - ROLE: ' || (SELECT role FROM profiles WHERE id = auth.uid())
--   END as status;

-- 4. Testar política de INSERT manualmente
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as current_role,
  (SELECT email FROM profiles WHERE id = auth.uid()) as current_email,
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  ) as is_super_admin,
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'company_admin'
  ) as is_company_admin,
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  ) as has_active_company;

-- 5. Listar todas as políticas RLS ativas para dfc_itens
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'dfc_itens'
ORDER BY cmd, policyname;

-- 6. Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'dfc_itens';
