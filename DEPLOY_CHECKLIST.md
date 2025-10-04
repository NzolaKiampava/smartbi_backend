# ✅ Checklist de Deploy - API de Gestão de Ficheiros

## 📋 Pré-Deploy

### Verificação de Código
- [x] TypeScript compila sem erros
- [x] Todos os ficheiros criados/modificados:
  - [x] `api/files.ts` (265 linhas)
  - [x] `src/schema/file-analysis.schema.ts` (modificado)
  - [x] `src/resolvers/file-analysis.resolvers.ts` (modificado)
  - [x] `testing/SmartBI-FileManagement.postman_collection.json` (novo)
  - [x] `testing/FILE_MANAGEMENT_TESTING_GUIDE.md` (novo)
  - [x] `IMPLEMENTATION_SUMMARY.md` (novo)
  - [x] `QUICK_REFERENCE.md` (novo)

### Configuração Local
- [ ] Testei localmente com `npm run dev` ou similar?
- [ ] Importei e executei coleção Postman localmente?
- [ ] Todos os 15 testes Postman passaram em local?
- [ ] CORS funciona do frontend local?

---

## 🚀 Deploy Steps

### 1. Commit e Push

```powershell
# Verificar status
git status

# Adicionar ficheiros
git add api/files.ts
git add src/schema/file-analysis.schema.ts
git add src/resolvers/file-analysis.resolvers.ts
git add testing/SmartBI-FileManagement.postman_collection.json
git add testing/FILE_MANAGEMENT_TESTING_GUIDE.md
git add IMPLEMENTATION_SUMMARY.md
git add QUICK_REFERENCE.md
git add DEPLOY_CHECKLIST.md

# Commit
git commit -m "feat: add complete file management API

- REST API with 4 endpoints (list, get, download, delete)
- GraphQL schema updated with FileUploadList type
- GraphQL resolvers with pagination and filtering
- 15 automated Postman tests
- Complete testing guide in Portuguese
- Implementation summary and quick reference"

# Push (trigger Vercel deploy)
git push
```

**Status:**
- [ ] Código commitado
- [ ] Código pushed para repositório
- [ ] Vercel deploy iniciado automaticamente

---

### 2. Configurar Variáveis de Ambiente (Vercel)

⚠️ **CRÍTICO:** Sem estas variáveis, a API não funcionará!

