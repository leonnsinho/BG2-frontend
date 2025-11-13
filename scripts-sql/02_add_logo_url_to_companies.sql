-- ================================================
-- SCRIPT: Adicionar Logo URL à Tabela Companies
-- Data: 2025-11-12
-- Descrição: Adiciona coluna para armazenar caminho do logo da empresa
-- ================================================

-- 1. Adicionar coluna logo_url à tabela companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Adicionar comentário na coluna
COMMENT ON COLUMN companies.logo_url IS 'Caminho do logo da empresa no storage (company-avatars bucket)';

-- 3. Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_companies_logo_url 
ON companies(logo_url) 
WHERE logo_url IS NOT NULL;

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Verificar se a coluna foi criada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name = 'logo_url';

-- Verificar estrutura da tabela companies
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
ORDER BY ordinal_position;
