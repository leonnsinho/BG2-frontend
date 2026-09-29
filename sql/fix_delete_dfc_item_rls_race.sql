-- ===================================================================
-- FIX: exclusão de item do Plano de Contas virando "global" em vez
-- de ser apagado, quando feita por company_admin.
-- ===================================================================
-- Causa: o código excluía a associação (dfc_itens_empresas) antes de
-- excluir o item (dfc_itens). A policy de DELETE em dfc_itens exige
-- que a associação ainda exista para autorizar a exclusão do item,
-- então na hora de apagar o item a policy já não encontrava mais a
-- associação (apagada no passo anterior) e bloqueava silenciosamente
-- a exclusão — sem erro, sem aviso. O item ficava sem nenhuma empresa
-- associada, e a tela interpreta isso como "Global".
--
-- Correção: mover toda a exclusão para uma função no banco que
-- primeiro verifica a permissão (independente de qualquer exclusão
-- já feita) e só então apaga tudo numa única transação atômica.
-- ===================================================================

DROP FUNCTION IF EXISTS delete_dfc_item(uuid);

CREATE OR REPLACE FUNCTION delete_dfc_item(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean;
  v_is_authorized boolean;
BEGIN
  SELECT (role = 'super_admin') INTO v_is_super_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(v_is_super_admin, false) THEN
    SELECT EXISTS (
      SELECT 1
      FROM dfc_itens_empresas die
      JOIN user_companies uc ON uc.company_id = die.company_id
      WHERE die.item_id = p_item_id
        AND uc.user_id = auth.uid()
        AND uc.role = 'company_admin'
        AND uc.is_active = true
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
      RAISE EXCEPTION 'Sem permissão para excluir este item';
    END IF;
  END IF;

  IF v_is_super_admin THEN
    -- Super admin: remove os lançamentos de TODAS as empresas que usam o item
    DELETE FROM dfc_entradas WHERE item_id = p_item_id;
    DELETE FROM dfc_saidas WHERE item_id = p_item_id;
  ELSE
    -- Company admin: remove apenas os lançamentos das empresas do próprio usuário
    -- (mesmo escopo que já era aplicado antes via RLS)
    DELETE FROM dfc_entradas
    WHERE item_id = p_item_id
      AND company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid() AND role = 'company_admin' AND is_active = true
      );

    DELETE FROM dfc_saidas
    WHERE item_id = p_item_id
      AND company_id IN (
        SELECT company_id FROM user_companies
        WHERE user_id = auth.uid() AND role = 'company_admin' AND is_active = true
      );
  END IF;

  DELETE FROM dfc_itens_empresas WHERE item_id = p_item_id;
  DELETE FROM dfc_itens WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_dfc_item(uuid) TO authenticated;

COMMENT ON FUNCTION delete_dfc_item(uuid) IS
'Exclui um item do Plano de Contas (dfc_itens) junto com suas associações e lançamentos relacionados, verificando permissão ANTES de qualquer exclusão para evitar a corrida com RLS que fazia o item virar "global" em vez de ser apagado.';

-- ===================================================================
-- COMO APLICAR:
-- 1. Supabase Dashboard > SQL Editor
-- 2. Colar este script inteiro e executar (Run)
-- ===================================================================
