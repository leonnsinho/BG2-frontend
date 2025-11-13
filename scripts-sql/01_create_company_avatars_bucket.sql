-- ================================================
-- SCRIPT: Criar Storage Bucket para Logos de Empresas
-- Data: 2025-11-12
-- Descrição: Cria bucket privado para armazenar logos das empresas
-- ================================================

-- 1. Criar bucket para logos de empresas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-avatars',
  'company-avatars',
  false, -- Bucket privado (requer signed URLs)
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. Políticas de Acesso (RLS)

-- Permitir que usuários autenticados façam upload de logos
CREATE POLICY "Authenticated users can upload company avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-avatars'
);

-- Permitir que usuários autenticados visualizem logos
CREATE POLICY "Authenticated users can view company avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-avatars'
);

-- Permitir que usuários autenticados atualizem logos
CREATE POLICY "Authenticated users can update company avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-avatars'
);

-- Permitir que usuários autenticados deletem logos
CREATE POLICY "Authenticated users can delete company avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-avatars'
);

-- ================================================
-- VERIFICAÇÃO
-- ================================================

-- Verificar se o bucket foi criado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'company-avatars';

-- Verificar políticas criadas
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
