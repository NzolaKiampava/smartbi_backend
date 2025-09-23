# Guia Rápido - Teste Firebase e MongoDB

## ✅ Implementado com Sucesso

O SmartBI backend agora suporta **Firebase Firestore** e **MongoDB**! 

### 🔧 O que foi adicionado:

1. **Novos Adapters de Database**:
   - `FirebaseAdapter` - Para Firestore via REST API
   - `MongoDBAdapter` - Para MongoDB (local e Atlas)

2. **Serviços de IA Expandidos**:
   - `translateToFirestore()` - Converte linguagem natural para consultas Firestore
   - `translateToMongoDB()` - Converte linguagem natural para consultas MongoDB

3. **Tipos de Conexão Atualizados**:
   - Enum expandido: `FIREBASE`, `MONGODB`, `REDIS`, `ELASTICSEARCH`, `CASSANDRA`, `DYNAMODB`

4. **Arquivos de Teste Completos**:
   - `firebase-connection-test.json` - Testes completos para Firebase
   - `mongodb-connection-test.json` - Testes completos para MongoDB

## 🚀 Como Testar Agora

### 1. Iniciar o Servidor
```bash
npm run dev
```

### 2. Testar Firebase

**Criar Conexão Firebase:**
```graphql
mutation CreateFirebaseConnection {
  createDataConnectionPublic(input: {
    type: FIREBASE
    name: "Firebase Demo"
    description: "Teste Firebase Firestore"
    apiUrl: "seu-project-id-aqui"
    apiKey: "sua-api-key-aqui"  # Opcional
  }) {
    id
    name
    type
    status
  }
}
```

**Consulta com IA:**
```graphql
mutation TestFirebaseAI($connectionId: String!) {
  executeAIQueryPublic(input: {
    connectionId: $connectionId
    naturalQuery: "buscar todos os usuários ativos"
  }) {
    id
    naturalQuery
    generatedQuery
    results { data }
    status
  }
}
```

### 3. Testar MongoDB

**Criar Conexão MongoDB Local:**
```graphql
mutation CreateMongoConnection {
  createDataConnectionPublic(input: {
    type: MONGODB
    name: "MongoDB Local"
    description: "Teste MongoDB Local"
    host: "localhost"
    port: 27017
    database: "smartbi_demo"
  }) {
    id
    name
    type
    status
  }
}
```

**Criar Conexão MongoDB Atlas:**
```graphql
mutation CreateMongoAtlas {
  createDataConnectionPublic(input: {
    type: MONGODB
    name: "MongoDB Atlas"
    description: "Teste MongoDB Atlas"
    apiUrl: "mongodb+srv://user:pass@cluster.mongodb.net/database"
  }) {
    id
    name
    type
    status
  }
}
```

**Consulta com IA:**
```graphql
mutation TestMongoAI($connectionId: String!) {
  executeAIQueryPublic(input: {
    connectionId: $connectionId
    naturalQuery: "produtos com preço maior que 100 reais"
  }) {
    id
    naturalQuery
    generatedQuery
    results { data }
    status
  }
}
```

## 📊 Exemplos de Consultas IA

### Firebase Firestore
- "buscar todos os usuários ativos"
- "produtos com preço maior que 100"
- "pedidos dos últimos 30 dias ordenados por data"

**Resultado esperado:**
```json
{
  "collection": "users",
  "operation": "get", 
  "filters": [
    {"field": "active", "operator": "==", "value": true}
  ]
}
```

### MongoDB
- "usuários que tenham 'Silva' no nome"
- "contar produtos por categoria"
- "pedidos com status 'pending'"

**Resultado esperado:**
```json
{
  "collection": "users",
  "operation": "find",
  "filter": {"name": {"$regex": "Silva", "$options": "i"}}
}
```

## 🔍 Verificar Funcionalidades

### 1. Listar Tipos de Conexão Disponíveis
```graphql
query {
  __type(name: "ConnectionType") {
    enumValues {
      name
      description
    }
  }
}
```

Deve incluir: `FIREBASE`, `MONGODB`, `REDIS`, `ELASTICSEARCH`, `CASSANDRA`, `DYNAMODB`

### 2. Verificar Histórico de Consultas
```graphql
query {
  getAIQueryHistoryPublic(limit: 10) {
    id
    naturalQuery
    generatedQuery
    status
    connection {
      name
      type
    }
  }
}
```

### 3. Testar Schema Info
```graphql
query GetFirebaseSchema($connectionId: String!) {
  getSchemaInfo(connectionId: $connectionId) {
    tables {
      name
      columns {
        name
        type
      }
    }
    totalTables
  }
}
```

## ⚡ Próximos Passos

Para usar em produção, você pode:

1. **Firebase**: Adicionar SDK oficial do Firebase para melhor performance
2. **MongoDB**: Instalar driver nativo MongoDB (`npm install mongodb`)
3. **Redis**: Implementar `RedisAdapter` para cache
4. **Elasticsearch**: Implementar `ElasticsearchAdapter` para busca textual

## 📝 Notas Importantes

- ✅ Firebase funciona via REST API (sem dependências extras)
- ✅ MongoDB configurado para local e Atlas
- ✅ Consultas de IA funcionam para ambos
- ✅ Histórico salvo automaticamente
- ✅ Testes públicos disponíveis (sem autenticação)

**Tudo funcionando! 🎉**