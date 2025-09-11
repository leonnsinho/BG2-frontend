-- Script alternativo para criar usuários via Supabase Auth API
-- Use este script se o anterior der erro de permissão

-- 1. Primeiro, vamos criar apenas os perfis na tabela profiles
-- Os usuários serão criados via interface web ou API

-- Limpar dados de teste anteriores
DELETE FROM user_companies WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
);
DELETE FROM profiles WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com';
DELETE FROM companies WHERE domain = 'empresa.com';

-- 2. Criar empresa de teste primeiro
INSERT INTO companies (
  id,
  name,
  domain,
  subscription_tier,
  max_users,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Empresa Teste Ltda',
  'empresa.com',
  'premium',
  100,
  now(),
  now()
);

-- 3. Criar perfis de usuários (IDs fixos para facilitar associações)
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

-- 4. Associar usuários à empresa
INSERT INTO user_companies (id, user_id, company_id, role, created_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440050'::uuid,
    '550e8400-e29b-41d4-a716-446655440030'::uuid, -- admin@empresa.com
    '550e8400-e29b-41d4-a716-446655440001'::uuid, -- Empresa Teste
    'admin',
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440051'::uuid,
    '550e8400-e29b-41d4-a716-446655440040'::uuid, -- usuario@empresa.com
    '550e8400-e29b-41d4-a716-446655440001'::uuid, -- Empresa Teste
    'user',
    now()
  );

-- 5. Verificar estrutura criada
SELECT 'PERFIS CRIADOS:' as secao, email, full_name, role FROM profiles 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
ORDER BY role;

SELECT 'EMPRESA CRIADA:' as secao, name, domain, subscription_tier FROM companies 
WHERE domain = 'empresa.com';

SELECT 'ASSOCIAÇÕES:' as secao, 
       c.name as empresa, 
       p.email as usuario, 
       uc.role as papel_empresa
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN profiles p ON uc.user_id = p.id
ORDER BY p.email;

-- 6. Instruções para criar usuários no Supabase Auth
SELECT '=== PRÓXIMOS PASSOS ===' as instrucoes
UNION ALL
SELECT 'Agora você precisa criar os usuários no Supabase Auth Dashboard:'
UNION ALL
SELECT '1. Vá para Authentication > Users no Supabase Dashboard'
UNION ALL
SELECT '2. Clique em "Add user" para cada email:'
UNION ALL
SELECT '   - superadmin@teste.com (senha: super123)'
UNION ALL
SELECT '   - consultor@teste.com (senha: consultor123)'
UNION ALL
SELECT '   - admin@empresa.com (senha: admin123)'
UNION ALL
SELECT '   - usuario@empresa.com (senha: user123)'
UNION ALL
SELECT '3. Use os IDs fixos que criamos nos perfis'
UNION ALL
SELECT '4. Ou use a função JavaScript para criar via código';
