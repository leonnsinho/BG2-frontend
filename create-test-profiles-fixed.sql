-- Script corrigido para criar usuários de teste
-- Baseado na estrutura real das tabelas

-- 1. Primeiro, vamos limpar dados de teste anteriores (versão segura)
DELETE FROM user_companies WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
);
DELETE FROM profiles WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com';
DELETE FROM companies WHERE name = 'Empresa Teste Ltda';

-- 2. Criar empresa de teste (usando apenas campos que existem)
INSERT INTO companies (
  id,
  name,
  email,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Empresa Teste Ltda',
  'contato@empresateste.com',
  now(),
  now()
);

-- 3. Criar perfis de usuários de teste
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

-- 5. Verificar o que foi criado
SELECT 'PERFIS CRIADOS:' as secao, email, full_name, role FROM profiles 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
ORDER BY role;

SELECT 'EMPRESA CRIADA:' as secao, name, email FROM companies 
WHERE name = 'Empresa Teste Ltda';

SELECT 'ASSOCIAÇÕES:' as secao, 
       c.name as empresa, 
       p.email as usuario, 
       uc.role as papel_empresa
FROM user_companies uc
JOIN companies c ON uc.company_id = c.id
JOIN profiles p ON uc.user_id = p.id
WHERE c.name = 'Empresa Teste Ltda'
ORDER BY p.email;

-- 6. Resumo das credenciais
SELECT '=== CREDENCIAIS DE TESTE CRIADAS ===' as titulo
UNION ALL
SELECT 'Agora use o componente React para criar os usuários no Auth:'
UNION ALL
SELECT 'superadmin@teste.com | super123 | Super Admin'
UNION ALL  
SELECT 'consultor@teste.com | consultor123 | Consultor'
UNION ALL
SELECT 'admin@empresa.com | admin123 | Admin Empresa'
UNION ALL
SELECT 'usuario@empresa.com | user123 | Usuário'
UNION ALL
SELECT ''
UNION ALL
SELECT 'IDs dos perfis foram fixados para facilitar associações.';
