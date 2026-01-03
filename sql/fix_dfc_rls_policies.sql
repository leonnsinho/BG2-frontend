-- ============================================
-- FIX RLS POLICIES FOR DFC_SAIDAS
-- Adicionar políticas para company_admin fazer INSERT, UPDATE, DELETE
-- ============================================

-- Remover políticas existentes se necessário (opcional)
DROP POLICY IF EXISTS "Company admins can view their company dfc_saidas" ON dfc_saidas;
DROP POLICY IF EXISTS "Company admins can insert dfc_saidas" ON dfc_saidas;
DROP POLICY IF EXISTS "Company admins can update their company dfc_saidas" ON dfc_saidas;
DROP POLICY IF EXISTS "Company admins can delete their company dfc_saidas" ON dfc_saidas;

-- SELECT: Company admins podem visualizar saídas da sua empresa
CREATE POLICY "Company admins can view their company dfc_saidas"
ON dfc_saidas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_saidas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- INSERT: Company admins podem inserir saídas na sua empresa
CREATE POLICY "Company admins can insert dfc_saidas"
ON dfc_saidas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_saidas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- UPDATE: Company admins podem atualizar saídas da sua empresa
CREATE POLICY "Company admins can update their company dfc_saidas"
ON dfc_saidas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_saidas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_saidas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- DELETE: Company admins podem deletar saídas da sua empresa
CREATE POLICY "Company admins can delete their company dfc_saidas"
ON dfc_saidas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_saidas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- ============================================
-- FIX RLS POLICIES FOR DFC_ENTRADAS
-- Mesmas políticas para entradas
-- ============================================

DROP POLICY IF EXISTS "Company admins can view their company dfc_entradas" ON dfc_entradas;
DROP POLICY IF EXISTS "Company admins can insert dfc_entradas" ON dfc_entradas;
DROP POLICY IF EXISTS "Company admins can update their company dfc_entradas" ON dfc_entradas;
DROP POLICY IF EXISTS "Company admins can delete their company dfc_entradas" ON dfc_entradas;

-- SELECT
CREATE POLICY "Company admins can view their company dfc_entradas"
ON dfc_entradas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_entradas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- INSERT
CREATE POLICY "Company admins can insert dfc_entradas"
ON dfc_entradas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_entradas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- UPDATE
CREATE POLICY "Company admins can update their company dfc_entradas"
ON dfc_entradas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_entradas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_entradas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- DELETE
CREATE POLICY "Company admins can delete their company dfc_entradas"
ON dfc_entradas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM user_companies
    WHERE user_companies.user_id = auth.uid()
    AND user_companies.company_id = dfc_entradas.company_id
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- ============================================
-- FIX RLS POLICIES FOR DFC_SAIDAS_DOCUMENTOS
-- Permitir company_admin gerenciar documentos da sua empresa
-- ============================================

DROP POLICY IF EXISTS "Permitir inserção de documentos apenas para Super Admin" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Permitir atualização de documentos apenas para Super Admin" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Permitir exclusão de documentos apenas para Super Admin" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Permitir visualização de documentos para usuários autenticad" ON dfc_saidas_documentos;

DROP POLICY IF EXISTS "Company admins can view their company saidas docs" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Company admins can insert saidas docs" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Company admins can update their company saidas docs" ON dfc_saidas_documentos;
DROP POLICY IF EXISTS "Company admins can delete their company saidas docs" ON dfc_saidas_documentos;

-- SELECT
CREATE POLICY "Company admins can view their company saidas docs"
ON dfc_saidas_documentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_saidas
    INNER JOIN user_companies ON user_companies.company_id = dfc_saidas.company_id
    WHERE dfc_saidas.id = dfc_saidas_documentos.saida_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- INSERT
CREATE POLICY "Company admins can insert saidas docs"
ON dfc_saidas_documentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_saidas
    INNER JOIN user_companies ON user_companies.company_id = dfc_saidas.company_id
    WHERE dfc_saidas.id = dfc_saidas_documentos.saida_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- UPDATE
CREATE POLICY "Company admins can update their company saidas docs"
ON dfc_saidas_documentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_saidas
    INNER JOIN user_companies ON user_companies.company_id = dfc_saidas.company_id
    WHERE dfc_saidas.id = dfc_saidas_documentos.saida_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- DELETE
CREATE POLICY "Company admins can delete their company saidas docs"
ON dfc_saidas_documentos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_saidas
    INNER JOIN user_companies ON user_companies.company_id = dfc_saidas.company_id
    WHERE dfc_saidas.id = dfc_saidas_documentos.saida_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- ============================================
-- FIX RLS POLICIES FOR DFC_ENTRADAS_DOCUMENTOS
-- Mesmas políticas para documentos de entradas
-- ============================================

DROP POLICY IF EXISTS "Company admins can view their company entradas docs" ON dfc_entradas_documentos;
DROP POLICY IF EXISTS "Company admins can insert entradas docs" ON dfc_entradas_documentos;
DROP POLICY IF EXISTS "Company admins can update their company entradas docs" ON dfc_entradas_documentos;
DROP POLICY IF EXISTS "Company admins can delete their company entradas docs" ON dfc_entradas_documentos;

-- SELECT
CREATE POLICY "Company admins can view their company entradas docs"
ON dfc_entradas_documentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_entradas
    INNER JOIN user_companies ON user_companies.company_id = dfc_entradas.company_id
    WHERE dfc_entradas.id = dfc_entradas_documentos.entrada_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- INSERT
CREATE POLICY "Company admins can insert entradas docs"
ON dfc_entradas_documentos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_entradas
    INNER JOIN user_companies ON user_companies.company_id = dfc_entradas.company_id
    WHERE dfc_entradas.id = dfc_entradas_documentos.entrada_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- UPDATE
CREATE POLICY "Company admins can update their company entradas docs"
ON dfc_entradas_documentos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_entradas
    INNER JOIN user_companies ON user_companies.company_id = dfc_entradas.company_id
    WHERE dfc_entradas.id = dfc_entradas_documentos.entrada_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);

-- DELETE
CREATE POLICY "Company admins can delete their company entradas docs"
ON dfc_entradas_documentos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM dfc_entradas
    INNER JOIN user_companies ON user_companies.company_id = dfc_entradas.company_id
    WHERE dfc_entradas.id = dfc_entradas_documentos.entrada_id
    AND user_companies.user_id = auth.uid()
    AND user_companies.role = 'company_admin'
    AND user_companies.is_active = true
  )
);
