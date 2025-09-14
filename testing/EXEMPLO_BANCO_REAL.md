# Exemplo Prático: Conectando com Banco de Produção

## 🎯 Cenário Real de Uso

Imagine que você tem um cliente com um e-commerce que usa Supabase. Eles querem insights dos dados de vendas através de linguagem natural.

## 📋 Informações do Cliente

**Empresa:** TechStore Brasil  
**Banco:** Supabase PostgreSQL  
**Dados:** Vendas, Produtos, Clientes desde 2023  
**Objetivo:** Análises de vendas em tempo real  

## 🔗 Credenciais Fornecidas pelo Cliente

```
Host: db.abcd1234.supabase.co
Database: postgres
Port: 5432
User: postgres (ou usuario_readonly)
Password: TechStore@2024!
```

## 🚀 Passo a Passo de Implementação

### 1. Teste Inicial de Conectividade

```bash
# Postman Request: Test Connection
POST http://localhost:4000/graphql
Content-Type: application/json

{
  "query": "mutation TestConnection($input: DataConnectionInput!) { testConnection(input: $input) { success message latency schemaPreview { totalTables tables { name columns { name type nullable } } } } }",
  "variables": {
    "input": {
      "name": "TechStore Produção",
      "type": "POSTGRESQL",
      "config": {
        "host": "db.abcd1234.supabase.co",
        "port": 5432,
        "database": "postgres", 
        "username": "postgres",
        "password": "TechStore@2024!"
      }
    }
  }
}
```

### 2. Resposta Esperada (Schema Discovery)

```json
{
  "data": {
    "testConnection": {
      "success": true,
      "message": "PostgreSQL connection successful",
      "latency": 220,
      "schemaPreview": {
        "totalTables": 8,
        "tables": [
          {
            "name": "customers",
            "columns": [
              {"name": "id", "type": "integer", "nullable": false},
              {"name": "name", "type": "character varying", "nullable": false},
              {"name": "email", "type": "character varying", "nullable": false},
              {"name": "city", "type": "character varying", "nullable": true},
              {"name": "created_at", "type": "timestamp with time zone", "nullable": false}
            ]
          },
          {
            "name": "products",
            "columns": [
              {"name": "id", "type": "integer", "nullable": false},
              {"name": "name", "type": "character varying", "nullable": false},
              {"name": "price", "type": "numeric", "nullable": false},
              {"name": "category", "type": "character varying", "nullable": true},
              {"name": "stock", "type": "integer", "nullable": false}
            ]
          },
          {
            "name": "orders",
            "columns": [
              {"name": "id", "type": "integer", "nullable": false},
              {"name": "customer_id", "type": "integer", "nullable": false},
              {"name": "total_amount", "type": "numeric", "nullable": false},
              {"name": "status", "type": "character varying", "nullable": false},
              {"name": "created_at", "type": "timestamp with time zone", "nullable": false}
            ]
          },
          {
            "name": "order_items",
            "columns": [
              {"name": "id", "type": "integer", "nullable": false},
              {"name": "order_id", "type": "integer", "nullable": false},
              {"name": "product_id", "type": "integer", "nullable": false},
              {"name": "quantity", "type": "integer", "nullable": false},
              {"name": "unit_price", "type": "numeric", "nullable": false}
            ]
          }
        ]
      }
    }
  }
}
```

### 3. Criar Conexão Permanente

```json
{
  "query": "mutation CreateDataConnection($input: DataConnectionInput!) { createDataConnection(input: $input) { id name type status } }",
  "variables": {
    "input": {
      "name": "TechStore Production DB",
      "type": "POSTGRESQL", 
      "config": {
        "host": "db.abcd1234.supabase.co",
        "port": 5432,
        "database": "postgres",
        "username": "postgres",
        "password": "TechStore@2024!"
      },
      "isDefault": true
    }
  }
}
```

## 🧠 Consultas de Negócio em Linguagem Natural

### Análises Básicas

```json
// 1. Visão geral dos dados
{
  "naturalQuery": "Quantos clientes, produtos e pedidos temos no total?"
}

// Resposta esperada:
{
  "generatedQuery": "SELECT 'Clientes' as tipo, COUNT(*) as total FROM customers UNION ALL SELECT 'Produtos' as tipo, COUNT(*) as total FROM products UNION ALL SELECT 'Pedidos' as tipo, COUNT(*) as total FROM orders",
  "results": [
    {"tipo": "Clientes", "total": 1547},
    {"tipo": "Produtos", "total": 234},
    {"tipo": "Pedidos", "total": 3891}
  ]
}
```

```json
// 2. Performance de vendas
{
  "naturalQuery": "Qual foi a receita total dos últimos 30 dias?"
}

// Resposta esperada:
{
  "generatedQuery": "SELECT SUM(total_amount) as receita_30_dias FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'",
  "results": [
    {"receita_30_dias": 487650.75}
  ]
}
```

