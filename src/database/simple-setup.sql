-- SCRIPT SIMPLIFICADO - SÓ ESTRUTURA
-- Execute este no SQL Editor do Supabase

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela profiles (sem inserir dados)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'consultant', 'company_admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar política permissiva para testes
DROP POLICY IF EXISTS "Permitir tudo para teste" ON public.profiles;
CREATE POLICY "Permitir tudo para teste" 
    ON public.profiles FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 5. Verificar se a tabela foi criada
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar RLS
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' 
AND schemaname = 'public';

-- SUCESSO! 
-- Agora a tabela existe e você pode testar a conexão na aplicação.
-- Para inserir dados, primeiro crie um usuário pela interface de autenticação.
