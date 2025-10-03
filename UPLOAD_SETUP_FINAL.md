# 🚀 Setup Final para Upload de Arquivos

## ✅ O que você já tem:
- ✅ Tabela `file-uploads` no Supabase com os campos corretos
- ✅ Código backend atualizado em `api/upload.ts`
- ✅ CORS configurado

## 📋 Checklist - O que falta fazer:

### 1️⃣ Criar o Bucket no Supabase Storage

**Passos:**
1. Acesse: https://app.supabase.com → Seu Projeto → **Storage**
2. Clique em **"New bucket"**
3. Configure:
   - **Nome**: `file-uploads` (exatamente este nome)
   - **Public bucket**: ✅ **MARQUE COMO PÚBLICO**
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: 
     ```
     text/csv
     application/vnd.ms-excel
     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     application/pdf
     application/json
     text/plain
     application/xml
     text/xml
     application/sql
     ```
4. Clique em **"Create bucket"**

### 2️⃣ Configurar Políticas RLS no Bucket

**Opção A: Via Interface (Recomendado)**
1. Vá para: **Storage** → **file-uploads** → **Policies**
2. Clique em **"New Policy"**
3. Crie 3 políticas:

**Política 1: Upload Público**
- Nome: `Allow public uploads`
- Allowed operation: `INSERT`
- Policy definition: `(bucket_id = 'file-uploads'::text)`

**Política 2: Leitura Pública**
- Nome: `Allow public reads`
- Allowed operation: `SELECT`
- Policy definition: `(bucket_id = 'file-uploads'::text)`

**Política 3: Delete Autenticado**
- Nome: `Allow authenticated deletes`
- Allowed operation: `DELETE`
- Policy definition: `((bucket_id = 'file-uploads'::text) AND (auth.role() = 'authenticated'::text))`

**Opção B: Via SQL**
Execute no **SQL Editor**:
```sql
-- Política: Permitir upload público
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow public uploads',
  '(bucket_id = ''file-uploads''::text)'
)
ON CONFLICT DO NOTHING;

-- Política: Permitir leitura pública
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow public reads',
  '(bucket_id = ''file-uploads''::text)'
)
ON CONFLICT DO NOTHING;

-- Política: Permitir delete autenticado
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'file-uploads',
  'Allow authenticated deletes',
  '((bucket_id = ''file-uploads''::text) AND (auth.role() = ''authenticated''::text))'
)
ON CONFLICT DO NOTHING;
```

### 3️⃣ Verificar Políticas RLS na Tabela

Execute no **SQL Editor** para garantir que as políticas estão ativas:

```sql
-- Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'file-uploads';

-- Listar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'file-uploads';

-- Se não houver políticas, criar:
ALTER TABLE "file-uploads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on file-uploads"
ON "file-uploads" FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public reads on file-uploads"
ON "file-uploads" FOR SELECT
USING (true);

CREATE POLICY "Allow authenticated deletes on file-uploads"
ON "file-uploads" FOR DELETE
USING (auth.role() = 'authenticated');
```

### 4️⃣ Deploy para Vercel

```bash
git add .
git commit -m "fix: update file upload to use existing file-uploads table"
git push
```

### 5️⃣ Testar o Upload

**Teste Local:**
```bash
# Crie um arquivo test.csv com conteúdo: name,age\nJohn,30
# Converta para base64 (no PowerShell):
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("name,age`nJohn,30"))
# Resultado: bmFtZSxhZ2UKSm9obiwzMA==

# Teste o endpoint:
curl -X POST http://localhost:4000/api/upload `
  -H "Content-Type: application/json" `
  -d '{\"fileName\":\"test.csv\",\"fileContent\":\"bmFtZSxhZ2UKSm9obiwzMA==\",\"mimeType\":\"text/csv\"}'
```

**Teste em Produção:**
```bash
curl -X POST https://smartbi-backend-psi.vercel.app/api/upload `
  -H "Content-Type: application/json" `
  -d '{\"fileName\":\"test.csv\",\"fileContent\":\"bmFtZSxhZ2UKSm9obiwzMA==\",\"mimeType\":\"text/csv\"}'
```

**Teste no Frontend:**
- Acesse seu frontend
- Tente fazer upload de um arquivo CSV, Excel ou PDF
- Verifique no Supabase Storage se o arquivo apareceu
- Verifique na tabela `file-uploads` se os metadados foram salvos

---

## 🔍 Troubleshooting

### Erro: "Bucket not found"
✅ **Solução**: Crie o bucket `file-uploads` no Supabase Storage (Passo 1)

### Erro: "new row violates row-level security policy"
✅ **Solução**: Configure as políticas RLS na tabela (Passo 3)

### Erro: "The resource already exists"
✅ **Solução**: O bucket ou tabela já existe. Verifique se está configurado corretamente.

### Arquivo não aparece no Storage
✅ **Solução**: Verifique as políticas do bucket (Passo 2)

### Metadados não são salvos na tabela
✅ **Solução**: Verifique as políticas RLS da tabela (Passo 3)

---

## ✅ Checklist de Verificação Final

- [ ] Bucket `file-uploads` criado e **PÚBLICO**
- [ ] Bucket tem políticas: Upload, Read e Delete
- [ ] Tabela `file-uploads` existe com campos corretos
- [ ] Tabela tem políticas RLS: Insert, Select e Delete
- [ ] Código commitado e deployed no Vercel
- [ ] Teste de upload funcionando (local ou produção)
- [ ] Arquivo aparece no Supabase Storage
- [ ] Metadados aparecem na tabela `file-uploads`

Quando todos os itens estiverem ✅, o upload estará funcionando perfeitamente! 🎉