1. Ir para [Vercel Dashboard](https://vercel.com)
2. Selecionar projeto `smartbi-backend`
3. Ir para **Settings** → **Environment Variables**
4. Verificar/adicionar as seguintes variáveis:

| Variável | Valor | Onde Obter | Necessária? |
|----------|-------|------------|-------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API | ✅ SIM |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API → service_role | ✅ SIM |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase Dashboard → Settings → API → anon/public | ✅ SIM |

**Como obter SUPABASE_SERVICE_ROLE_KEY:**
1. Abrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar seu projeto
3. Ir para **Settings** → **API**
4. Rolar para baixo até **Project API keys**
5. Copiar chave `service_role` (⚠️ **secret**, não partilhar!)
6. Colar no Vercel como valor de `SUPABASE_SERVICE_ROLE_KEY`

**Status:**
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `SUPABASE_ANON_KEY` configurada
- [ ] Vercel redeployed após adicionar variáveis (se necessário)

---

### 3. Verificar Recursos Supabase

#### Bucket de Storage
1. Abrir [Supabase Dashboard](https://supabase.com/dashboard)
2. Ir para **Storage** → **Buckets**
3. Verificar que bucket `file-uploads` existe

**Status:**
- [ ] Bucket `file-uploads` existe
- [ ] Bucket é público (settings do bucket)

#### Tabela de Database
1. Ir para **Database** → **Tables**
2. Verificar que tabela `file_uploads` existe
3. Verificar colunas:
   - `id` (uuid, primary key)
   - `filename` (text)
   - `original_name` (text)
   - `mimetype` (text)
   - `size` (bigint)
   - `file_type` (text)
   - `encoding` (text)
   - `path` (text)
   - `uploaded_at` (timestamp)
   - `metadata` (jsonb)

**Status:**
- [ ] Tabela `file_uploads` existe
- [ ] Todas as colunas estão presentes

---

## 🧪 Testes Pós-Deploy

### 1. Verificar Deploy

1. Ir para [Vercel Dashboard](https://vercel.com)
2. Verificar que último deploy foi bem-sucedido (✅ verde)
3. Verificar logs do deploy (sem erros)

**Status:**
- [ ] Deploy bem-sucedido
- [ ] Sem erros nos logs

---

### 2. Testes REST API (Produção)

#### Importar Coleção Postman
1. Abrir Postman
2. Importar `testing/SmartBI-FileManagement.postman_collection.json`
3. Clicar na coleção → **Variables**
4. Alterar `baseUrl` de `{{baseUrl}}` para `{{prodUrl}}`
5. Ou alterar diretamente valor de `baseUrl` para `https://smartbi-backend-psi.vercel.app`

#### Executar Testes
1. Clicar nos 3 pontos da coleção
2. **Run collection**
3. Selecionar pasta **REST API Tests**
4. **Run SmartBI - File Management API**

**Resultados Esperados:**
- [ ] ✅ 1. List All Files (Default Pagination)
- [ ] ✅ 2. List Files with Custom Pagination
- [ ] ✅ 3. List Files with File Type Filter (CSV)
- [ ] ✅ 4. List Files with File Type Filter (EXCEL)
- [ ] ✅ 5. Get Single File Metadata by ID
- [ ] ✅ 6. Get File Metadata - Not Found
- [ ] ✅ 7. Download File by ID
- [ ] ✅ 8. Download File - Not Found
- [ ] ✅ 9. Delete File by ID (⚠️ elimina ficheiro real!)
- [ ] ✅ 10. Delete File - Not Found

**Status:** ___/10 testes passaram

---

### 3. Testes GraphQL API (Produção)

#### Executar Testes GraphQL
1. No Postman, expandir pasta **GraphQL API Tests**
2. Executar cada teste individualmente

**Resultados Esperados:**
- [ ] ✅ 1. List Files (GraphQL - Default Pagination)
- [ ] ✅ 2. List Files (GraphQL - With File Type Filter)
- [ ] ✅ 3. Get Single File (GraphQL)
- [ ] ✅ 4. Update File Metadata (GraphQL)
- [ ] ✅ 5. Delete File (GraphQL) (⚠️ elimina ficheiro real!)

**Status:** ___/5 testes passaram

---

### 4. Testar CORS do Frontend

#### Opção A: Console do Navegador
1. Abrir `https://smartbi-rcs.vercel.app`
2. Abrir DevTools (F12) → Console
3. Executar:

```javascript
fetch('https://smartbi-backend-psi.vercel.app/api/files')
  .then(res => res.json())
  .then(data => console.log('✅ CORS OK:', data))
  .catch(err => console.error('❌ CORS ERROR:', err));
```

**Status:**
- [ ] ✅ CORS funciona (console mostra dados)
- [ ] ❌ Erro CORS → Verificar `allowedOrigins` em `api/files.ts`

#### Opção B: Teste de Download no Navegador
1. Obter um `fileId` da listagem
2. Abrir no navegador:
   ```
   https://smartbi-backend-psi.vercel.app/api/files/{fileId}/download
   ```
3. Verificar que ficheiro é baixado

**Status:**
- [ ] Download funciona no navegador
- [ ] Nome do ficheiro está correto
- [ ] Conteúdo do ficheiro está correto

---

### 5. Testar Endpoints Individualmente

#### GET /api/files (List)
```bash
curl https://smartbi-backend-psi.vercel.app/api/files?limit=10
```

**Verificar:**
- [ ] Status 200
- [ ] JSON com `{ files: [], total, limit, offset, hasMore }`
- [ ] Array `files` contém objetos com propriedades corretas

#### GET /api/files/:id (Metadata)
```bash
curl https://smartbi-backend-psi.vercel.app/api/files/{file-id}
```

**Verificar:**
- [ ] Status 200
- [ ] JSON com metadados completos do ficheiro
- [ ] Propriedades: id, filename, original_name, mimetype, size, file_type, path, uploaded_at, metadata

#### GET /api/files/:id/download (Download)
```bash
curl -o test-download.csv https://smartbi-backend-psi.vercel.app/api/files/{file-id}/download
```

**Verificar:**
- [ ] Status 200
- [ ] Ficheiro foi baixado
- [ ] Conteúdo do ficheiro está correto
- [ ] Headers: Content-Type, Content-Disposition, Content-Length

#### DELETE /api/files/:id (Delete)
⚠️ **ATENÇÃO:** Isto elimina um ficheiro real!

```bash
curl -X DELETE https://smartbi-backend-psi.vercel.app/api/files/{file-id}
```

**Verificar:**
- [ ] Status 200
- [ ] JSON: `{ success: true, message: "...", fileId: "..." }`
- [ ] Ficheiro removido do Supabase Storage
- [ ] Registo removido da tabela `file_uploads`

---

## 🔍 Verificação de Integração

### Teste de Workflow Completo

1. **Upload** de ficheiro (usar endpoint existente `/api/upload`)
   - [ ] Upload bem-sucedido
   - [ ] Ficheiro aparece no Supabase Storage
   - [ ] Registo criado na tabela `file_uploads`

2. **Listar** ficheiros (`GET /api/files`)
   - [ ] Novo ficheiro aparece na lista
   - [ ] Metadados estão corretos

3. **Obter metadados** (`GET /api/files/:id`)
   - [ ] Retorna informações completas
   - [ ] Todos os campos estão presentes

4. **Download** (`GET /api/files/:id/download`)
   - [ ] Download funciona
   - [ ] Conteúdo do ficheiro está correto

5. **Atualizar metadados** (GraphQL mutation `updateFileMetadata`)
   - [ ] Metadata é atualizada
   - [ ] Merge com metadata existente funciona

6. **Eliminar** (`DELETE /api/files/:id`)
   - [ ] Ficheiro removido do storage
   - [ ] Registo removido da database
   - [ ] Verificar que ficheiro não aparece mais na lista

---

## 📊 Métricas de Performance

### Testar Latência

Use Postman ou ferramentas de monitoring para verificar:

| Endpoint | Tempo Esperado | Tempo Real |
|----------|----------------|------------|
| GET /api/files (50 items) | < 500ms | ___ms |
| GET /api/files/:id | < 100ms | ___ms |
| GET /api/files/:id/download (1MB) | < 2s | ___s |
| DELETE /api/files/:id | < 300ms | ___ms |

**Status:**
- [ ] Todos os endpoints dentro dos limites esperados
- [ ] Sem timeouts ou erros 504

---

## 🐛 Resolução de Problemas

### Se algo falhar:

#### Erro: "Missing SUPABASE_SERVICE_ROLE_KEY"
1. Verificar variável no Vercel
2. Confirmar que nome está correto (exatamente `SUPABASE_SERVICE_ROLE_KEY`)
3. Redeploy após adicionar

#### Erro: "File not found" ao listar
1. Verificar se existem ficheiros no bucket
2. Fazer upload de teste primeiro
3. Verificar nome do bucket (`file-uploads`)

#### Erro CORS no frontend
1. Verificar origem em `api/files.ts` linha ~25
2. Adicionar domínio do frontend se necessário
3. Commit e push

#### Download não funciona
1. Verificar SUPABASE_SERVICE_ROLE_KEY está configurada
2. Verificar bucket é público
3. Testar download direto no navegador

#### TypeScript errors no deploy
1. Executar `npm run build` localmente
2. Corrigir erros
3. Commit e push novamente

---

## ✅ Conclusão

### Critérios de Sucesso

Deploy está completo quando:

- [x] Código pushed para repositório
- [ ] Vercel deploy bem-sucedido
- [ ] Variáveis de ambiente configuradas
- [ ] Recursos Supabase verificados
- [ ] 10/10 testes REST passaram
- [ ] 5/5 testes GraphQL passaram
- [ ] CORS funciona do frontend
- [ ] Workflow completo testado
- [ ] Performance dentro dos limites
- [ ] Sem erros nos logs do Vercel

### Documentação

- [x] `FILE_MANAGEMENT_TESTING_GUIDE.md` - Guia de testes completo
- [x] `IMPLEMENTATION_SUMMARY.md` - Resumo da implementação
- [x] `QUICK_REFERENCE.md` - Referência rápida
- [x] `DEPLOY_CHECKLIST.md` - Este checklist
- [x] Coleção Postman com 15 testes
- [ ] Equipa informada sobre nova API
- [ ] Frontend team pronto para integrar

---

## 📞 Próximos Passos

1. [ ] Comunicar à equipa de frontend que API está pronta
2. [ ] Partilhar `QUICK_REFERENCE.md` com exemplos de código
3. [ ] Agendar sessão de integração com frontend
4. [ ] Monitorar logs do Vercel nos primeiros dias
5. [ ] Recolher feedback dos utilizadores

---

**Data de Deploy:** _____________________  
**Deploy realizado por:** _____________________  
**Testes passaram:** ___/15  
**Status final:** [ ] ✅ Sucesso  [ ] ⚠️ Com problemas  [ ] ❌ Falhou

---

**Notas adicionais:**
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________
