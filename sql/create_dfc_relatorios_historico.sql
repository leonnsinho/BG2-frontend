-- Tabela para histórico de relatórios DFC
CREATE TABLE IF NOT EXISTS dfc_relatorios_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados do período
  periodo_tipo VARCHAR(50) NOT NULL, -- 'ultimos30dias', 'ultimos3meses', etc
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  
  -- Estatísticas do relatório
  total_entradas DECIMAL(15,2) DEFAULT 0,
  total_saidas DECIMAL(15,2) DEFAULT 0,
  saldo_total DECIMAL(15,2) DEFAULT 0,
  quantidade_entradas INTEGER DEFAULT 0,
  quantidade_saidas INTEGER DEFAULT 0,
  
  -- Metadados
  empresa_nome VARCHAR(255),
  usuario_nome VARCHAR(255)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_dfc_relatorios_company ON dfc_relatorios_historico(company_id);
CREATE INDEX IF NOT EXISTS idx_dfc_relatorios_created_at ON dfc_relatorios_historico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dfc_relatorios_created_by ON dfc_relatorios_historico(created_by);

-- RLS Policies
ALTER TABLE dfc_relatorios_historico ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin pode ver tudo
CREATE POLICY "Super admin can view all reports" ON dfc_relatorios_historico
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Company admin pode ver relatórios da sua empresa
CREATE POLICY "Company admin can view own company reports" ON dfc_relatorios_historico
  FOR SELECT
  USING (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- Policy: Super admin pode inserir em qualquer empresa
CREATE POLICY "Super admin can insert reports" ON dfc_relatorios_historico
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Policy: Company admin pode inserir relatórios da sua empresa
CREATE POLICY "Company admin can insert own company reports" ON dfc_relatorios_historico
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT uc.company_id
      FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.is_active = true
    )
  );

-- Policy: Usuários podem deletar seus próprios relatórios
CREATE POLICY "Users can delete own reports" ON dfc_relatorios_historico
  FOR DELETE
  USING (created_by = auth.uid());

-- Comentários
COMMENT ON TABLE dfc_relatorios_historico IS 'Histórico de relatórios financeiros gerados no DFC';
COMMENT ON COLUMN dfc_relatorios_historico.periodo_tipo IS 'Tipo de período usado: ultimos30dias, ultimos3meses, ultimos6meses, ultimo12meses, personalizado';
