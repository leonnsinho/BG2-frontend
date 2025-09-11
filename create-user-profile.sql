-- Script para criar perfil para o usuário logado que não tem perfil
-- Execute este script APÓS o fix-rls-for-signup.sql

-- 1. Verificar se o usuário existe no auth.users
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
WHERE email = 'leonrodriguezvictor34@gmail.com';

-- 2. Verificar se já existe perfil para este usuário
SELECT 
  id, 
  email, 
  full_name, 
  role 
FROM profiles 
WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b';

-- 3. Inserir perfil para o usuário se não existir
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  phone,
  created_at,
  updated_at
) 
SELECT 
  '5e6690c4-1809-4d27-bfbf-e35eb16d770b',
  'leonrodriguezvictor34@gmail.com',
  'Leon Rodriguez',
  'super_admin',
  NULL,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b'
);

-- 4. Verificar se o perfil foi criado
SELECT 
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b';

-- 5. Mostrar status
SELECT '=== PERFIL CRIADO PARA USUÁRIO LOGADO ===' as status;
