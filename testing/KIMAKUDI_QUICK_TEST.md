# Teste Rápido - Firebase Kimakudi-DB

## 🔥 Firebase Credenciais Configuradas

**Projeto:** kimakudi-db  
**API Key:** AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8

## ⚡ Comandos de Teste Rápido

### 1. Testar Conexão Firebase
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

## 🧠 Testes de IA com Linguagem Natural

**Nota:** Substitua `CONNECTION_ID` pelo ID retornado na criação da conexão.

### Buscar Usuários
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { executeAIQueryPublic(input: { connectionId: \"CONNECTION_ID\", naturalQuery: \"buscar todos os usuários\" }) { naturalQuery generatedQuery results { data } status } }"
  }'
```

### Buscar Dados Ativos
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { executeAIQueryPublic(input: { connectionId: \"CONNECTION_ID\", naturalQuery: \"buscar dados ativos\" }) { naturalQuery generatedQuery results { data } status } }"
  }'
```

### Produtos por Preço
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { executeAIQueryPublic(input: { connectionId: \"CONNECTION_ID\", naturalQuery: \"produtos com preço maior que 100\" }) { naturalQuery generatedQuery results { data } status } }"
  }'
```

## 🔧 GraphQL Playground

Se preferir usar o GraphQL Playground em `http://localhost:4000/graphql`:

### Mutation para Criar Conexão:
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

### Mutation para Consulta IA:
```graphql
mutation TestAI($connectionId: String!) {
  executeAIQueryPublic(input: {
    connectionId: $connectionId
    naturalQuery: "buscar todos os usuários ativos"
  }) {
    id
    naturalQuery
    generatedQuery
    results {
      data
    }
    executionTime
    status
    error
  }
}
```

**Variables:**
```json
{
  "connectionId": "COLE_O_ID_DA_CONEXAO_AQUI"
}
```

## 🏗️ Configurar Firestore (Opcional)

Para ter dados reais para testar:

1. **Acesse:** https://console.firebase.google.com/project/kimakudi-db
2. **Vá para:** Firestore Database
3. **Configure regras temporárias:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;  // Apenas para testes
    }
  }
}
```

4. **Crie coleções de exemplo:**
   - `users` - com campos: name, email, active
   - `products` - com campos: name, price, category
   - `orders` - com campos: userId, total, status

## 📊 Resultados Esperados

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

### Consulta IA Firestore:
```json
{
  "data": {
    "executeAIQueryPublic": {
      "naturalQuery": "buscar todos os usuários",
      "generatedQuery": "{\"collection\": \"users\", \"operation\": \"get\", \"filters\": []}",
      "results": [{"data": "documento_firestore"}],
      "status": "SUCCESS"
    }
  }
}
```

## 🎯 Próximos Testes

Após confirmar que funciona:
1. Teste diferentes tipos de consulta em linguagem natural
2. Verifique o histórico de consultas
3. Teste com dados reais no Firestore
4. Experimente consultas mais complexas com filtros

**Tudo pronto para testar Firebase com kimakudi-db! 🚀**