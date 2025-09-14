# Guia de Conexão com Bancos Externos (Supabase/PostgreSQL)

## 🚀 Como Conectar SmartBI com Bancos de Dados Externos

O SmartBI foi desenvolvido para conectar com **qualquer banco de dados externo** que use PostgreSQL, incluindo projetos Supabase de terceiros. O sistema utiliza linguagem natural para gerar consultas SQL automaticamente.

### 📋 Pré-requisitos

1. **Credenciais do banco externo** (host, porta, usuário, senha)
2. **SmartBI Backend** funcionando
3. **Acesso de rede** ao banco externo
4. **Permissões de leitura** no banco de dados

## 🔗 Conectando com Bancos Externos

### Cenário 1: Cliente com Supabase Próprio

Se o cliente já tem um projeto Supabase, você precisa das credenciais:

**Como obter as credenciais do cliente:**
1. Cliente acessa seu dashboard Supabase
2. Vai em **Settings > Database**
3. Fornece os dados de conexão:

```
Host: db.projeto-do-cliente.supabase.co
Database: postgres
Port: 5432
User: postgres
Password: [senha definida pelo cliente]
```

### Cenário 2: PostgreSQL Tradicional

Para bancos PostgreSQL tradicionais:

```
Host: servidor-do-cliente.com
Database: nome_do_banco
Port: 5432 (ou customizada)
User: usuario_readonly
Password: senha_do_usuario
```

### Cenário 3: Bancos Cloud (AWS RDS, Google Cloud SQL, etc.)

```
Host: endpoint-rds.region.rds.amazonaws.com
Database: production_db
Port: 5432
User: smartbi_readonly
Password: senha_segura
```

## � Melhores Práticas de Segurança

### Recomendações para Produção

1. **Usuário Somente Leitura**
```sql
-- Execute no banco do cliente para criar usuário readonly
CREATE USER smartbi_readonly WITH PASSWORD 'senha_segura_readonly';
GRANT CONNECT ON DATABASE postgres TO smartbi_readonly;
GRANT USAGE ON SCHEMA public TO smartbi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO smartbi_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO smartbi_readonly;

-- Garantir acesso a futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO smartbi_readonly;
```

2. **Configurações de Firewall**
- Liberar apenas IP do servidor SmartBI
- Usar conexões SSL obrigatórias
- Configurar timeout adequado

3. **Monitoramento**
- Log de todas as consultas
- Alertas para consultas lentas
- Limite de conexões simultâneas

## 🧠 Testando Consultas em Linguagem Natural

### Exemplos Práticos por Tipo de Negócio

#### E-commerce
```
"Quais produtos mais vendidos este mês?"
"Receita total por categoria de produto"
"Clientes que compraram mais de R$ 1000"
"Produtos com estoque baixo"
```

#### SaaS/Assinaturas
```
"Usuários ativos nos últimos 30 dias"
"Taxa de conversão de trial para pago"
"Receita recorrente mensal (MRR)"
"Usuários que cancelaram assinatura"
```

#### Logística
```
"Entregas atrasadas por região"
"Tempo médio de entrega por transportadora"
"Pedidos pendentes de envio"
"Rotas mais utilizadas"
```

#### Financeiro
```
"Receitas vs despesas este trimestre"
"Fluxo de caixa dos últimos 6 meses"
"Clientes em atraso há mais de 30 dias"
"Contas a receber por vencimento"
```

### Como o Sistema Funciona

1. **Análise do Schema**: SmartBI primeiro analisa a estrutura do banco
2. **Processamento da Linguagem Natural**: IA interpreta a consulta
3. **Geração de SQL**: Cria query SQL otimizada
4. **Validação de Segurança**: Verifica se é consulta apenas de leitura
5. **Execução**: Executa no banco e retorna resultados

## 🔌 Testando a Conexão via Postman

### 1. Configurar Variáveis para Banco Externo

Configure essas variáveis no Postman com as credenciais **do cliente**:

```json
{
  "client_db_host": "db.projeto-do-cliente.supabase.co",
  "client_db_port": "5432",
  "client_db_database": "postgres",
  "client_db_username": "postgres",
  "client_db_password": "senha_do_cliente_123!"
}
```

### 2. Request para Descobrir Schema do Cliente

```json
{
  "query": "mutation TestConnection($input: DataConnectionInput!) { testConnection(input: $input) { success message latency schemaPreview { totalTables tables { name columns { name type } } } } }",
  "variables": {
    "input": {
      "name": "Banco do Cliente",
      "type": "POSTGRESQL",
      "config": {
        "host": "{{client_db_host}}",
        "port": 5432,
        "database": "{{client_db_database}}",
        "username": "{{client_db_username}}",
        "password": "{{client_db_password}}"
      }
    }
  }
}
```

### 3. Request para Conectar Permanentemente

