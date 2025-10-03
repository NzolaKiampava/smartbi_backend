# 🔧 Frontend File Upload Configuration Fix

## ❌ Problema Atual

O frontend está tentando fazer upload para a URL incorreta:
```
http://localhost:4000/upload  ❌ ERRADO
```

Resultando em erro 404: `Route not found`

## ✅ Solução

O endpoint correto é:
```
http://localhost:4000/api/upload  ✅ CORRETO (Local)
https://smartbi-backend-psi.vercel.app/api/upload  ✅ CORRETO (Produção)
```

---

## 📝 Como Atualizar o Frontend

### 1️⃣ Localize o arquivo do serviço GraphQL

Procure por `graphqlService.ts` ou similar que contém a função `uploadFile` ou `uploadAndAnalyzeFileV2`.

### 2️⃣ Atualize a URL do endpoint de upload

**ANTES:**
```typescript
const uploadEndpoint = 'http://localhost:4000/upload'; // ❌
```

**DEPOIS:**
```typescript
// Para desenvolvimento local
const uploadEndpoint = 'http://localhost:4000/api/upload'; // ✅

// Ou use variável de ambiente (recomendado)
const uploadEndpoint = `${import.meta.env.VITE_API_URL}/api/upload`; // ✅
```

### 3️⃣ Configure variáveis de ambiente

Crie/atualize o arquivo `.env` no frontend:

```env
# Desenvolvimento
VITE_API_URL=http://localhost:4000

# Produção (no Vercel ou onde o frontend está hospedado)
VITE_API_URL=https://smartbi-backend-psi.vercel.app
```

### 4️⃣ Use a variável no código

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async uploadFile(file: File) {
  const uploadEndpoint = `${API_URL}/api/upload`; // ✅ Correto
  
  // Converter arquivo para base64
  const base64Content = await this.fileToBase64(file);
  
  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileContent: base64Content,
      fileName: file.name,
      mimeType: file.type,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Upload failed: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}
```

---

## 📋 Estrutura da Requisição

### Request Body (JSON)

```json
{
  "fileContent": "base64-encoded-file-content",
  "fileName": "query_results_2025-09-27.csv",
  "mimeType": "text/csv",
  "analysisOptions": {} // opcional
}
```

### Response (Success - 200)

```json
{
  "success": true,
  "fileId": "uuid-do-arquivo",
  "fileName": "1234567890-query_results_2025-09-27.csv",
  "originalName": "query_results_2025-09-27.csv",
  "size": 12345,
  "url": "https://supabase.url/storage/file-uploads/...",
  "message": "File uploaded successfully. Use fileId with GraphQL analyzeUploadedFile mutation."
}
```

### Response (Error - 400/500)

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (only in development)"
}
```

---

## 🔄 Fluxo Completo de Upload

### Passo 1: Upload via REST API
```typescript
const uploadResult = await uploadFile(file);
// Retorna: { success: true, fileId: "uuid-123", ... }
```

### Passo 2: Análise via GraphQL
```typescript
const analysisResult = await analyzeUploadedFile(uploadResult.fileId);
// Retorna dados da análise pela IA
```

### Exemplo Completo:
```typescript
async uploadAndAnalyzeFileV2(file: File, analysisOptions: any = {}) {
  try {
    console.log('🚀 Starting 2-step file upload and analysis...');
    
    // Step 1: Upload file
    console.log('📤 Step 1: Uploading file to REST API...');
    const uploadResult = await this.uploadFile(file);
    console.log('✅ Upload successful:', uploadResult);
    
    // Step 2: Analyze via GraphQL
    console.log('🔍 Step 2: Analyzing file via GraphQL...');
    const analysisResult = await this.analyzeUploadedFile(
      uploadResult.fileId,
      analysisOptions
    );
    console.log('✅ Analysis complete:', analysisResult);
    
    return {
      success: true,
      upload: uploadResult,
      analysis: analysisResult,
    };
  } catch (error) {
    console.error('❌ Upload and analysis process failed:', error);
    throw error;
  }
}
```

---

## 🧪 Testando

### Teste 1: Verificar se o endpoint está disponível
```bash
curl https://smartbi-backend-psi.vercel.app/api/upload
```

Deve retornar: `Method not allowed. Use POST for file uploads.`

### Teste 2: Upload de teste
```bash
# Criar arquivo de teste em base64
echo "test content" | base64

# Fazer upload
curl -X POST https://smartbi-backend-psi.vercel.app/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileContent": "dGVzdCBjb250ZW50Cg==",
    "fileName": "test.txt",
    "mimeType": "text/plain"
  }'
```

---

## ⚠️ CORS Verificado

O endpoint `/api/upload` já está configurado com CORS para:
- ✅ `http://localhost:3000`
- ✅ `http://localhost:5173`
- ✅ `http://localhost:5174`
- ✅ `https://smartbi-frontend.vercel.app`

Se seu frontend usar outra porta, adicione ao arquivo `api/upload.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:PORTA_DO_SEU_FRONTEND', // Adicione aqui
  'https://smartbi-frontend.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);
```

---

## 📊 Status do Backend

- ✅ Endpoint `/api/upload` criado e funcional
- ✅ CORS configurado
- ✅ Suporte a arquivos até 50MB
- ✅ Upload para Supabase Storage
- ✅ Metadados salvos no banco de dados
- ✅ GraphQL mutation `analyzeUploadedFile` disponível

---

## 🎯 Próximos Passos

1. Atualizar URL no frontend: `/upload` → `/api/upload`
2. Configurar variáveis de ambiente
3. Testar upload localmente
4. Fazer deploy do frontend atualizado
5. Testar em produção

---

## 📞 Debug

Se continuar com erro:

1. **Verifique a URL no console do browser:**
   ```
   Console log deve mostrar: http://localhost:4000/api/upload ✅
   Não deve mostrar: http://localhost:4000/upload ❌
   ```

2. **Verifique CORS no Network tab:**
   - Preflight OPTIONS deve retornar 204
   - POST deve retornar 200 (sucesso) ou 400/500 (erro do servidor)

3. **Verifique o body da requisição:**
   - Deve conter `fileContent`, `fileName`, `mimeType`
   - `fileContent` deve ser string base64 válida

---

Após atualizar o frontend, o upload deve funcionar perfeitamente! 🚀
