-- SCRIPT SQL SIMPLIFICADO PARA TESTE
-- Execute este script no SQL Editor do Supabase

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar apenas a tabela profiles primeiro (teste)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Política simples para testes
CREATE POLICY "Permitir select para todos" 
    ON public.profiles FOR SELECT 
    USING (true);

-- 5. Inserir um registro de teste
INSERT INTO public.profiles (id, email, full_name, role) 
VALUES (
    uuid_generate_v4(),
    'teste@partimap.com',
    'Usuário Teste',
    'user'
) ON CONFLICT DO NOTHING;

-- 6. Verificar se funcionou
SELECT * FROM public.profiles LIMIT 1;