### Análises Avançadas

```json
// 3. Top produtos
{
  "naturalQuery": "Quais são os 5 produtos mais vendidos este mês, mostrando quantidade e receita?"
}

// Resposta esperada:
{
  "generatedQuery": "SELECT p.name as produto, SUM(oi.quantity) as quantidade_vendida, SUM(oi.quantity * oi.unit_price) as receita FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.created_at >= DATE_TRUNC('month', CURRENT_DATE) GROUP BY p.id, p.name ORDER BY quantidade_vendida DESC LIMIT 5",
  "results": [
    {"produto": "iPhone 15 Pro", "quantidade_vendida": 89, "receita": 267000.00},
    {"produto": "MacBook Air M2", "quantidade_vendida": 45, "receita": 202500.00},
    {"produto": "AirPods Pro", "quantidade_vendida": 156, "receita": 62400.00}
  ]
}
```

```json
// 4. Análise geográfica
{
  "naturalQuery": "Qual cidade teve mais vendas em valor nos últimos 3 meses?"
}

// Resposta esperada:
{
  "generatedQuery": "SELECT c.city as cidade, COUNT(o.id) as total_pedidos, SUM(o.total_amount) as receita_total FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.created_at >= CURRENT_DATE - INTERVAL '3 months' GROUP BY c.city ORDER BY receita_total DESC LIMIT 10",
  "results": [
    {"cidade": "São Paulo", "total_pedidos": 892, "receita_total": 1245870.50},
    {"cidade": "Rio de Janeiro", "total_pedidos": 567, "receita_total": 789456.25},
    {"cidade": "Belo Horizonte", "total_pedidos": 234, "receita_total": 345123.75}
  ]
}
```

### Análises de Comportamento

```json
// 5. Clientes VIP
{
  "naturalQuery": "Quem são os 10 clientes que mais gastaram este ano? Mostre nome, email e total gasto"
}

{
  "naturalQuery": "Quantos clientes fizeram apenas uma compra vs clientes recorrentes?"
}

{
  "naturalQuery": "Qual é o ticket médio por categoria de produto?"
}
```

### Análises Temporais

```json
// 6. Tendências sazonais
{
  "naturalQuery": "Compare as vendas mês a mês este ano vs ano passado"
}

{
  "naturalQuery": "Em que dia da semana vendemos mais?"
}

{
  "naturalQuery": "Qual horário do dia tem mais pedidos?"
}
```

## 📊 Exemplo de Sessão Completa de Análise

```json
// Sessão: Análise de Performance Q3 2024

// 1. Contextualização
{
  "naturalQuery": "Resumo geral: vendas, novos clientes e produtos mais vendidos no Q3 2024"
}

// 2. Comparação temporal  
{
  "naturalQuery": "Compare receita Q3 2024 vs Q3 2023, mostrando crescimento percentual"
}

// 3. Drill-down por categoria
{
  "naturalQuery": "Qual categoria de produto cresceu mais no Q3? Mostre variação percentual"
}

// 4. Análise de clientes
{
  "naturalQuery": "Quantos novos clientes adquirimos no Q3 e qual foi o ticket médio deles?"
}

// 5. Identificação de oportunidades
{
  "naturalQuery": "Produtos com estoque alto mas vendas baixas no Q3"
}

// 6. Previsão
{
  "naturalQuery": "Baseado no histórico, qual seria a projeção de vendas para Q4?"
}
```

## ⚡ Benefícios para o Cliente

1. **Agilidade**: Insights em segundos, não horas
2. **Democratização**: Qualquer pessoa pode fazer análises
3. **Tempo Real**: Dados sempre atualizados
4. **Segurança**: Apenas consultas de leitura
5. **Escalabilidade**: Funciona com bancos de qualquer tamanho

## 🔧 Troubleshooting Comum

### Erro: Timeout de Conexão
```json
{
  "success": false,
  "message": "PostgreSQL connection failed: timeout"
}
```
**Solução:** Verificar firewall e configurações de rede

### Erro: Permissão Negada
```json
{
  "success": false, 
  "message": "permission denied for table customers"
}
```
**Solução:** Cliente precisa dar permissões SELECT para as tabelas

### Erro: SSL Obrigatório
```json
{
  "success": false,
  "message": "SSL connection required"
}
```
**Solução:** Supabase tem SSL automático, verificar configuração

## 📈 Próximos Passos

1. ✅ **Teste de conectividade** com dados reais
2. ✅ **Explore o schema** para entender a estrutura  
3. ✅ **Execute consultas básicas** primeiro
4. ✅ **Avance para análises complexas** conforme necessidade
5. ✅ **Configure alertas** para consultas importantes
6. ✅ **Treine a equipe** do cliente nas consultas

---

**Agora o SmartBI está pronto para analisar qualquer banco PostgreSQL/Supabase em produção! 🚀**