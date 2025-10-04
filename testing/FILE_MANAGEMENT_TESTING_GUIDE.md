# Guia de Testes - API de Gestão de Ficheiros

## Visão Geral

Este guia descreve como testar as APIs de gestão de ficheiros do SmartBI, incluindo funcionalidades de listagem, visualização de metadados, download e eliminação de ficheiros.

## APIs Disponíveis

### REST API
- **GET /api/files** - Listar todos os ficheiros com paginação e filtros
- **GET /api/files/:id** - Obter metadados de um ficheiro específico
- **GET /api/files/:id/download** - Fazer download de um ficheiro
- **DELETE /api/files/:id** - Eliminar um ficheiro

### GraphQL API
- **Query listFileUploads** - Listar ficheiros com paginação e filtros
- **Query getFileUpload** - Obter metadados de um ficheiro
- **Mutation updateFileMetadata** - Atualizar metadados de um ficheiro
- **Mutation deleteFileUpload** - Eliminar um ficheiro

---

## Pré-requisitos

### 1. Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas no Vercel:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

⚠️ **IMPORTANTE**: A `SUPABASE_SERVICE_ROLE_KEY` é necessária para operações de upload, download e eliminação.

### 2. Bucket Supabase
- Nome do bucket: `file-uploads`
- Status: Deve estar criado manualmente no Supabase
- Permissões: Configurado como público para permitir downloads

### 3. Ferramentas de Teste
- **Postman** (recomendado): Para testes REST e GraphQL
- **cURL**: Para testes rápidos via linha de comando
- **Navegador**: Para testar downloads diretamente

---

## Configuração do Postman

### Importar a Coleção

1. Abra o Postman
2. Clique em **Import**
3. Selecione o ficheiro: `testing/SmartBI-FileManagement.postman_collection.json`
4. A coleção será importada com 15 testes pré-configurados

### Configurar Variáveis

A coleção usa as seguintes variáveis:

| Variável | Valor Local | Valor Produção | Descrição |
|----------|-------------|----------------|-----------|
| `baseUrl` | `http://localhost:3000` | `https://smartbi-backend-psi.vercel.app` | URL base da API |
| `fileId` | *auto-preenchido* | *auto-preenchido* | ID do ficheiro para testes |

**Para alternar entre local e produção:**
1. Clique no nome da coleção
2. Vá para **Variables**
3. Altere `baseUrl` para `{{prodUrl}}` para usar produção

---

## Testes REST API

### 1. Listar Todos os Ficheiros

**Endpoint:** `GET /api/files`

**Parâmetros de Query (opcionais):**
- `limit` (padrão: 50) - Número máximo de ficheiros a retornar
- `offset` (padrão: 0) - Número de ficheiros a saltar (paginação)
- `fileType` - Filtrar por tipo de ficheiro (CSV, EXCEL, PDF, etc.)

**Exemplo - cURL:**
```bash
curl -X GET "http://localhost:3000/api/files?limit=10&offset=0"
```

**Resposta Esperada:**
```json
{
  "files": [
    {
      "id": "uuid-here",
      "filename": "sanitized-filename.csv",
      "original_name": "original filename.csv",
      "mimetype": "text/csv",
      "size": 1024,
      "file_type": "CSV",
      "path": "https://...",
      "uploaded_at": "2024-01-01T00:00:00Z",
      "metadata": {}
    }
  ],
  "total": 100,
  "limit": 10,
  "offset": 0,
  "hasMore": true
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Resposta tem estrutura de paginação (files, total, limit, offset, hasMore)
- ✅ `files` é um array
- ✅ Primeiro fileId é guardado para testes subsequentes

---

### 2. Listar Ficheiros com Filtro de Tipo

**Endpoint:** `GET /api/files?fileType=CSV`

**Tipos Válidos:**
- `CSV`
- `EXCEL`
- `PDF`
- `SQL`
- `JSON`
- `TXT`
- `XML`
- `OTHER`

**Exemplo - cURL:**
```bash
curl -X GET "http://localhost:3000/api/files?fileType=CSV&limit=20"
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Todos os ficheiros retornados têm `file_type` igual ao filtro

---

