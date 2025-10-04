# 🚀 Configuração de Produção - SmartBI Backend

## ✅ Pré-requisitos (Já Concluídos)

### 1. Bucket do Supabase
- ✅ Bucket `file-uploads` criado manualmente no Supabase Dashboard
- ✅ Configurado como público
- ✅ Funcionando localmente

### 2. Tabela do Banco de Dados
- ✅ Tabela `file_uploads` criada com a migration SQL
- ✅ Enum `FileType` configurado corretamente

## 🔑 Configuração Necessária no Vercel

Para o sistema funcionar em produção, você precisa adicionar a variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` no Vercel:

### Como Obter a Service Role Key

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto SmartBI
3. Vá em **Settings** → **API**
4. Na seção **Project API keys**, copie a chave **`service_role`** (⚠️ NÃO a `anon` key)
   - A service_role key começa com `eyJ...` e é muito longa
   - ⚠️ **IMPORTANTE**: Esta chave tem privilégios de administrador e bypassa RLS

### Como Adicar no Vercel

1. Acesse https://vercel.com/nzolaKiampava/smartbi-backend/settings/environment-variables
2. Clique em **Add New**
3. Configure:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Cole a service_role key copiada do Supabase
   - **Environments**: Selecione **Production**, **Preview** e **Development**
4. Clique em **Save**

### Redesploy

Após adicionar a variável de ambiente:
1. Vá em **Deployments**
2. Clique em **Redeploy** na última deployment
3. Ou faça push de qualquer commit para trigger automático

## 🔄 Por Que Precisa da Service Role Key?

### Diferença entre as Keys

| Key | Propósito | Permissões | RLS |
|-----|-----------|-----------|-----|
| **anon** | Frontend/Cliente | Limitadas | ✅ Enforça RLS |
| **service_role** | Backend/Admin | Completas | ❌ Bypassa RLS |

### O Problema

Localmente, o sistema funciona porque usa a service_role key configurada em `.env`.

Em produção (Vercel), o código atual usa apenas `SUPABASE_ANON_KEY`, que:
- ❌ **Não pode fazer uploads** no bucket (bloqueado por RLS)
- ❌ **Não pode inserir** na tabela `file_uploads` (bloqueado por RLS)
- ❌ **Não pode listar buckets** (operação administrativa)

Com `SUPABASE_SERVICE_ROLE_KEY`, o backend:
- ✅ **Pode fazer uploads** sem restrições RLS
- ✅ **Pode inserir registros** na tabela
- ✅ **Tem acesso total** às operações administrativas

### Segurança

⚠️ **NUNCA exponha a service_role key no frontend!**

Neste projeto, a arquitetura está correta:
- ✅ Frontend usa apenas `SUPABASE_ANON_KEY` (seguro, limitado)
- ✅ Backend (Vercel serverless) usa `SUPABASE_SERVICE_ROLE_KEY` (protegido, admin)
- ✅ A service_role key fica apenas nas variáveis de ambiente do servidor

## 📝 Variáveis de Ambiente Completas

Certifique-se de que todas estas variáveis estão configuradas no Vercel:

```env
# Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJ... (chave pública)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (chave admin) ⬅️ ADICIONAR ESTA

# JWT (obrigatório)
JWT_SECRET=sua-chave-secreta-jwt
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Gemini AI (obrigatório para análise)
GEMINI_API_KEY=AIzaSy...

# Node (opcional)
NODE_ENV=production
PORT=4000
```

## 🧪 Testando Após Deploy

1. Acesse https://smartbi-rcs.vercel.app
2. Faça login
3. Tente fazer upload de um arquivo CSV
4. Verifique que o upload funciona e a análise é feita

### Logs de Diagnóstico

Se ainda houver problemas, verifique os logs no Vercel:
1. Vá em **Deployments** → Clique na última deployment
2. Vá em **Functions** → Clique em `/api/upload`
3. Verifique os logs de execução

Procure por:
- ✅ `Using existing bucket: file-uploads`
- ✅ `File upload successful`
- ✅ `Database insert successful`
- ❌ Qualquer erro relacionado a RLS ou permissões

## 🔧 Troubleshooting

### Erro: "new row violates row-level security policy"
**Causa**: `SUPABASE_SERVICE_ROLE_KEY` não está configurada ou está errada  
**Solução**: Verifique que copiou a service_role key correta do Supabase e redesployou

### Erro: "Bucket not found"
**Causa**: O bucket não existe ou o nome está errado  
**Solução**: Verifique no Supabase Dashboard → Storage que o bucket `file-uploads` existe

### Erro: "Invalid API key"
**Causa**: A service_role key está incorreta ou expirou  
**Solução**: Copie novamente do Supabase Dashboard → Settings → API

### Erro: "Network request failed"
**Causa**: `SUPABASE_URL` está errada ou o projeto Supabase está pausado  
**Solução**: Verifique a URL e que o projeto está ativo

## 📚 Recursos

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Última atualização**: 4 de outubro de 2025  
**Status**: Código atualizado, aguardando configuração de env var no Vercel
