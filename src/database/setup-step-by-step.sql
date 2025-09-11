-- SCRIPT DE SETUP MÍNIMO PARA TESTE
-- Execute passo a passo no SQL Editor do Supabase

-- Passo 1: Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Passo 2: Verificar se a tabela profiles já existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Passo 3: Criar tabela profiles (apenas se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'consultant', 'company_admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passo 4: Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Passo 5: Criar política permissiva para testes
DROP POLICY IF EXISTS "Permitir tudo para teste" ON public.profiles;
CREATE POLICY "Permitir tudo para teste" 
    ON public.profiles FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Passo 6: Verificar se há usuários no auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 3;

-- Passo 7: Inserir registro de teste apenas se houver usuários
-- Se não houver usuários, pule este passo e crie um usuário pela interface primeiro
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Pegar o primeiro usuário existente
    SELECT id INTO user_id 
    FROM auth.users 
    LIMIT 1;
    
    -- Se houver usuário, criar perfil para ele
    IF user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, full_name, role) 
        VALUES (
            user_id,
            (SELECT email FROM auth.users WHERE id = user_id),
            'Usuário de Teste',
            'user'
        ) 
        ON CONFLICT (id) DO UPDATE SET 
            full_name = EXCLUDED.full_name,
            updated_at = NOW();
            
        RAISE NOTICE 'Perfil criado para usuário existente: %', user_id;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado. Crie um usuário pela interface primeiro.';
    END IF;
END $$;

-- Passo 8: Verificar se funcionou
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Passo 9: Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';
