-- Script super simples - apenas perfis de usuários
-- Use este se os outros derem erro

-- Limpar usuários de teste anteriores
DELETE FROM profiles WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com';

-- Criar apenas os perfis básicos
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440010'::uuid,
    'superadmin@teste.com',
    'Super Administrador',
    'super_admin',
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440020'::uuid,
    'consultor@teste.com',
    'Consultor Partimap',
    'consultant',
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440030'::uuid,
    'admin@empresa.com',
    'Admin da Empresa',
    'company_admin',
    now(),
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440040'::uuid,
    'usuario@empresa.com',
    'Usuário Comum',
    'user',
    now(),
    now()
  );

-- Verificar criação
SELECT 
  'PERFIS CRIADOS PARA TESTE:' as info,
  email, 
  full_name, 
  role 
FROM profiles 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
ORDER BY role;

-- Mostrar próximos passos
SELECT '=== PRÓXIMOS PASSOS ===' as passo
UNION ALL
SELECT '1. Use o componente "Criar Usuários de Teste" na página'
UNION ALL
SELECT '2. Ou crie manualmente no Supabase Auth Dashboard'
UNION ALL
SELECT '3. Credenciais:'
UNION ALL
SELECT '   superadmin@teste.com / super123'
UNION ALL
SELECT '   consultor@teste.com / consultor123'
UNION ALL
SELECT '   admin@empresa.com / admin123'
UNION ALL
SELECT '   usuario@empresa.com / user123';
