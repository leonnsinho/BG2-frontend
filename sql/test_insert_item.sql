-- Teste específico para descobrir o problema do INSERT

-- 1. Verificar se as políticas permitem INSERT
-- Execute isso LOGADO como o usuário company_admin na aplicação

-- Tentar simular o INSERT que a aplicação faz
-- IMPORTANTE: Execute isso na aplicação (console do navegador) ou
-- com o token JWT do usuário autenticado

-- 2. Teste manual de INSERT (substitua o categoria_id por um válido)
INSERT INTO dfc_itens (categoria_id, nome, descricao, created_by)
VALUES (
  (SELECT id FROM dfc_categorias LIMIT 1), -- pega qualquer categoria
  'TESTE DE INSERT',
  'Testando política RLS',
  auth.uid()
)
RETURNING *;

-- Se der erro aqui, o problema está na política de dfc_itens

-- 3. Se funcionou acima, teste a associação
-- (substitua os IDs pelos valores reais)
-- INSERT INTO dfc_itens_empresas (item_id, company_id, created_by)
-- VALUES (
--   'ID_DO_ITEM_CRIADO_ACIMA',
--   (SELECT company_id FROM user_companies WHERE user_id = auth.uid() AND is_active = true LIMIT 1),
--   auth.uid()
-- );

-- 4. Verificar novamente as condições do usuário
SELECT 
  auth.uid() as meu_user_id,
  (
    SELECT COUNT(*) FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.role = 'company_admin'
    AND uc.is_active = true
  ) as count_company_admin,
  EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = auth.uid()
    AND uc.role = 'company_admin'
    AND uc.is_active = true
  ) as tem_permissao;