```json
{
  "query": "mutation CreateDataConnection($input: DataConnectionInput!) { createDataConnection(input: $input) { id name type status config { host port database username hasPassword } isDefault createdAt } }",
  "variables": {
    "input": {
      "name": "Produção Cliente XYZ",
      "type": "POSTGRESQL",
      "config": {
        "host": "{{client_db_host}}",
        "port": 5432,
        "database": "{{client_db_database}}",
        "username": "{{client_db_username}}",
        "password": "{{client_db_password}}"
      },
      "isDefault": true
    }
  }
}
```

## 🧠 Testando Consultas com Dados Reais do Cliente

### Consultas Exploratórias (descobrir o que tem no banco)

```json
{
  "query": "mutation ExecuteAIQuery($input: AIQueryInput!) { executeAIQuery(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error } }",
  "variables": {
    "input": {
      "connectionId": "connection-id-do-cliente",
      "naturalQuery": "Quais tabelas existem neste banco de dados?"
    }
  }
}
```

### Consultas Adaptáveis (funcionam em qualquer schema)

```json
// Descobrir dados gerais
{
  "naturalQuery": "Mostre uma amostra de dados de cada tabela principal"
}

// Contagens básicas
{
  "naturalQuery": "Quantos registros existem em cada tabela?"
}

// Relacionamentos
{
  "naturalQuery": "Quais são os relacionamentos entre as tabelas?"
}

// Dados recentes
{
  "naturalQuery": "Mostre os registros mais recentes de cada tabela"
}
```

### Consultas Específicas por Negócio

**E-commerce:**
```json
{
  "naturalQuery": "Produtos mais vendidos nos últimos 30 dias"
},
{
  "naturalQuery": "Receita total por mês este ano"
},
{
  "naturalQuery": "Clientes que mais gastaram"
}
```

**SaaS:**
```json
{
  "naturalQuery": "Usuários ativos por plano de assinatura"
},
{
  "naturalQuery": "Taxa de retenção mensal"
},
{
  "naturalQuery": "Features mais utilizadas"
}
```

## 📊 Exemplos de Respostas Esperadas

### Teste de Conexão Bem-sucedido

```json
{
  "data": {
    "testConnection": {
      "success": true,
      "message": "PostgreSQL connection successful",
      "latency": 180,
      "schemaPreview": {
        "totalTables": 3,
        "tables": [
          {
            "name": "usuarios",
            "columns": [
              {"name": "id", "type": "integer"},
              {"name": "nome", "type": "character varying"},
              {"name": "email", "type": "character varying"}
            ]
          }
        ]
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
      "naturalQuery": "Quantos usuários estão cadastrados?",
      "generatedQuery": "SELECT COUNT(*) as total_usuarios FROM usuarios",
      "results": [
        {"data": {"total_usuarios": 4}}
      ],
      "executionTime": 145,
      "status": "SUCCESS",
      "error": null
    }
  }
}
```

## ⚠️ Troubleshooting

### Erro: Connection refused
```json
{
  "success": false,
  "message": "PostgreSQL connection failed: connect ECONNREFUSED"
}
```
**Solução:** Verificar se o host está correto e se o projeto está ativo no Supabase.

### Erro: Authentication failed
```json
{
  "success": false,
  "message": "PostgreSQL connection failed: password authentication failed"
}
```
**Solução:** Verificar se a senha está correta. Você pode resetar a senha em Settings > Database.

### Erro: SSL required
```json
{
  "success": false,
  "message": "PostgreSQL connection failed: SSL connection required"
}
```
**Solução:** O Supabase já tem SSL habilitado por padrão, mas se necessário, adicione `ssl: true` na configuração.

## 🔒 Configuração SSL (Se Necessário)

Se você encontrar problemas de SSL, vou ajustar o adapter PostgreSQL:

```typescript
// Configuração com SSL para Supabase
private createClient(config: DataConnectionConfig): Client {
  return new Client({
    host: config.host,
    port: config.port || 5432,
    user: config.username,
    password: config.password,
    database: config.database,
    ssl: config.host?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: this.timeout,
    query_timeout: this.timeout
  });
}
```

## 📈 Próximos Passos

1. **Teste a conexão** primeiro
2. **Crie dados de exemplo** usando os SQLs acima
3. **Execute consultas IA** simples primeiro
4. **Teste consultas complexas** conforme sua necessidade
5. **Configure em produção** quando estiver funcionando

## 💡 Dicas Importantes

- ✅ Use sempre a **região mais próxima** para menor latência
- ✅ Configure **RLS (Row Level Security)** para dados sensíveis
- ✅ Use **usuário readonly** para analytics em produção
- ✅ Monitore o **uso da quota** no plano gratuito
- ✅ Faça **backup** dos dados importantes

---

**Agora você pode testar o SmartBI com dados reais do Supabase! 🎉**