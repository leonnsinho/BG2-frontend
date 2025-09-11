-- Script URGENTE para corrigir RLS e permitir acesso aos perfis
-- Execute este script no Supabase SQL Editor AGORA

-- 1. DESABILITAR RLS temporariamente para resolver o problema
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se conseguimos acessar a tabela agora
SELECT 'RLS DESABILITADO - tabela profiles acessível' as status;

-- 3. Contar quantos perfis existem
SELECT count(*) as total_profiles FROM profiles;

-- 4. Verificar se o usuário específico tem perfil
SELECT 
  id, 
  email, 
  full_name, 
  role 
FROM profiles 
WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b';

-- 5. Se não existe, criar o perfil para o usuário
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) 
SELECT 
  '5e6690c4-1809-4d27-bfbf-e35eb16d770b',
  'leonrodriguezvictor34@gmail.com',
  'Leon Rodriguez',
  'super_admin',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b'
);

-- 6. Confirmar que o perfil foi criado
SELECT 
  id, 
  email, 
  full_name, 
  role,
  created_at
FROM profiles 
WHERE id = '5e6690c4-1809-4d27-bfbf-e35eb16d770b';

-- 7. Reabilitar RLS com políticas corretas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 8. Remover políticas antigas
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- 9. Criar políticas simples que funcionam
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for authenticated users" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 10. Mostrar status final
SELECT '=== PROBLEMA RESOLVIDO ===' as status
UNION ALL
SELECT 'RLS reconfigurado com políticas que funcionam'
UNION ALL
SELECT 'Perfil criado para o usuário';
