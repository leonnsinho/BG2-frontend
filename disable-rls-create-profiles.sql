-- Script para desabilitar RLS temporariamente e permitir criação manual
-- Execute este script no Supabase SQL Editor

-- 1. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Agora podemos inserir perfis manualmente sem problemas
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES 
  (
    gen_random_uuid(),
    'superadmin@teste.com',
    'Super Administrador',
    'super_admin',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'consultor@teste.com',
    'Consultor Partimap',
    'consultant',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'admin@empresa.com',
    'Admin da Empresa',
    'company_admin',
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'usuario@empresa.com',
    'Usuário Comum',
    'user',
    now(),
    now()
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- 4. Verificar perfis criados
SELECT 'PERFIS CRIADOS:' as status, email, full_name, role, id
FROM profiles 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
ORDER BY role;

-- 5. Reabilitar RLS (opcional - pode fazer depois)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Instruções para criar usuários no Auth
SELECT '=== PRÓXIMOS PASSOS ===' as passo
UNION ALL
SELECT '1. Vá para o Supabase Dashboard > Authentication > Users'
UNION ALL
SELECT '2. Clique em "Add user" para cada email:'
UNION ALL
SELECT '3. Use a opção "Create user" (não "Invite user")'
UNION ALL
SELECT '4. Para cada usuário, configure:'
UNION ALL
SELECT '   Email: [use os emails abaixo]'
UNION ALL
SELECT '   Password: [use as senhas abaixo]'
UNION ALL
SELECT '   Auto Confirm User: YES (importante!)'
UNION ALL
SELECT '   User UUID: [copie o ID da tabela profiles]'
UNION ALL
SELECT ''
UNION ALL
SELECT '=== CREDENCIAIS ==='
UNION ALL
SELECT 'superadmin@teste.com | super123'
UNION ALL
SELECT 'consultor@teste.com | consultor123'
UNION ALL
SELECT 'admin@empresa.com | admin123'
UNION ALL
SELECT 'usuario@empresa.com | user123';
