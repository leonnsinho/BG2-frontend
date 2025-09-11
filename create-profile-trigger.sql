-- Script para criar trigger automático de perfis
-- Execute este script no Supabase SQL Editor

-- 1. Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  user_full_name text;
BEGIN
  -- Extrair dados do metadata do usuário
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário');
  
  -- Inserir perfil correspondente
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se perfil já existir, apenas retornar
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log do erro e continuar
    RAISE LOG 'Erro ao criar perfil para usuário %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 2. Criar trigger que executa após inserção de usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar se trigger foi criado
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Testar a função manualmente (se houver usuários sem perfil)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    AND (u.email LIKE '%@teste.com' OR u.email LIKE '%@empresa.com')
  LOOP
    -- Executar função para usuários existentes sem perfil
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', 'Usuário'),
      COALESCE(user_record.raw_user_meta_data->>'role', 'user'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Perfil criado para usuário existente: %', user_record.email;
  END LOOP;
END;
$$;

-- 5. Verificar resultado
SELECT 'USUÁRIOS COM PERFIS:' as status,
       u.email,
       p.full_name,
       p.role
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%@teste.com' OR u.email LIKE '%@empresa.com'
ORDER BY p.role;

-- 6. Mostrar próximos passos
SELECT '=== TRIGGER CONFIGURADO ===' as info
UNION ALL
SELECT 'Agora quando você criar usuários via Auth API:'
UNION ALL
SELECT '1. O perfil será criado automaticamente'
UNION ALL
SELECT '2. Use o componente React "Criar Usuários de Teste"'
UNION ALL
SELECT '3. Ou crie manualmente no Supabase Dashboard'
UNION ALL
SELECT '4. Os perfis aparecerão automaticamente na tabela profiles';
