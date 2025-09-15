-- DIAGNÓSTICO DO PROBLEMA DE CARREGAMENTO DE PERFIL
-- Execute este script no SQL Editor do Supabase para diagnosticar

-- 1. Verificar se há usuários autenticados
SELECT 
    'Usuários auth.users' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_criado
FROM auth.users;

-- 2. Verificar se há perfis na tabela profiles
SELECT 
    'Perfis na tabela profiles' as tabela,
    COUNT(*) as total_registros,
    MAX(created_at) as ultimo_criado
FROM public.profiles;

-- 3. Verificar correspondência entre auth.users e profiles
SELECT 
    'Usuários sem perfil' as status,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 4. Verificar políticas RLS ativas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY tablename, policyname;

-- 5. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 6. Mostrar primeiros perfis para verificar estrutura
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 5;

-- 7. Testar acesso direto como usuário específico (substitua pelo seu user ID)
-- SELECT * FROM public.profiles WHERE id = 'SEU_USER_ID_AQUI';

-- 8. Verificar trigger de criação automática de perfil
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
   AND event_object_schema = 'auth';