-- Script para verificar estrutura das tabelas existentes
-- Execute este primeiro para ver como as tabelas estão organizadas

-- 1. Verificar estrutura da tabela companies
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela user_companies
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_companies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ver dados existentes nas tabelas
SELECT 'COMPANIES:' as tabela, COUNT(*) as registros FROM companies
UNION ALL
SELECT 'PROFILES:' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'USER_COMPANIES:' as tabela, COUNT(*) as registros FROM user_companies;

-- 5. Ver algumas linhas de exemplo (se existirem)
SELECT 'Exemplo Companies:' as info, * FROM companies LIMIT 3;
SELECT 'Exemplo Profiles:' as info, * FROM profiles LIMIT 3;
SELECT 'Exemplo User_Companies:' as info, * FROM user_companies LIMIT 3;