### 3. Obter Metadados de um Ficheiro

**Endpoint:** `GET /api/files/:id`

**Exemplo - cURL:**
```bash
curl -X GET "http://localhost:3000/api/files/your-file-id"
```

**Resposta Esperada:**
```json
{
  "id": "uuid-here",
  "filename": "sanitized-filename.csv",
  "original_name": "original filename.csv",
  "mimetype": "text/csv",
  "size": 1024,
  "file_type": "CSV",
  "encoding": "base64",
  "path": "https://...",
  "uploaded_at": "2024-01-01T00:00:00Z",
  "metadata": {
    "sanitized_filename": "sanitized-filename",
    "upload_timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Resposta contém todas as propriedades esperadas
- ✅ ID corresponde ao ID solicitado

**Caso de Erro - ID Inválido:**
```bash
curl -X GET "http://localhost:3000/api/files/00000000-0000-0000-0000-000000000000"
```

**Resposta de Erro:**
```json
{
  "error": "File not found"
}
```

- ✅ Status code é 404
- ✅ Mensagem de erro indica ficheiro não encontrado

---

### 4. Download de Ficheiro

**Endpoint:** `GET /api/files/:id/download`

**Exemplo - cURL:**
```bash
curl -X GET "http://localhost:3000/api/files/your-file-id/download" \
  --output downloaded-file.csv
```

**Exemplo - Navegador:**
```
http://localhost:3000/api/files/your-file-id/download
```

**Headers da Resposta:**
```
Content-Type: text/csv (ou tipo apropriado)
Content-Disposition: attachment; filename="original filename.csv"
Content-Length: 1024
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Header `Content-Disposition` existe e contém "attachment"
- ✅ Header `Content-Type` existe
- ✅ Header `Content-Length` existe
- ✅ Corpo da resposta contém dados binários do ficheiro

**Caso de Erro - ID Inválido:**
- ✅ Status code é 404
- ✅ Mensagem de erro em JSON

---

### 5. Eliminar Ficheiro

**Endpoint:** `DELETE /api/files/:id`

⚠️ **ATENÇÃO**: Esta operação é irreversível!

**Exemplo - cURL:**
```bash
curl -X DELETE "http://localhost:3000/api/files/your-file-id"
```

