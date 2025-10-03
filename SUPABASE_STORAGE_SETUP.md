# Supabase Storage Setup Guide

## 📦 Criar Bucket para File Uploads

### Opção 1: Criação Automática (Recomendado)
O backend agora tenta criar o bucket automaticamente na primeira vez que um arquivo é enviado. Se falhar, siga a Opção 2.

### Opção 2: Criação Manual no Supabase Dashboard

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com/project/YOUR_PROJECT_ID/storage/buckets
   
2. **Crie um Novo Bucket**
   - Clique em "New bucket"
   - **Nome do bucket**: `file-uploads`
   - **Public bucket**: ✅ Sim (marque esta opção)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: 
     - `text/csv`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `application/pdf`
     - `application/json`
     - `text/plain`
     - `application/xml`
     - `text/xml`
     - `application/sql`

3. **Configurar Políticas de Acesso (RLS)**
   
   Vá para: Storage → file-uploads → Policies
   
   **Política 1: Public Upload**
   ```sql
   CREATE POLICY "Allow public uploads"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'file-uploads');
   ```
   
   **Política 2: Public Read**
   ```sql
   CREATE POLICY "Allow public downloads"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'file-uploads');
   ```
   
   **Política 3: Authenticated Delete**
   ```sql
   CREATE POLICY "Allow authenticated deletes"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'file-uploads' AND auth.role() = 'authenticated');
   ```

## 🗄️ Tabela de Metadados

⚠️ **IMPORTANTE**: Você já deve ter uma tabela chamada `file-uploads` com os seguintes campos:

```
- id (UUID)
- original_name (VARCHAR)
- mimetype (VARCHAR)
- encoding (VARCHAR)
- size (INT4)
- path (TEXT)
- file_type (FileType enum)
- uploaded_at (TIMESTAMPTZ)
- metadata (JSONB)
```

Se você **não tiver** essa tabela, execute este SQL no Supabase SQL Editor:

```sql
-- Criar tabela para metadados dos arquivos (APENAS SE NÃO EXISTIR)
CREATE TABLE IF NOT EXISTS "file-uploads" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_name VARCHAR NOT NULL,
  mimetype VARCHAR NOT NULL,
  encoding VARCHAR DEFAULT 'base64',
  size INT4 NOT NULL,
  path TEXT NOT NULL,
  file_type VARCHAR NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON "file-uploads"(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_original_name ON "file-uploads"(original_name);

-- Ativar Row Level Security
ALTER TABLE "file-uploads" ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir que qualquer pessoa insira (upload é público)
CREATE POLICY "Allow public inserts on file-uploads"
ON "file-uploads" FOR INSERT
WITH CHECK (true);

-- Permitir leitura pública
CREATE POLICY "Allow public reads on file-uploads"
ON "file-uploads" FOR SELECT
USING (true);

-- Apenas usuários autenticados podem deletar
CREATE POLICY "Allow authenticated deletes on file-uploads"
ON "file-uploads" FOR DELETE
USING (auth.role() = 'authenticated');
```

## ✅ Verificação

Após configurar, teste o upload:

```bash
# Teste local
curl -X POST http://localhost:4000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.csv",
    "fileContent": "bmFtZSxhZ2UKSm9obiwzMAo=",
    "mimeType": "text/csv"
  }'

# Teste em produção
curl -X POST https://smartbi-backend-psi.vercel.app/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.csv",
    "fileContent": "bmFtZSxhZ2UKSm9obiwzMAo=",
    "mimeType": "text/csv"
  }'
```

## 🔍 Troubleshooting

### Erro: "Bucket not found"
- Verifique se o bucket `file-uploads` existe no dashboard
- Execute a criação manual seguindo a Opção 2
- Verifique se o bucket é público

### Erro: "new row violates row-level security policy"
- Verifique se as políticas RLS estão configuradas corretamente
- Execute os comandos SQL de políticas acima

### Erro: "File size limit exceeded"
- Verifique se o bucket tem o limite de 50MB configurado
- Verifique se o arquivo não excede 50MB

## 📚 Referências

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
