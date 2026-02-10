-- ===================================================================
-- FIX DEFINITIVO - RLS para dfc_itens_empresas
-- ===================================================================
-- Este script corrige as políticas RLS permitindo que company_admin
-- veja TODAS as associações das empresas às quais pertence
-- ===================================================================

-- ============================================
-- PASSO 1: Remover políticas antigas
-- ============================================
DROP POLICY IF EXISTS "Super admin can view all associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can view own company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Users can view company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can insert associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can insert own company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Users can insert associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can update associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can update own company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can delete associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can delete own company associations" ON dfc_itens_empresas;

-- ============================================
-- PASSO 2: Garantir que RLS está habilitado
-- ============================================
ALTER TABLE dfc_itens_empresas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASSO 3: Criar políticas SELECT (leitura)
-- ============================================

-- Super admin vê TODAS as associações
CREATE POLICY "Super admin can view all associations" 
ON dfc_itens_empresas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Company admin vê associações das empresas às quais pertence
CREATE POLICY "Company admin can view own company associations" 
ON dfc_itens_empresas
FOR SELECT
TO authenticated
USING (
  -- Permite se o usuário é super_admin OU
  -- se a associação pertence a uma empresa do usuário
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  )
);

-- ============================================
-- PASSO 4: Criar políticas INSERT
-- ============================================

-- Super admin pode inserir QUALQUER associação
CREATE POLICY "Super admin can insert associations" 
ON dfc_itens_empresas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Company admin pode inserir associações apenas para SUA empresa
CREATE POLICY "Company admin can insert own company associations" 
ON dfc_itens_empresas
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  )
);

-- ============================================
-- PASSO 5: Criar políticas UPDATE
-- ============================================

-- Super admin pode atualizar QUALQUER associação
CREATE POLICY "Super admin can update associations" 
ON dfc_itens_empresas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Company admin pode atualizar associações da própria empresa
CREATE POLICY "Company admin can update own company associations" 
ON dfc_itens_empresas
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  )
)
WITH CHECK (
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  )
);

-- ============================================
-- PASSO 6: Criar políticas DELETE
-- ============================================

-- Super admin pode deletar QUALQUER associação
CREATE POLICY "Super admin can delete associations" 
ON dfc_itens_empresas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
);

-- Company admin pode deletar associações da própria empresa
CREATE POLICY "Company admin can delete own company associations" 
ON dfc_itens_empresas
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT uc.company_id
    FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.is_active = true
  )
);

-- ============================================
-- VERIFICAÇÃO: Exibir políticas criadas
-- ============================================
SELECT 
  policyname as "Política",
  cmd as "Operação",
  CASE 
    WHEN policyname LIKE '%Super admin%' THEN 'Super Admin'
    WHEN policyname LIKE '%Company admin%' THEN 'Company Admin'
    ELSE 'Outros'
  END as "Quem"
FROM pg_policies
WHERE tablename = 'dfc_itens_empresas'
ORDER BY cmd, policyname;

-- ============================================
-- INSTRUÇÕES PARA APLICAR:
-- ============================================
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Run)
-- 5. Verifique se a tabela no final mostra as 10 políticas
-- 6. Faça logout/login no frontend como company_admin
-- 7. Verifique se agora vê todas as associações
-- ============================================
