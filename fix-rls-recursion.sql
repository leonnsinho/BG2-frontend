-- Script para corrigir recursão infinita nas políticas RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

-- 2. Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar se a tabela está funcionando
SELECT COUNT(*) FROM profiles;

-- 4. Recriar políticas RLS simples e seguras
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Política para DELETE: usuários podem deletar apenas seu próprio perfil
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 5. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Testar a tabela
SELECT COUNT(*) FROM profiles;
