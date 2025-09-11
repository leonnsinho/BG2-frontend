-- Script para criar usuários de teste no Supabase
-- IMPORTANTE: Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos inserir os usuários na tabela auth.users (sistema de autenticação)
-- NOTA: No Supabase, normalmente os usuários são criados via API de auth, 
-- mas para testes podemos inserir diretamente no banco

-- Função para criar usuário de teste
CREATE OR REPLACE FUNCTION create_test_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  encrypted_password text;
BEGIN
  -- Gerar ID único
  user_id := gen_random_uuid();
  
  -- Criptografar senha (básico para teste)
  encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Inserir na tabela auth.users
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    user_id,
    p_email,
    encrypted_password,
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', p_full_name, 'role', p_role),
    (p_role = 'super_admin'),
    'authenticated'
  );
  
  -- Inserir perfil correspondente na tabela profiles
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    p_email,
    p_full_name,
    p_role,
    now(),
    now()
  );
  
  RETURN user_id;
END;
$$;

-- 2. Criar todos os usuários de teste
DO $$
DECLARE
  super_admin_id uuid;
  consultant_id uuid;
  company_admin_id uuid;
  user_id uuid;
  company_id uuid;
BEGIN
  -- Limpar usuários de teste existentes (se houver)
  DELETE FROM profiles WHERE email LIKE '%@teste.com';
  DELETE FROM auth.users WHERE email LIKE '%@teste.com';
  
  -- Criar Super Admin
  super_admin_id := create_test_user(
    'superadmin@teste.com',
    'super123',
    'Super Administrador',
    'super_admin'
  );
  
  -- Criar Consultor
  consultant_id := create_test_user(
    'consultor@teste.com',
    'consultor123',
    'Consultor Partimap',
    'consultant'
  );
  
  -- Criar Administrador de Empresa
  company_admin_id := create_test_user(
    'admin@empresa.com',
    'admin123',
    'Admin da Empresa',
    'company_admin'
  );
  
  -- Criar Usuário comum
  user_id := create_test_user(
    'usuario@empresa.com',
    'user123',
    'Usuário Comum',
    'user'
  );
  
  -- Criar uma empresa de teste
  INSERT INTO companies (
    id,
    name,
    domain,
    subscription_tier,
    max_users,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'Empresa Teste Ltda',
    'empresa.com',
    'premium',
    100,
    now(),
    now()
  ) RETURNING id INTO company_id;
  
  -- Associar usuários à empresa
  INSERT INTO user_companies (id, user_id, company_id, role, created_at)
  VALUES 
    (gen_random_uuid(), company_admin_id, company_id, 'admin', now()),
    (gen_random_uuid(), user_id, company_id, 'user', now());
  
  -- Mostrar resultado
  RAISE NOTICE 'Usuários de teste criados com sucesso!';
  RAISE NOTICE 'Super Admin ID: %', super_admin_id;
  RAISE NOTICE 'Consultant ID: %', consultant_id;
  RAISE NOTICE 'Company Admin ID: %', company_admin_id;
  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE 'Company ID: %', company_id;
END;
$$;

-- 3. Verificar usuários criados
SELECT 
  'USUÁRIOS CRIADOS:' as info,
  u.id,
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@teste.com' OR u.email LIKE '%@empresa.com'
ORDER BY p.role;

-- 4. Verificar associações empresa-usuário
SELECT 
  'ASSOCIAÇÕES EMPRESA:' as info,
  c.name as empresa,
  p.full_name as usuario,
  p.role as role_sistema,
  uc.role as role_empresa
FROM companies c
JOIN user_companies uc ON c.id = uc.company_id
JOIN profiles p ON uc.user_id = p.id
ORDER BY c.name, p.full_name;

-- 5. Limpar função temporária
DROP FUNCTION create_test_user;

-- 6. Resumo dos usuários para login
SELECT 
  '=== CREDENCIAIS DE TESTE ===' as titulo
UNION ALL
SELECT 'Email: superadmin@teste.com | Senha: super123 | Perfil: Super Admin'
UNION ALL  
SELECT 'Email: consultor@teste.com | Senha: consultor123 | Perfil: Consultor'
UNION ALL
SELECT 'Email: admin@empresa.com | Senha: admin123 | Perfil: Admin Empresa'
UNION ALL
SELECT 'Email: usuario@empresa.com | Senha: user123 | Perfil: Usuário';