**Resposta Esperada:**
```json
{
  "success": true,
  "message": "File deleted successfully",
  "fileId": "uuid-here"
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ `success` é true
- ✅ Mensagem indica eliminação bem-sucedida
- ✅ `fileId` está presente

**Caso de Erro - ID Inválido:**
- ✅ Status code é 404
- ✅ Mensagem de erro indica ficheiro não encontrado

**Comportamento:**
1. Elimina o ficheiro do Supabase Storage (bucket `file-uploads`)
2. Elimina o registo da tabela `file_uploads`
3. Se a eliminação do storage falhar, continua e elimina da database
4. Retorna sucesso se a eliminação da database for bem-sucedida

---

## Testes GraphQL API

### 1. Listar Ficheiros (GraphQL)

**Endpoint:** `POST /graphql`

**Query:**
```graphql
query ListFileUploads($limit: Int, $offset: Int, $fileType: FileType) {
  listFileUploads(limit: $limit, offset: $offset, fileType: $fileType) {
    files {
      id
      filename
      originalName
      mimetype
      size
      fileType
      uploadedAt
      path
    }
    total
    limit
    offset
    hasMore
  }
}
```

**Variáveis:**
```json
{
  "limit": 20,
  "offset": 0,
  "fileType": "CSV"
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "listFileUploads": {
      "files": [...],
      "total": 100,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ `data.listFileUploads` existe
- ✅ Estrutura de paginação está completa
- ✅ Primeiro fileId é guardado

---

### 2. Obter Ficheiro Individual (GraphQL)

**Query:**
```graphql
query GetFileUpload($id: ID!) {
  getFileUpload(id: $id) {
    id
    filename
    originalName
    mimetype
    size
    fileType
    encoding
    path
    uploadedAt
    metadata
  }
}
```

**Variáveis:**
```json
{
  "id": "your-file-id"
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Dados do ficheiro estão completos

---

### 3. Atualizar Metadados (GraphQL)

**Mutation:**
```graphql
mutation UpdateFileMetadata($id: ID!, $metadata: JSON!) {
  updateFileMetadata(id: $id, metadata: $metadata) {
    id
    filename
    originalName
    metadata
  }
}
```

**Variáveis:**
```json
{
  "id": "your-file-id",
  "metadata": {
    "custom_field": "custom_value",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "updateFileMetadata": {
      "id": "uuid-here",
      "filename": "filename.csv",
      "originalName": "original.csv",
      "metadata": {
        "sanitized_filename": "filename",
        "upload_timestamp": "...",
        "custom_field": "custom_value",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    }
  }
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Metadados foram atualizados (merge com existentes)

---

### 4. Eliminar Ficheiro (GraphQL)

**Mutation:**
```graphql
mutation DeleteFileUpload($id: ID!) {
  deleteFileUpload(id: $id)
}
```

**Variáveis:**
```json
{
  "id": "your-file-id"
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "deleteFileUpload": true
  }
}
```

**Testes Automáticos (Postman):**
- ✅ Status code é 200
- ✅ Retorna `true` para indicar sucesso

---

## Cenários de Teste Completos

### Cenário 1: Workflow Completo de Upload e Gestão

1. **Upload de Ficheiro** (usar `POST /api/upload`)
2. **Listar Ficheiros** → Verificar que o novo ficheiro aparece
3. **Obter Metadados** → Verificar informações do ficheiro
4. **Atualizar Metadados** → Adicionar informações personalizadas
5. **Download** → Verificar conteúdo do ficheiro
6. **Eliminar** → Remover ficheiro
7. **Listar Novamente** → Verificar que ficheiro foi removido

### Cenário 2: Paginação

1. Fazer upload de 25 ficheiros
2. Listar com `limit=10, offset=0` → Receber primeiros 10, `hasMore=true`
3. Listar com `limit=10, offset=10` → Receber próximos 10, `hasMore=true`
4. Listar com `limit=10, offset=20` → Receber últimos 5, `hasMore=false`

### Cenário 3: Filtros por Tipo

1. Fazer upload de ficheiros CSV, EXCEL e PDF
2. Listar com `fileType=CSV` → Apenas ficheiros CSV
3. Listar com `fileType=EXCEL` → Apenas ficheiros EXCEL
4. Listar sem filtro → Todos os ficheiros

### Cenário 4: Tratamento de Erros

1. Tentar obter ficheiro com ID inválido → 404
2. Tentar download de ficheiro inexistente → 404
3. Tentar eliminar ficheiro já eliminado → 404
4. Verificar mensagens de erro são claras

---

## Execução dos Testes no Postman

### Executar Todos os Testes

1. Abra a coleção `SmartBI - File Management API`
2. Clique nos três pontos → **Run collection**
3. Selecione todos os testes
4. Clique em **Run SmartBI - File Management API**
5. Aguarde execução completa
6. Revise o relatório de testes

### Executar Testes Individuais

1. Expanda a pasta **REST API Tests** ou **GraphQL API Tests**
2. Clique em um teste específico
3. Clique em **Send**
4. Verifique a resposta e os testes na aba **Test Results**

### Ordem Recomendada de Execução

**Testes REST:**
1. List All Files (Default Pagination) → Define `fileId`
2. List Files with Custom Pagination
3. List Files with File Type Filter
4. Get Single File Metadata by ID
5. Download File by ID
6. Delete File by ID (executar por último)

**Testes GraphQL:**
1. List Files (GraphQL) → Define `fileId`
2. Get Single File (GraphQL)
3. Update File Metadata (GraphQL)
4. Delete File (GraphQL) (executar por último)

---

## Testes Manuais no Frontend

### Integração com Frontend React

```tsx
// Exemplo de código para listar ficheiros
async function listFiles() {
  const response = await fetch('https://smartbi-backend-psi.vercel.app/api/files?limit=50');
  const data = await response.json();
  console.log('Files:', data.files);
  console.log('Total:', data.total);
  console.log('Has more:', data.hasMore);
}

// Exemplo de código para download
async function downloadFile(fileId: string) {
  const response = await fetch(
    `https://smartbi-backend-psi.vercel.app/api/files/${fileId}/download`
  );
  const blob = await response.blob();
  
  // Criar link de download temporário
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = response.headers.get('Content-Disposition')?.split('filename="')[1]?.slice(0, -1) || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Exemplo de código para eliminar
async function deleteFile(fileId: string) {
  const response = await fetch(
    `https://smartbi-backend-psi.vercel.app/api/files/${fileId}`,
    { method: 'DELETE' }
  );
  const data = await response.json();
  console.log('Deleted:', data.success);
}
```

---

## Verificação de CORS

### Origens Permitidas

As seguintes origens estão configuradas para acesso CORS:

- `https://smartbi-rcs.vercel.app` (produção)
- `http://localhost:3000` (desenvolvimento)
- `http://localhost:5173` (Vite)
- `http://localhost:5174` (Vite alternativo)

### Testar CORS no Navegador

1. Abra as DevTools do navegador (F12)
2. Vá para a aba **Console**
3. Execute:

```javascript
fetch('https://smartbi-backend-psi.vercel.app/api/files')
  .then(res => res.json())
  .then(data => console.log('CORS OK:', data))
  .catch(err => console.error('CORS ERROR:', err));
```

4. Se aparecer erro CORS, verifique:
   - A origem do frontend está na lista de permitidas
   - Headers CORS estão presentes na resposta

---

## Resolução de Problemas

### Erro: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Causa:** Variável de ambiente não configurada no Vercel

**Solução:**
1. Vá para o projeto no Vercel Dashboard
2. Settings → Environment Variables
3. Adicione `SUPABASE_SERVICE_ROLE_KEY` com o valor correto
4. Redeploy a aplicação

### Erro: "File not found" ao fazer download

**Causas Possíveis:**
1. Ficheiro foi eliminado do storage mas registo ainda existe na database
2. Nome do ficheiro no registo está incorreto
3. Bucket name está errado

**Solução:**
1. Verificar se ficheiro existe no Supabase Storage UI
2. Comparar `filename` no database com nome no storage
3. Confirmar bucket é `file-uploads`

### Erro: "CORS policy" no frontend

**Causa:** Origem não está na lista de permitidas

**Solução:**
1. Editar `api/files.ts` linha ~25
2. Adicionar nova origem ao array `allowedOrigins`
3. Fazer commit e push para deploy

### Download retorna JSON em vez de ficheiro

**Causa:** Está usando endpoint errado

**Solução:** Use `/api/files/:id/download` e não `/api/files/:id`

---

## Checklist de Deploy

Antes de considerar os testes completos em produção:

- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada no Vercel
- [ ] Variável `SUPABASE_URL` configurada no Vercel
- [ ] Variável `SUPABASE_ANON_KEY` configurada no Vercel
- [ ] Bucket `file-uploads` existe no Supabase
- [ ] Tabela `file_uploads` existe no Supabase
- [ ] Código foi deployed para Vercel (git push)
- [ ] Todas as rotas REST respondem 200
- [ ] GraphQL endpoint responde corretamente
- [ ] Downloads funcionam e retornam ficheiros corretos
- [ ] CORS funciona do frontend em produção
- [ ] Paginação funciona com diferentes valores de limit/offset
- [ ] Filtros por tipo de ficheiro funcionam
- [ ] Eliminação remove ficheiros do storage e database
- [ ] Atualização de metadados persiste corretamente

---

## Métricas de Sucesso

### Performance
- Listar 50 ficheiros: < 500ms
- Obter metadados: < 100ms
- Download de ficheiro 1MB: < 2s
- Eliminar ficheiro: < 300ms

### Cobertura de Testes
- ✅ 10 testes REST API
- ✅ 5 testes GraphQL API
- ✅ Cenários de erro cobertos
- ✅ Paginação testada
- ✅ Filtros testados
- ✅ CORS testado

---

## Suporte

Se encontrar problemas:

1. Verifique os logs no Vercel Dashboard
2. Verifique os logs do Supabase
3. Revise este guia de testes
4. Consulte `PRODUCTION_SETUP.md` para configuração

**Última atualização:** 2024-01-20
