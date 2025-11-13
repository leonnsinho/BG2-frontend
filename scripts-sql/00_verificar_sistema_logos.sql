-- ================================================
-- SCRIPT DE VERIFICAÇÃO: Sistema de Logo de Empresas
-- Use este script para verificar se tudo foi configurado corretamente
-- ================================================

-- 1. Verificar se o bucket company-avatars existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'company-avatars';

-- Resultado esperado:
-- ✅ Deve retornar 1 linha com:
--    - id: company-avatars
--    - public: false
--    - file_size_limit: 5242880 (5MB)
--    - allowed_mime_types: {image/jpeg, image/jpg, image/png, image/gif, image/webp}


-- 2. Verificar se a coluna logo_url existe na tabela companies
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'companies'
  AND column_name = 'logo_url';

-- Resultado esperado:
-- ✅ Deve retornar 1 linha com:
--    - column_name: logo_url
--    - data_type: text
--    - is_nullable: YES


-- 3. Verificar empresas com logo
SELECT 
  id,
  name,
  logo_url,
  created_at
FROM companies
WHERE logo_url IS NOT NULL;

-- Resultado esperado:
-- ✅ Deve retornar as empresas que têm logo cadastrado


-- 4. Verificar arquivos no bucket company-avatars
SELECT 
  name,
  created_at,
  metadata->>'size' as size_bytes,
  metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'company-avatars'
ORDER BY created_at DESC;

-- Resultado esperado:
-- ✅ Deve retornar os arquivos de logo que foram enviados


-- 5. Verificar políticas RLS do bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%company avatar%';

-- Resultado esperado:
-- ✅ Deve retornar 4 políticas:
--    - Authenticated users can upload company avatars (INSERT)
--    - Authenticated users can view company avatars (SELECT)
--    - Authenticated users can update company avatars (UPDATE)
--    - Authenticated users can delete company avatars (DELETE)


-- ================================================
-- DIAGNÓSTICO DE PROBLEMAS
-- ================================================

-- Se o bucket NÃO EXISTE:
-- Execute o script: 01_create_company_avatars_bucket.sql

-- Se a coluna logo_url NÃO EXISTE:
-- Execute o script: 02_add_logo_url_to_companies.sql

-- Se as políticas NÃO EXISTEM:
-- Execute novamente o script: 01_create_company_avatars_bucket.sql

-- Se tudo existe mas o logo não aparece:
-- 1. Verifique se o arquivo foi realmente enviado (query 4)
-- 2. Verifique se o logo_url foi salvo na empresa (query 3)
-- 3. Abra o console do navegador (F12) e veja os logs
