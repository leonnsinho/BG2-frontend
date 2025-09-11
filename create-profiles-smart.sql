-- Script para criar usuários de teste com IDs automáticos
-- Este script NÃO usa IDs fixos, deixa o Supabase gerar

-- 1. Primeiro, vamos criar uma função que funciona com o sistema de auth
CREATE OR REPLACE FUNCTION create_test_profile(
  p_email text,
  p_full_name text,
  p_role text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
  profile_exists boolean;
BEGIN
  -- Verificar se já existe usuário no auth.users com este email
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO user_exists;
  
  -- Verificar se já existe perfil
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE email = p_email
  ) INTO profile_exists;
  
  IF user_exists AND NOT profile_exists THEN
    -- Se usuário existe no auth mas não tem perfil, criar perfil
    INSERT INTO profiles (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    )
    SELECT 
      u.id,
      p_email,
      p_full_name,
      p_role,
      now(),
      now()
    FROM auth.users u
    WHERE u.email = p_email;
    
    RETURN 'Perfil criado para usuário existente: ' || p_email;
    
  ELSIF profile_exists THEN
    RETURN 'Perfil já existe: ' || p_email;
    
  ELSE
    RETURN 'Usuário não existe no auth.users: ' || p_email || ' - Use o componente React para criar';
    
  END IF;
END;
$$;

-- 2. Tentar criar perfis para usuários que possam existir
SELECT create_test_profile('superadmin@teste.com', 'Super Administrador', 'super_admin');
SELECT create_test_profile('consultor@teste.com', 'Consultor Partimap', 'consultant');
SELECT create_test_profile('admin@empresa.com', 'Admin da Empresa', 'company_admin');
SELECT create_test_profile('usuario@empresa.com', 'Usuário Comum', 'user');

-- 3. Verificar o que temos agora
SELECT 'USUÁRIOS NO AUTH.USERS:' as tipo, email, created_at::date 
FROM auth.users 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
UNION ALL
SELECT 'PERFIS CRIADOS:', email, created_at::date 
FROM profiles 
WHERE email LIKE '%@teste.com' OR email LIKE '%@empresa.com'
ORDER BY tipo, email;

-- 4. Limpar função temporária
DROP FUNCTION create_test_profile;

-- 5. Mostrar status final
SELECT '=== STATUS FINAL ===' as info
UNION ALL
SELECT 'Use o componente React "Criar Usuários de Teste" para:'
UNION ALL
SELECT '1. Criar usuários no sistema de autenticação'
UNION ALL
SELECT '2. Os perfis serão criados automaticamente'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Credenciais de teste:'
UNION ALL
SELECT 'superadmin@teste.com / super123'
UNION ALL
SELECT 'consultor@teste.com / consultor123'
UNION ALL
SELECT 'admin@empresa.com / admin123'
UNION ALL
SELECT 'usuario@empresa.com / user123';
