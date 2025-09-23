# 🔗 Guia Completo de Criação de Conexões - SmartBI

Este guia contém exemplos práticos para criar todos os tipos de conexões suportadas pelo SmartBI Backend.

## 📋 **Índice de Conexões Suportadas**

1. [MySQL](#mysql)
2. [PostgreSQL](#postgresql)
3. [Supabase](#supabase)
4. [Firebase Firestore](#firebase-firestore)
5. [MongoDB](#mongodb)
6. [API REST](#api-rest)
7. [API GraphQL](#api-graphql)
8. [Redis](#redis)
9. [Elasticsearch](#elasticsearch)
10. [Cassandra](#cassandra)
11. [DynamoDB](#dynamodb)

---

## 🗄️ **Bancos de Dados Relacionais**

### **MySQL**

```json
{
  "query": "mutation CreateMySQLConnection { createDataConnectionPublic(input: { type: MYSQL, name: \"MySQL Production\", description: \"Banco principal MySQL\", config: { host: \"localhost\", port: 3306, database: \"empresa_db\", username: \"admin\", password: \"senha123\" } }) { id name type status } }"
}
```

**Configurações Avançadas:**
```json
{
  "config": {
    "host": "mysql.empresa.com",
    "port": 3306,
    "database": "production_db",
    "username": "app_user",
    "password": "password_segura",
    "timeout": 30000
  }
}
```

### **PostgreSQL**

```json
{
  "query": "mutation CreatePostgreSQLConnection { createDataConnectionPublic(input: { type: POSTGRESQL, name: \"PostgreSQL Analytics\", description: \"Base de dados analíticos\", config: { host: \"postgres.empresa.com\", port: 5432, database: \"analytics_db\", username: \"readonly_user\", password: \"read123\" } }) { id name type status } }"
}
```

**Para PostgreSQL Local:**
```json
{
  "config": {
    "host": "localhost",
    "port": 5432,
    "database": "minha_empresa",
    "username": "postgres",
    "password": "postgres"
  }
}
```

### **Supabase**

```json
{
  "query": "mutation CreateSupabaseConnection { createDataConnectionPublic(input: { type: SUPABASE, name: \"Supabase Production\", description: \"Banco Supabase principal\", config: { apiUrl: \"https://xxxxxxxxxxx.supabase.co\", apiKey: \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\" } }) { id name type status } }"
}
```

**Como obter credenciais Supabase:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings → API
4. Copie URL e anon/service_role key

---

## 🔥 **Bancos NoSQL**

### **Firebase Firestore**

**Método 1: Com API Key (Simples)**
```json
{
  "query": "mutation CreateFirebaseConnection { createDataConnectionPublic(input: { type: FIREBASE, name: \"Firebase Analytics\", description: \"Dados de análise Firebase\", config: { apiUrl: \"meu-projeto-firebase\", apiKey: \"AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX\" } }) { id name type status } }"
}
```

**Método 2: Service Account (Recomendado)**
```json
{
  "config": {
    "apiUrl": "meu-projeto-firebase",
    "serviceAccountKey": "{\"type\":\"service_account\",\"project_id\":\"meu-projeto\",\"private_key_id\":\"...\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\",\"client_email\":\"firebase-adminsdk-xxxxx@meu-projeto.iam.gserviceaccount.com\"}"
  }
}
```

**Como obter credenciais Firebase:**
1. Console Firebase: https://console.firebase.google.com
2. Configurações do projeto → Contas de serviço
3. Gerar nova chave privada
4. Baixar JSON e usar como serviceAccountKey

### **MongoDB**

**MongoDB Local:**
```json
{
  "query": "mutation CreateMongoDBConnection { createDataConnectionPublic(input: { type: MONGODB, name: \"MongoDB Local\", description: \"Banco MongoDB local\", config: { connectionString: \"mongodb://localhost:27017/minha_empresa\" } }) { id name type status } }"
}
```

**MongoDB Atlas (Cloud):**
```json
{
  "config": {
    "connectionString": "mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/banco_producao?retryWrites=true&w=majority"
  }
}
```

**MongoDB com Autenticação:**
```json
{
  "config": {
    "connectionString": "mongodb://admin:senha123@mongodb.empresa.com:27017/empresa_db?authSource=admin"
  }
}
```

---

## 🌐 **APIs**

### **API REST**

**API Pública:**
```json
{
  "query": "mutation CreateAPIConnection { createDataConnectionPublic(input: { type: API_REST, name: \"JSONPlaceholder API\", description: \"API de testes\", config: { apiUrl: \"https://jsonplaceholder.typicode.com\" } }) { id name type status } }"
}
```

**API com Autenticação:**
```json
{
  "config": {
    "apiUrl": "https://api.empresa.com/v1",
    "apiKey": "Bearer sua-api-key-aqui",
    "headers": [
      {"key": "Authorization", "value": "Bearer token123"},
      {"key": "Content-Type", "value": "application/json"}
    ],
    "timeout": 15000
  }
}
```

**API com Headers Personalizados:**
```json
{
  "config": {
    "apiUrl": "https://api.exemplo.com",
    "headers": [
      {"key": "X-API-Key", "value": "sua-chave-api"},
      {"key": "User-Agent", "value": "SmartBI/1.0"},
      {"key": "Accept", "value": "application/json"}
    ]
  }
}
```

### **API GraphQL**

```json
{
  "query": "mutation CreateGraphQLConnection { createDataConnectionPublic(input: { type: API_GRAPHQL, name: \"GraphQL API\", description: \"API GraphQL da empresa\", config: { apiUrl: \"https://api.empresa.com/graphql\", headers: [{\"key\": \"Authorization\", \"value\": \"Bearer token123\"}] } }) { id name type status } }"
}
```

**GraphQL com Autenticação:**
```json
{
  "config": {
    "apiUrl": "https://api.github.com/graphql",
    "headers": [
      {"key": "Authorization", "value": "Bearer ghp_xxxxxxxxxxxxxxxxxxxx"},
      {"key": "User-Agent", "value": "SmartBI"}
    ]
  }
}
```

---

## 🚀 **Bancos Especializados**

### **Redis**

**Redis Local:**
```json
{
  "query": "mutation CreateRedisConnection { createDataConnectionPublic(input: { type: REDIS, name: \"Redis Cache\", description: \"Cache Redis local\", config: { host: \"localhost\", port: 6379 } }) { id name type status } }"
}
```

**Redis com Senha:**
```json
{
  "config": {
    "host": "redis.empresa.com",
    "port": 6379,
    "password": "redis_password_123",
    "database": "0"
  }
}
```

**Redis Cloud:**
```json
{
  "config": {
    "host": "redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com",
    "port": 12345,
    "password": "sua_senha_redis_cloud"
  }
}
```

### **Elasticsearch**

**Elasticsearch Local:**
```json
{
  "query": "mutation CreateElasticsearchConnection { createDataConnectionPublic(input: { type: ELASTICSEARCH, name: \"Elasticsearch Logs\", description: \"Índices de logs\", config: { apiUrl: \"http://localhost:9200\" } }) { id name type status } }"
}
```

**Elasticsearch Cloud:**
```json
{
  "config": {
    "apiUrl": "https://meu-cluster.es.us-east-1.aws.cloud.es.io:9243",
    "username": "elastic",
    "password": "senha_elasticsearch",
    "headers": [
      {"key": "Content-Type", "value": "application/json"}
    ]
  }
}
```

### **Cassandra**

**Cassandra Local:**
```json
{
  "query": "mutation CreateCassandraConnection { createDataConnectionPublic(input: { type: CASSANDRA, name: \"Cassandra Analytics\", description: \"Base de dados Cassandra\", config: { host: \"localhost\", port: 9042, database: \"analytics_keyspace\" } }) { id name type status } }"
}
```

**Cassandra Cluster:**
```json
{
  "config": {
    "host": "cassandra-cluster.empresa.com",
    "port": 9042,
    "database": "empresa_keyspace",
    "username": "cassandra_user",
    "password": "cassandra_pass"
  }
}
```

### **DynamoDB**

**DynamoDB AWS:**
```json
{
  "query": "mutation CreateDynamoDBConnection { createDataConnectionPublic(input: { type: DYNAMODB, name: \"DynamoDB Production\", description: \"Tabelas DynamoDB AWS\", config: { apiUrl: \"https://dynamodb.us-east-1.amazonaws.com\", apiKey: \"AKIA...\", headers: [{\"key\": \"AWS-Region\", \"value\": \"us-east-1\"}] } }) { id name type status } }"
}
```

**DynamoDB Local:**
```json
{
  "config": {
    "apiUrl": "http://localhost:8000",
    "apiKey": "fake-access-key",
    "headers": [
      {"key": "AWS-Region", "value": "local"}
    ]
  }
}
```

---

## 🧪 **Scripts de Teste**

### **PowerShell - Testar Todas as Conexões**

```powershell
# Arquivo: test-all-connections.ps1

$baseUrl = "http://localhost:4000/graphql"

# Array de conexões para testar
$connections = @(
    @{
        name = "MySQL Local"
        type = "MYSQL"
        config = @{
            host = "localhost"
            port = 3306
            database = "test"
            username = "root"
            password = "password"
        }
    },
    @{
        name = "PostgreSQL Local"
        type = "POSTGRESQL"
        config = @{
            host = "localhost"
            port = 5432
            database = "postgres"
            username = "postgres"
            password = "postgres"
        }
    },
    @{
        name = "Firebase Test"
        type = "FIREBASE"
        config = @{
            apiUrl = "meu-projeto"
            apiKey = "AIzaSy..."
        }
    }
)

foreach ($conn in $connections) {
    Write-Host "Testando: $($conn.name)" -ForegroundColor Cyan
    
    $body = @{
        query = "mutation CreateConnection { createDataConnectionPublic(input: { type: $($conn.type), name: `"$($conn.name)`", config: $($conn.config | ConvertTo-Json -Compress) }) { id name type status } }"
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json"
        
        if ($response.data) {
            Write-Host "✅ Sucesso: $($conn.name)" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro: $($response.errors[0].message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Falha na requisição: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep 1
}
```

### **Bash - Testar Conexões**

```bash
#!/bin/bash
# test-connections.sh

BASE_URL="http://localhost:4000/graphql"

# Função para testar conexão
test_connection() {
    local name=$1
    local type=$2
    local config=$3
    
    echo "🧪 Testando: $name"
    
    curl -s -X POST $BASE_URL \
        -H "Content-Type: application/json" \
        -d "{
            \"query\": \"mutation { createDataConnectionPublic(input: { type: $type, name: \\\"$name\\\", config: $config }) { id name type status } }\"
        }" | jq '.'
    
    echo ""
}

# Testar MySQL
test_connection "MySQL Local" "MYSQL" '{"host":"localhost","port":3306,"database":"test","username":"root","password":"password"}'

# Testar Firebase
test_connection "Firebase Test" "FIREBASE" '{"apiUrl":"projeto-teste","apiKey":"AIzaSy..."}'

# Testar MongoDB
test_connection "MongoDB Local" "MONGODB" '{"connectionString":"mongodb://localhost:27017/test"}'
```

---

## 📚 **Exemplos de Consultas Após Conexão**

### **Consultas em Linguagem Natural**

```json
{
  "query": "mutation ExecuteQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { naturalQuery generatedQuery results { data } status error } }",
  "variables": {
    "input": {
      "connectionId": "sua-conexao-id",
      "naturalQuery": "buscar todos os usuários ativos"
    }
  }
}
```

**Exemplos de queries por tipo:**

- **SQL:** "mostrar vendas do último mês"
- **Firebase:** "buscar produtos com preço maior que 100"
- **MongoDB:** "contar documentos na collection pedidos"
- **API:** "listar todos os posts"

---

## 🔧 **Troubleshooting**

### **Erros Comuns:**

1. **"invalid input value for enum connection_type"**
   - **Solução:** Atualizar enum do banco de dados

2. **"Connection timeout"**
   - **Solução:** Verificar host, porta e firewall

3. **"Authentication failed"**
   - **Solução:** Verificar credenciais e permissões

4. **"Host not found"**
   - **Solução:** Verificar conectividade de rede

### **Comandos Úteis:**

```bash
# Testar conectividade
ping host.exemplo.com
telnet host.exemplo.com 5432

# Verificar portas
netstat -an | grep 3306
```

---

## 🎯 **Próximos Passos**

1. **Escolha o tipo de conexão** adequado para seus dados
2. **Colete as credenciais** necessárias
3. **Use os exemplos** deste guia
4. **Teste a conexão** antes de usar em produção
5. **Configure consultas** em linguagem natural

**💡 Dica:** Comece sempre com conexões simples (MySQL local, APIs públicas) antes de configurar sistemas mais complexos.