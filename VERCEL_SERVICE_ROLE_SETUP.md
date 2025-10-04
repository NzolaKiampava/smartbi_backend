# 🔐 Configurar SUPABASE_SERVICE_ROLE_KEY no Vercel

## ⚠️ Problema Atual

O upload de arquivos está falhando em produção com erro:
```
"new row violates row-level security policy"
```

**Causa**: O backend está usando `SUPABASE_ANON_KEY` que não tem permissões para:
- Criar buckets no Storage
- Fazer uploads (dependendo das políticas RLS)

**Solução**: Usar `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS e tem permissões completas.

---

## 📝 Passo a Passo

### 1️⃣ Obter a Service Role Key do Supabase

1. Acesse: https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
2. Na seção **Project API keys**, copie a chave **`service_role`** (não a `anon`!)
   
   ⚠️ **IMPORTANTE**: A service role key é **secreta** e tem **permissões totais**. Nunca exponha no frontend!

### 2️⃣ Adicionar no Vercel

1. Acesse: https://vercel.com/nzolaKiampava/smartbi-backend/settings/environment-variables
2. Clique em **"Add New"**
3. Preencha:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: Cole a chave copiada (começa com `eyJ...`)
   - **Environments**: Marque todas (Production, Preview, Development)
4. Clique em **"Save"**

### 3️⃣ Redeploy

Após adicionar a variável, faça redeploy:

```bash
git commit --allow-empty -m "trigger redeploy after adding env var"
git push
```

Ou vá no dashboard da Vercel e clique em **"Redeploy"** no último deployment.

---

## 🧪 Testar

Após o redeploy, teste novamente o upload em:
- https://smartbi-rcs.vercel.app

O upload deve funcionar agora! ✅

---

## 🔒 Segurança

A **service role key**:
- ✅ Só é usada no **backend** (seguro)
- ✅ Nunca é exposta ao **frontend**
- ✅ Bypassa todas as políticas RLS
- ⚠️ Deve ser tratada como **senha de admin**

**Nunca comite a service role key no código!** Sempre use variáveis de ambiente.

---

## 📚 Variáveis de Ambiente Necessárias no Vercel

Certifique-se de ter todas essas configuradas:

| Variável | Onde Obter | Obrigatória |
|----------|------------|-------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | ✅ Sim |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | ✅ Sim |
| `JWT_SECRET` | Gere com: `openssl rand -hex 32` | ✅ Sim |
| `GEMINI_API_KEY` | Google AI Studio | ✅ Sim |
| `GCP_PROJECT_ID` | Google Cloud Console | ⚠️ Opcional |
| `DOCUMENT_AI_LOCATION` | Google Cloud Console | ⚠️ Opcional |
| `DOCUMENT_AI_PROCESSOR_ID` | Google Cloud Console | ⚠️ Opcional |
| `FRONTEND_URL` | URL do seu frontend | ⚠️ Opcional |

---

## ✅ Checklist

- [ ] Copiou `service_role` key do Supabase
- [ ] Adicionou `SUPABASE_SERVICE_ROLE_KEY` no Vercel
- [ ] Fez redeploy
- [ ] Testou upload no frontend em produção
- [ ] Upload funcionou sem erros de RLS

---

🎉 **Após seguir estes passos, o upload deve funcionar perfeitamente!**
