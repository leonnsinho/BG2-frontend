-- Criar bucket para arquivos de comentários de tarefas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-files',
  'task-files',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ]
);

-- Políticas de segurança para o bucket task-files
-- Permitir que usuários autenticados façam upload
CREATE POLICY "Users can upload task files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Permitir que usuários autenticados vejam arquivos
CREATE POLICY "Users can view task files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated'
  );

-- Permitir que o usuário que fez upload possa deletar
CREATE POLICY "Users can delete own task files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'task-files' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Atualizar tabela de comentários para incluir arquivos
ALTER TABLE task_comments 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Índice para melhor performance nas consultas de anexos
CREATE INDEX idx_task_comments_attachments ON task_comments USING GIN (attachments);

-- Comentário na coluna para documentação
COMMENT ON COLUMN task_comments.attachments IS 'Array de objetos JSON contendo informações dos arquivos anexados: [{name, path, size, type, uploaded_at}]';