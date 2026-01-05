-- Corrigir políticas RLS para dfc_itens permitir company_admin gerenciar itens

-- 1. Remover todas as políticas existentes que estão duplicadas/conflitantes
DROP POLICY IF EXISTS "Apenas super_admin pode atualizar itens" ON dfc_itens;
DROP POLICY IF EXISTS "Apenas super_admin pode criar itens" ON dfc_itens;
DROP POLICY IF EXISTS "Apenas super_admin pode excluir itens" ON dfc_itens;
DROP POLICY IF EXISTS "Permitir atualização de itens para Super Admin" ON dfc_itens;
DROP POLICY IF EXISTS "Permitir exclusão de itens para Super Admin" ON dfc_itens;
DROP POLICY IF EXISTS "Permitir inserção de itens para Super Admin" ON dfc_itens;
DROP POLICY IF EXISTS "Permitir visualização de itens da empresa" ON dfc_itens;
DROP POLICY IF EXISTS "Usuários podem ler itens" ON dfc_itens;
DROP POLICY IF EXISTS "Super admin can view all items" ON dfc_itens;
DROP POLICY IF EXISTS "Company admin can view own company items" ON dfc_itens;
DROP POLICY IF EXISTS "Super admin can insert items" ON dfc_itens;
DROP POLICY IF EXISTS "Company admin can insert items" ON dfc_itens;
DROP POLICY IF EXISTS "Super admin can update items" ON dfc_itens;
DROP POLICY IF EXISTS "Company admin can update own company items" ON dfc_itens;
DROP POLICY IF EXISTS "Super admin can delete items" ON dfc_itens;
DROP POLICY IF EXISTS "Company admin can delete own company items" ON dfc_itens;

-- 2. Criar políticas corretas para SELECT (leitura)

-- Super admin pode ver todos os itens
CREATE POLICY "Super admin can view all items" ON dfc_itens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin pode ver itens das suas empresas, itens que criou, OU itens globais
CREATE POLICY "Company admin can view own company items" ON dfc_itens
  FOR SELECT
  USING (
    -- Itens associados às empresas do usuário
    id IN (
      SELECT die.item_id
      FROM dfc_itens_empresas die
      WHERE die.company_id IN (
        SELECT uc.company_id
        FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.is_active = true
      )
    )
    OR
    -- Itens criados pelo próprio usuário (permite ver logo após INSERT)
    (
      created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.role = 'company_admin'
        AND uc.is_active = true
      )
    )
    OR
    -- Itens globais (não associados a nenhuma empresa) - disponíveis para todos
    NOT EXISTS (
      SELECT 1 FROM dfc_itens_empresas die
      WHERE die.item_id = dfc_itens.id
    )
  );

-- 3. Criar políticas para INSERT (criação)

-- Super admin pode criar qualquer item
CREATE POLICY "Super admin can insert items" ON dfc_itens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin pode criar itens
CREATE POLICY "Company admin can insert items" ON dfc_itens
  FOR INSERT
  WITH CHECK (
    -- Verifica se o usuário está vinculado a alguma empresa como company_admin
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.role = 'company_admin'
      AND uc.is_active = true
    )
  );

-- 4. Criar políticas para UPDATE (atualização)

-- Super admin pode atualizar qualquer item
CREATE POLICY "Super admin can update items" ON dfc_itens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin pode atualizar itens das suas empresas
CREATE POLICY "Company admin can update own company items" ON dfc_itens
  FOR UPDATE
  USING (
    id IN (
      SELECT die.item_id
      FROM dfc_itens_empresas die
      WHERE die.company_id IN (
        SELECT uc.company_id
        FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.is_active = true
      )
    )
  );

-- 5. Criar políticas para DELETE (exclusão)

-- Super admin pode deletar qualquer item
CREATE POLICY "Super admin can delete items" ON dfc_itens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Company admin pode deletar itens das suas empresas
CREATE POLICY "Company admin can delete own company items" ON dfc_itens
  FOR DELETE
  USING (
    id IN (
      SELECT die.item_id
      FROM dfc_itens_empresas die
      WHERE die.company_id IN (
        SELECT uc.company_id
        FROM user_companies uc
        WHERE uc.user_id = auth.uid()
        AND uc.is_active = true
      )
    )
  );

-- ========================================
-- Políticas para dfc_itens_empresas
-- ========================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super Admin pode criar associações" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super Admin pode remover associações" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Usuários podem ver associações de suas empresas" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can view all associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can view own company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can insert associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can insert own company associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Super admin can delete associations" ON dfc_itens_empresas;
DROP POLICY IF EXISTS "Company admin can delete own company associations" ON dfc_itens_empresas;

-- SELECT: Ver associações
CREATE POLICY "Super admin can view all associations" ON dfc_itens_empresas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admin can view own company associations" ON dfc_itens_empresas
  FOR SELECT
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- INSERT: Criar associações
CREATE POLICY "Super admin can insert associations" ON dfc_itens_empresas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admin can insert own company associations" ON dfc_itens_empresas
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- DELETE: Remover associações
CREATE POLICY "Super admin can delete associations" ON dfc_itens_empresas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admin can delete own company associations" ON dfc_itens_empresas
  FOR DELETE
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- Verificação
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('dfc_itens', 'dfc_itens_empresas')
ORDER BY tablename, cmd, policyname;
