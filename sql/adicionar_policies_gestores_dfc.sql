-- ========================================
-- POLÍTICAS RLS PARA GESTORES - DFC
-- ========================================
-- Este script adiciona políticas de Row Level Security (RLS)
-- para permitir que gestores possam gerenciar entradas e saídas
-- do DFC apenas em suas próprias empresas
-- ========================================

-- ==========================================
-- TABELA: dfc_entradas
-- ==========================================

-- Gestores podem visualizar entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem visualizar entradas de suas empresas" ON dfc_entradas;
CREATE POLICY "Gestores podem visualizar entradas de suas empresas"
  ON dfc_entradas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_entradas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem inserir entradas
DROP POLICY IF EXISTS "Gestores podem inserir entradas" ON dfc_entradas;
CREATE POLICY "Gestores podem inserir entradas"
  ON dfc_entradas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_entradas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem atualizar entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem atualizar entradas de suas empresas" ON dfc_entradas;
CREATE POLICY "Gestores podem atualizar entradas de suas empresas"
  ON dfc_entradas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_entradas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_entradas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem excluir entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem excluir entradas de suas empresas" ON dfc_entradas;
CREATE POLICY "Gestores podem excluir entradas de suas empresas"
  ON dfc_entradas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_entradas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- ==========================================
-- TABELA: dfc_entradas_documentos
-- ==========================================

-- Gestores podem visualizar documentos de entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem visualizar documentos de entradas" ON dfc_entradas_documentos;
CREATE POLICY "Gestores podem visualizar documentos de entradas"
  ON dfc_entradas_documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dfc_entradas e
      INNER JOIN user_companies uc ON uc.company_id = e.company_id
      WHERE e.id = dfc_entradas_documentos.entrada_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem inserir documentos de entradas
DROP POLICY IF EXISTS "Gestores podem inserir documentos de entradas" ON dfc_entradas_documentos;
CREATE POLICY "Gestores podem inserir documentos de entradas"
  ON dfc_entradas_documentos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dfc_entradas e
      INNER JOIN user_companies uc ON uc.company_id = e.company_id
      WHERE e.id = dfc_entradas_documentos.entrada_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem atualizar documentos de entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem atualizar documentos de entradas" ON dfc_entradas_documentos;
CREATE POLICY "Gestores podem atualizar documentos de entradas"
  ON dfc_entradas_documentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dfc_entradas e
      INNER JOIN user_companies uc ON uc.company_id = e.company_id
      WHERE e.id = dfc_entradas_documentos.entrada_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dfc_entradas e
      INNER JOIN user_companies uc ON uc.company_id = e.company_id
      WHERE e.id = dfc_entradas_documentos.entrada_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem excluir documentos de entradas de suas empresas
DROP POLICY IF EXISTS "Gestores podem excluir documentos de entradas" ON dfc_entradas_documentos;
CREATE POLICY "Gestores podem excluir documentos de entradas"
  ON dfc_entradas_documentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dfc_entradas e
      INNER JOIN user_companies uc ON uc.company_id = e.company_id
      WHERE e.id = dfc_entradas_documentos.entrada_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- ==========================================
-- TABELA: dfc_saidas
-- ==========================================

-- Gestores podem visualizar saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem visualizar saidas de suas empresas" ON dfc_saidas;
CREATE POLICY "Gestores podem visualizar saidas de suas empresas"
  ON dfc_saidas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_saidas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem inserir saídas
DROP POLICY IF EXISTS "Gestores podem inserir saidas" ON dfc_saidas;
CREATE POLICY "Gestores podem inserir saidas"
  ON dfc_saidas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_saidas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem atualizar saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem atualizar saidas de suas empresas" ON dfc_saidas;
CREATE POLICY "Gestores podem atualizar saidas de suas empresas"
  ON dfc_saidas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_saidas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_saidas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem excluir saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem excluir saidas de suas empresas" ON dfc_saidas;
CREATE POLICY "Gestores podem excluir saidas de suas empresas"
  ON dfc_saidas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = dfc_saidas.company_id
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- ==========================================
-- TABELA: dfc_saidas_documentos
-- ==========================================

-- Gestores podem visualizar documentos de saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem visualizar documentos de saidas" ON dfc_saidas_documentos;
CREATE POLICY "Gestores podem visualizar documentos de saidas"
  ON dfc_saidas_documentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dfc_saidas s
      INNER JOIN user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = dfc_saidas_documentos.saida_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem inserir documentos de saídas
DROP POLICY IF EXISTS "Gestores podem inserir documentos de saidas" ON dfc_saidas_documentos;
CREATE POLICY "Gestores podem inserir documentos de saidas"
  ON dfc_saidas_documentos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dfc_saidas s
      INNER JOIN user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = dfc_saidas_documentos.saida_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem atualizar documentos de saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem atualizar documentos de saidas" ON dfc_saidas_documentos;
CREATE POLICY "Gestores podem atualizar documentos de saidas"
  ON dfc_saidas_documentos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dfc_saidas s
      INNER JOIN user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = dfc_saidas_documentos.saida_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dfc_saidas s
      INNER JOIN user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = dfc_saidas_documentos.saida_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- Gestores podem excluir documentos de saídas de suas empresas
DROP POLICY IF EXISTS "Gestores podem excluir documentos de saidas" ON dfc_saidas_documentos;
CREATE POLICY "Gestores podem excluir documentos de saidas"
  ON dfc_saidas_documentos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dfc_saidas s
      INNER JOIN user_companies uc ON uc.company_id = s.company_id
      WHERE s.id = dfc_saidas_documentos.saida_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'gestor'
        AND uc.is_active = true
    )
  );

-- ==========================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- ==========================================

-- Verificar políticas da tabela dfc_entradas
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
WHERE tablename IN ('dfc_entradas', 'dfc_entradas_documentos', 'dfc_saidas', 'dfc_saidas_documentos')
  AND policyname LIKE '%Gestor%'
ORDER BY tablename, policyname;

-- ==========================================
-- MENSAGEM DE CONCLUSÃO
-- ==========================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS para gestores criadas com sucesso!';
  RAISE NOTICE '📋 Políticas aplicadas em:';
  RAISE NOTICE '   - dfc_entradas (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - dfc_entradas_documentos (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - dfc_saidas (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '   - dfc_saidas_documentos (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '🔒 Gestores agora podem gerenciar DFC apenas de suas empresas';
END $$;
