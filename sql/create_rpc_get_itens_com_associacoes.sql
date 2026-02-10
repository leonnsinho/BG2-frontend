-- ===================================================================
-- RPC Function: Retornar IDs de itens que têm associações
-- ===================================================================
-- Esta função ignora RLS e retorna TODOS os item_ids que têm pelo
-- menos uma associação em dfc_itens_empresas, independente da empresa
-- ===================================================================

-- Remover função antiga se existir
DROP FUNCTION IF EXISTS get_itens_com_associacoes();

-- Criar função com SECURITY DEFINER (executa com permissões do dono)
CREATE OR REPLACE FUNCTION get_itens_com_associacoes()
RETURNS TABLE (item_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT die.item_id
  FROM dfc_itens_empresas die;
END;
$$;

-- Dar permissão para usuários autenticados executarem a função
GRANT EXECUTE ON FUNCTION get_itens_com_associacoes() TO authenticated;

-- Comentário para documentação
COMMENT ON FUNCTION get_itens_com_associacoes() IS 
'Retorna lista de IDs de itens que têm pelo menos uma associação com empresas. Ignora RLS para permitir que company_admin identifique itens realmente globais vs itens de outras empresas.';

-- ===================================================================
-- TESTE: Verificar se a função funciona
-- ===================================================================
SELECT COUNT(*) as total_itens_com_associacoes
FROM get_itens_com_associacoes();

-- ===================================================================
-- INSTRUÇÕES:
-- ===================================================================
-- 1. Execute este SQL no Supabase Dashboard > SQL Editor
-- 2. Verifique se o teste retornou um número razoável
-- 3. A função estará disponível para uso no frontend via supabase.rpc()
-- ===================================================================
