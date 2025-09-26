# Configuração do Upload de Arquivos - Supabase

## 1. Executar SQL no Supabase Dashboard

Acesse o **SQL Editor** no dashboard do Supabase e execute o arquivo `create_task_files_bucket.sql`:

### Passos:
1. Vá para **SQL Editor** no painel do Supabase
2. Clique em **New Query**
3. Cole o conteúdo do arquivo `sql/create_task_files_bucket.sql`
4. Execute o SQL (botão **Run** ou `Ctrl+Enter`)

### O que será criado:
- ✅ Bucket `task-files` para armazenar arquivos
- ✅ Políticas de segurança para upload/download/visualização
- ✅ Coluna `attachments` na tabela `task_comments`
- ✅ Índice para performance nas consultas

## 2. Verificar se foi criado corretamente

### Verificar Bucket:
```sql
SELECT * FROM storage.buckets WHERE id = 'task-files';
```

### Verificar Políticas:
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### Verificar Coluna:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_comments' AND column_name = 'attachments';
```

## 3. Configurações do Bucket

- **Nome**: `task-files`
- **Público**: `false` (privado)
- **Limite de tamanho**: 10MB por arquivo
- **Tipos permitidos**: 
  - Imagens: JPG, PNG, GIF, WEBP
  - Documentos: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
  - Texto: TXT, CSV

## 4. Estrutura dos Arquivos

Os arquivos serão organizados da seguinte forma:
```
task-files/
  {user_id}/
    {task_id}/
      {timestamp}-{random}.{extension}
```

## 5. Como usar

1. **Upload**: Arquivos são enviados automaticamente ao adicionar comentário
2. **Visualização**: Clique no ícone de olho para ver imagens/PDFs
3. **Download**: Clique no ícone de download para baixar qualquer arquivo
4. **Segurança**: URLs assinadas válidas por 1 hora

## 6. Limites e Restrições

- Máximo 3 arquivos por comentário
- Máximo 10MB por arquivo
- URLs de download expiram em 1 hora
- Apenas usuários autenticados podem fazer upload
- Usuários só podem deletar seus próprios arquivos

## Troubleshooting

Se houver erro na execução do SQL, verifique:

1. **Permissões**: Certifique-se que tem permissão de admin
2. **Storage**: Confirme que o módulo Storage está ativado
3. **RLS**: As políticas RLS devem estar habilitadas na tabela storage.objects

### Testar Upload:
Após executar o SQL, teste fazendo upload de um arquivo em qualquer comentário de tarefa.