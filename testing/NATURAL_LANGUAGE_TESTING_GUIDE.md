# Guia de Testes - Consultas em Linguagem Natural 🤖

## Visão Geral
Este guia apresenta como testar o sistema de consultas em linguagem natural do SmartBI, que permite fazer perguntas em português e obter dados do banco de dados automaticamente.

## Pré-requisitos
- Servidor SmartBI rodando em `http://localhost:4000`
- Postman instalado
- Conexões de banco de dados cadastradas no sistema

## 1. Configuração do Postman

### Endpoint Base
```
POST http://localhost:4000/graphql
```

### Headers
```
Content-Type: application/json
```

## 2. Fluxo de Teste

### Passo 1: Listar Conexões Disponíveis

**Request:**
```json
{
  "query": "query GetConnections { getDataConnectionsPublic { id name type status isDefault createdAt } }"
}
```

**Resultado Esperado:**
- Lista de todas as conexões cadastradas
- Identifique o `id` da conexão que deseja usar

### Passo 2: Executar Consultas em Linguagem Natural

**Estrutura da Request:**
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "SEU_CONNECTION_ID_AQUI",
      "naturalQuery": "SUA_PERGUNTA_EM_PORTUGUÊS"
    }
  }
}
```

## 3. Exemplos de Consultas

### 3.1. Consultas Básicas

#### Listar Usuários
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Mostre os 5 primeiros usuários"
    }
  }
}
```

#### Contar Registros
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Quantos usuários temos no total?"
    }
  }
}
```

#### Buscar por Empresa
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Mostre todas as empresas cadastradas"
    }
  }
}
```

### 3.2. Consultas Mais Complexas

#### Filtrar por Status
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Mostre usuários ativos"
    }
  }
}
```

#### Buscar por Tipo
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Quais são as conexões do tipo SUPABASE?"
    }
  }
}
```

#### Dados Recentes
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Mostre os usuários criados hoje"
    }
  }
}
```

### 3.3. Consultas de Análise

#### Estatísticas
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Quantas empresas ativas temos?"
    }
  }
}
```

#### Agrupamento
```json
{
  "query": "mutation ExecuteNaturalQuery($input: AIQueryInput!) { executeAIQueryPublic(input: $input) { id naturalQuery generatedQuery results { data } executionTime status error createdAt } }",
  "variables": {
    "input": {
      "connectionId": "3343fdeb-1ced-42aa-8f40-a9821c8a6957",
      "naturalQuery": "Agrupe usuários por empresa"
    }
  }
}
```

## 4. Tipos de Resposta

### Resposta de Sucesso
```json
{
  "data": {
    "executeAIQueryPublic": {
      "id": "uuid-do-historico",
      "naturalQuery": "Sua pergunta original",
      "generatedQuery": "SELECT SQL GERADO PELA IA",
      "results": [
        {
          "data": {
            "coluna1": "valor1",
            "coluna2": "valor2"
          }
        }
      ],
      "executionTime": 2500,
      "status": "SUCCESS",
      "error": null,
      "createdAt": "2025-09-14T18:30:00.000Z"
    }
  }
}
```

### Resposta de Erro
```json
{
  "data": {
    "executeAIQueryPublic": {
      "id": "error",
      "naturalQuery": "Sua pergunta original",
      "generatedQuery": "",
      "results": [],
      "executionTime": 1000,
      "status": "ERROR",
      "error": "Descrição do erro",
      "createdAt": "2025-09-14T18:30:00.000Z"
    }
  }
}
```

## 5. Dicas e Boas Práticas

### ✅ Perguntas que Funcionam Bem
- "Mostre os 10 primeiros usuários"
- "Quantos registros temos na tabela X?"
- "Busque usuários com status ativo"
- "Liste todas as empresas"
- "Mostre dados da última semana"

### ❌ Perguntas que Podem Falhar
- Perguntas muito complexas com múltiplas JOINs
- Referências a tabelas que não existem
- Consultas que requerem conhecimento específico do negócio
- Perguntas ambíguas

### 💡 Dicas para Melhores Resultados
1. **Seja específico**: "Mostre os 5 usuários mais recentes" é melhor que "mostre alguns usuários"
2. **Use nomes de tabela conhecidos**: Baseie-se no schema do seu banco
3. **Inclua limites**: Para evitar resultados muito grandes
4. **Teste incrementalmente**: Comece com perguntas simples

## 6. Troubleshooting

### Erro 404
- Verifique se o servidor está rodando
- Confirme se a conexão está ativa
- Teste a conexão primeiro com `getDataConnectionsPublic`

### Status ERROR
- Verifique se a pergunta é clara
- Confirme se a tabela mencionada existe
- Revise o SQL gerado para identificar problemas

### Timeout
- Simplifique a consulta
- Adicione filtros ou limites
- Verifique a performance da conexão

## 7. Schema de Exemplo (Supabase)

Baseado nos testes realizados, as seguintes tabelas estão disponíveis:
- `users` (usuários do sistema)
- `companies` (empresas)
- `data_connections` (conexões de banco)
- `ai_query_history` (histórico de consultas)

## 8. Próximos Passos

Após dominar as consultas básicas, você pode:
1. Explorar outras conexões cadastradas
2. Testar com diferentes tipos de banco (MySQL, PostgreSQL, etc.)
3. Criar consultas mais complexas
4. Integrar com aplicações frontend

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Teste a conexão individualmente
3. Simplifique a pergunta
4. Consulte o histórico de consultas para ver padrões

**Importante**: Este sistema está em modo de desenvolvimento, por isso usa endpoints públicos. Em produção, será necessário autenticação adequada.