# Guia de Testes - Conexões com Bancos de Dados Externos

## 📋 Pré-requisitos

1. **Postman** instalado
2. **SmartBI Backend** rodando (npm run dev)
3. **Conta de usuário** criada no sistema
4. **Chave do Gemini API** configurada
5. **Acesso aos bancos de dados** que deseja testar

## 🚀 Configuração Inicial

### 1. Importar Collection
- Abra o Postman
- Clique em "Import"
- Selecione o arquivo `SmartBI-DataConnections.postman_collection.json`

### 2. Configurar Variáveis
Na aba "Variables" da collection, configure:

```
baseUrl: http://localhost:4000/graphql
auth_token: (será preenchido automaticamente após login)
connection_id: (será preenchido automaticamente)
```

## 🔐 Autenticação

### Passo 1: Fazer Login
Execute o request **"Authentication > Login"** com suas credenciais:

```json
{
  "email": "admin@empresa.com",
  "password": "sua_senha"
}
```

✅ **Resultado esperado**: Token JWT salvo automaticamente nas variáveis da collection.

## 🗃️ Testando Conexões com Bancos Externos

### 1. MySQL Externo

#### Teste de Conexão (sem salvar)
Execute **"Test Different Database Types > Test MySQL External"**

Modifique as variáveis para seu banco:
```json
{
  "input": {
    "name": "Test MySQL",
    "type": "MYSQL",
    "config": {
      "host": "seu-servidor-mysql.com",
      "port": 3306,
      "database": "nome_do_banco",
      "username": "usuario_readonly",
      "password": "senha_segura"
    }
  }
}
```

#### Criar Conexão Permanente
Execute **"Data Connections > Create MySQL Connection"**

### 2. PostgreSQL Externo

#### Teste de Conexão
Execute **"Test Different Database Types > Test PostgreSQL External"**

Exemplo para AWS RDS:
```json
{
  "config": {
    "host": "myinstance.abcdefg.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "database": "production",
    "username": "readonly_user",
    "password": "SecurePassword123!"
  }
}
```

#### Exemplo para Azure PostgreSQL:
```json
{
  "config": {
    "host": "myserver.postgres.database.azure.com",
    "port": 5432,
    "database": "analytics",
    "username": "admin@myserver",
    "password": "ComplexPassword123!"
  }
}
```

### 3. API REST Externa

#### Teste com API Pública
Execute **"Test Different Database Types > Test API REST External"**

Exemplo com JSONPlaceholder (API de teste):
```json
{
  "config": {
    "apiUrl": "https://jsonplaceholder.typicode.com",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

#### Exemplo com API Autenticada:
```json
{
  "config": {
    "apiUrl": "https://api.suaempresa.com",
    "apiKey": "sua_api_key_aqui",
    "headers": [
      {
        "key": "Authorization",
        "value": "Bearer sua_api_key"
      },
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ]
  }
}
```

## 🧪 Testando Consultas IA

### 1. Obter Schema do Banco
Execute **"Data Connections > Get Schema Info"**

Isso mostrará todas as tabelas e colunas disponíveis:
```json
{
  "data": {
    "getSchemaInfo": {
      "totalTables": 5,
      "tables": [
        {
          "name": "users",
          "columns": [
            {"name": "id", "type": "int", "nullable": false},
            {"name": "name", "type": "varchar(255)", "nullable": false},
            {"name": "email", "type": "varchar(255)", "nullable": false}
          ]
        }
      ]
    }
  }
}
```

### 2. Executar Consultas em Linguagem Natural

#### Consulta Simples
Execute **"AI Queries > Execute AI Query - Count Records"**

```json
{
  "input": {
    "connectionId": "uuid-da-conexao",
    "naturalQuery": "Quantos usuários estão cadastrados?"
  }
}
```

#### Consultas Mais Complexas
```json
// Vendas por período
{
  "naturalQuery": "Vendas totais dos últimos 3 meses agrupadas por mês"
}

// Top produtos
{
  "naturalQuery": "Top 10 produtos mais vendidos no último trimestre"
}

// Análise de clientes
{
  "naturalQuery": "Clientes que não fizeram pedidos nos últimos 6 meses"
}
```

## 🔍 Exemplos de Bancos Reais

### 1. MySQL na AWS RDS
```json
{
  "config": {
    "host": "mydb.cluster-abcdefg.us-east-1.rds.amazonaws.com",
    "port": 3306,
    "database": "ecommerce",
    "username": "analytics_user",
    "password": "SecurePass123!",
    "timeout": 30000
  }
}
```

### 2. PostgreSQL no Google Cloud SQL
```json
{
  "config": {
    "host": "34.123.456.789",
    "port": 5432,
    "database": "warehouse",
    "username": "readonly",
    "password": "CloudSQLPass123!",
    "timeout": 25000
  }
}
```

### 3. Banco On-Premise
```json
{
  "config": {
    "host": "192.168.1.100",
    "port": 3306,
    "database": "erp_database",
    "username": "report_user",
    "password": "InternalPass123!",
    "timeout": 45000
  }
}
```

## 📊 Interpretando Resultados

### Teste de Conexão Bem-sucedido
```json
{
  "data": {
    "testDataConnection": {
      "success": true,
      "message": "MySQL connection successful",
      "latency": 125,
      "schemaPreview": {
        "totalTables": 12,
        "tables": [...]
      }
    }
  }
}
```

### Consulta IA Bem-sucedida
```json
{
  "data": {
    "executeAIQuery": {
      "id": "query-uuid",
      "naturalQuery": "Quantos usuários existem?",
      "generatedQuery": "SELECT COUNT(*) as total_users FROM users",
      "results": [
        {"data": {"total_users": 1547}}
      ],
      "executionTime": 234,
      "status": "SUCCESS",
      "error": null
    }
  }
}
```

## ⚠️ Troubleshooting

### Erro de Conexão
```json
{
  "success": false,
  "message": "Connection failed: Connection refused"
}
```
**Soluções:**
- Verificar host e porta
- Confirmar firewall liberado
- Validar credenciais

### Erro de Autenticação
```json
{
  "message": "Authentication required"
}
```
**Solução:** Execute novamente o login

### Query IA com Erro
```json
{
  "status": "ERROR",
  "error": "Query contains prohibited keyword: DROP"
}
```
**Causa:** Sistema de segurança bloqueou query perigosa

### Rate Limit
```json
{
  "error": "Too many AI queries from this IP"
}
```
**Solução:** Aguardar 1 minuto antes de nova tentativa

## 🔒 Boas Práticas de Segurança

1. **Use usuários readonly** para conexões de analytics
2. **Configure timeouts** adequados (30-60 segundos)
3. **Teste em ambiente dev** antes de produção
4. **Monitore logs** de conexão
5. **Rotacione senhas** regularmente
6. **Use VPN** para bancos internos

## 📈 Exemplos de Queries por Setor

### E-commerce
```
"Produtos mais vendidos esta semana"
"Carrinho abandonado por faixa de preço" 
"Receita por canal de vendas"
```

### Financeiro
```
"Contas a receber em atraso"
"Fluxo de caixa dos últimos 30 dias"
"Inadimplência por região"
```

### RH
```
"Funcionários contratados por mês"
"Taxa de turnover por departamento"
"Média salarial por cargo"
```

### Marketing
```
"ROI das campanhas do último trimestre"
"Taxa de conversão por fonte de tráfego"
"Engajamento por tipo de conteúdo"
```

---

💡 **Dica:** Comece sempre testando a conexão antes de criar consultas IA. Isso garante que o sistema consegue acessar seus dados corretamente.