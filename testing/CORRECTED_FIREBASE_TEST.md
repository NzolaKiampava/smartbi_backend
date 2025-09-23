# Comando de Teste Corrigido - Firebase Kimakudi

## ⚠️ Problema Identificado: Error 404

O erro **404 Not Found** indica que o projeto "kimakudi-db" não foi encontrado. Vamos diagnosticar:

### 🔍 Diagnóstico Primeiro

**1. Verificar se o projeto existe:**
```bash
curl "https://firebase.googleapis.com/v1beta1/projects/kimakudi-db"
```

**2. Testar Firestore direto:**
```bash
curl "https://firestore.googleapis.com/v1/projects/kimakudi-db/databases/(default)/documents"
```

## ✅ Comandos Corretos (Schema Atualizado)

### 1. Teste SIMPLES (sem API key primeiro)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\" } }) { success message } }"
  }'
```

### 2. Teste com API key
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { testConnection(input: { type: FIREBASE, name: \"Kimakudi Test\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { success message latency } }"
  }'
```

### 2. Criar Conexão Firebase
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createDataConnectionPublic(input: { type: FIREBASE, name: \"Kimakudi DB\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { id name type status } }"
  }'
```

### 3. Listar Conexões
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { getDataConnectionsPublic { id name type status config { apiUrl } } }"
  }'
```

## 🔧 GraphQL Playground

### Mutation Correta:
```graphql
mutation CreateKimakudiConnection {
  createDataConnectionPublic(input: {
    type: FIREBASE
    name: "Kimakudi DB"
    config: {
      apiUrl: "kimakudi-db"
      apiKey: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
    }
  }) {
    id
    name
    type
    status
    config {
      apiUrl
    }
  }
}
```

### Teste de Conexão:
```graphql
mutation TestKimakudiFirebase {
  testConnection(input: {
    type: FIREBASE
    name: "Kimakudi Test"
    config: {
      apiUrl: "kimakudi-db"
      apiKey: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8"
    }
  }) {
    success
    message
    latency
  }
}
```

## ⚠️ Problema Resolvido

O erro anterior:
```
Field "apiKey" is not defined by type "DataConnectionInput"
```

**Causa:** `apiKey` estava sendo usado diretamente no input, quando deveria estar dentro de `config`.

**Solução:** Mover `apiKey` para dentro do objeto `config`:
- ❌ `apiKey: "value"` (direto no input)
- ✅ `config: { apiKey: "value" }` (dentro de config)

## 📊 Resultado Esperado

### Teste de Conexão:
```json
{
  "data": {
    "testConnection": {
      "success": true,
      "message": "Firebase connection successful (Status: 200 or 403)",
      "latency": 150
    }
  }
}
```

### Criação de Conexão:
```json
{
  "data": {
    "createDataConnectionPublic": {
      "id": "uuid-generated",
      "name": "Kimakudi DB",
      "type": "FIREBASE",
      "status": "ACTIVE"
    }
  }
}
```

**Agora os comandos estão corretos! 🎉**