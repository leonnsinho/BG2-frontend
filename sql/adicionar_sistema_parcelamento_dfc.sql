-- Script para adicionar sistema de parcelamento ao DFC Saídas
-- Data: 17/01/2026
-- Descrição: Permite criar lançamentos parcelados com relação pai-filho

-- 1. Adicionar colunas para sistema de parcelamento
ALTER TABLE dfc_saidas 
ADD COLUMN IF NOT EXISTS is_parcelado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS numero_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parcela_numero INTEGER,
ADD COLUMN IF NOT EXISTS lancamento_pai_id UUID REFERENCES dfc_saidas(id) ON DELETE CASCADE;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dfc_saidas_lancamento_pai ON dfc_saidas(lancamento_pai_id);
CREATE INDEX IF NOT EXISTS idx_dfc_saidas_is_parcelado ON dfc_saidas(is_parcelado);

-- 3. Adicionar comentários
COMMENT ON COLUMN dfc_saidas.is_parcelado IS 'Indica se é um lançamento parcelado (lançamento pai)';
COMMENT ON COLUMN dfc_saidas.numero_parcelas IS 'Número total de parcelas (apenas para lançamento pai)';
COMMENT ON COLUMN dfc_saidas.parcela_numero IS 'Número da parcela atual (1, 2, 3...) - NULL para lançamento pai';
COMMENT ON COLUMN dfc_saidas.lancamento_pai_id IS 'ID do lançamento pai (NULL para lançamentos não parcelados ou pais)';

-- 4. Atualizar registros existentes (garantir valores padrão)
UPDATE dfc_saidas 
SET is_parcelado = FALSE,
    numero_parcelas = 1
WHERE is_parcelado IS NULL OR numero_parcelas IS NULL;

-- Verificar alterações
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'dfc_saidas' 
  AND column_name IN ('is_parcelado', 'numero_parcelas', 'parcela_numero', 'lancamento_pai_id')
ORDER BY ordinal_position;
