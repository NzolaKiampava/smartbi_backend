# SmartBI - Sistema de Consulta IA Multi-empresarial

## Visão Geral

O SmartBI é um sistema de Business Intelligence que permite às empresas conectar diferentes fontes de dados (bancos de dados, APIs) e fazer consultas usando linguagem natural através da IA do Google Gemini. O sistema traduz prompts em linguagem natural para consultas SQL ou chamadas de API, executa as consultas e retorna os resultados formatados.

## Arquitetura do Sistema

### Componentes Principais

1. **GraphQL API** - Interface principal para interações do frontend
2. **Serviço de IA (Gemini)** - Tradução de linguagem natural para consultas
3. **Adaptadores de Conexão** - Suporte para diferentes tipos de fonte de dados
4. **Sistema de Autenticação** - Gestão de usuários e empresas
5. **Middleware de Segurança** - Rate limiting e validações

### Fluxo de Funcionamento

```
Cliente → GraphQL → Middleware → Serviço IA → Adaptador → Fonte de Dados → Resultado
```

## Funcionalidades Implementadas

### 🔗 Gestão de Conexões de Dados

- **Criação de conexões**: Configurar conexões para MySQL, PostgreSQL, APIs REST
- **Teste de conexões**: Validar conectividade e obter preview do schema
- **Gerenciamento**: CRUD completo de conexões por empresa
- **Segurança**: Criptografia de credenciais sensíveis

#### Tipos de Conexão Suportados:
- **MySQL**: Host, porta, banco, usuário, senha
- **PostgreSQL**: Host, porta, banco, usuário, senha  
- **API REST**: URL base, chaves de API, headers customizados
- **API GraphQL**: (estrutura preparada para implementação futura)

### 🤖 Consultas com IA

- **Processamento NLP**: Tradução de linguagem natural usando Gemini API
- **Execução segura**: Sanitização e validação de consultas
- **Histórico**: Armazenamento de todas as consultas e resultados
- **Multi-empresa**: Isolamento de dados por empresa

#### Exemplos de Consultas:
```
"Quantos usuários foram cadastrados nos últimos 30 dias?"
"Mostre as vendas por categoria do mês passado"
"Quais são os produtos mais vendidos?"
"Lista de clientes inativos"
```

### 🛡️ Segurança

- **Rate Limiting**: 10 consultas IA por minuto por usuário
- **Validação de entrada**: Sanitização de prompts e configurações
- **Controle de permissões**: Diferentes níveis de acesso por role
- **SQL Injection Protection**: Detecção e bloqueio de padrões maliciosos
- **Auditoria**: Log completo de todas as consultas

### 👥 Sistema Multi-empresarial

- **Isolamento**: Row Level Security (RLS) no PostgreSQL
- **Configurações independentes**: Cada empresa tem suas próprias conexões
- **Limites por plano**: Free, Basic, Professional, Enterprise

## Estrutura do Banco de Dados

### Tabelas Principais

```sql
-- Conexões de dados por empresa
data_connections (
  id, company_id, name, type, status, config, is_default, 
  created_at, updated_at, last_tested_at
)

-- Histórico de consultas IA
ai_query_history (
  id, company_id, connection_id, user_id, natural_query, 
  generated_query, results, execution_time, status, error_message, 
  created_at
)
```

### Enums Utilizados

```sql
-- Tipos de conexão
connection_type: MYSQL, POSTGRESQL, API_REST, API_GRAPHQL

-- Status da conexão  
connection_status: ACTIVE, INACTIVE, ERROR

-- Status da consulta
query_status: SUCCESS, ERROR, TIMEOUT
```

## API GraphQL

### Principais Queries

```graphql
# Listar conexões da empresa
getDataConnections: [DataConnection!]!

# Obter informações do schema de uma conexão
getSchemaInfo(connectionId: ID!): SchemaInfo!

# Histórico de consultas IA
getAIQueryHistory: [AIQueryResult!]!
```

### Principais Mutations

```graphql
# Criar nova conexão
createDataConnection(input: DataConnectionInput!): DataConnection!

# Executar consulta com IA
executeAIQuery(input: AIQueryInput!): AIQueryResult!

# Testar conexão
testConnection(input: DataConnectionInput!): ConnectionTestResult!
```

## Configuração e Deploy

### Pré-requisitos

1. **Node.js** 18+ 
2. **PostgreSQL** (Supabase recomendado)
3. **Chave da API do Google Gemini**

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# IA
GEMINI_API_KEY=your_gemini_key

# Segurança
JWT_SECRET=your_jwt_secret
```

### Scripts de Deploy

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

### Migração do Banco

```bash
# Execute o arquivo de migração
psql -d your_database -f database/migration.sql
```

## Segurança em Produção

### Checklist de Segurança

- [ ] Rate limiting configurado
- [ ] HTTPS obrigatório
- [ ] Validação de entrada ativa
- [ ] Logs de auditoria habilitados
- [ ] Backup automático do banco
- [ ] Rotação de chaves de API
- [ ] Monitoramento de anomalias

### Limites Recomendados

```
Free Tier: 50 consultas IA/dia, 2 conexões
Basic Tier: 500 consultas IA/dia, 10 conexões  
Professional: 2000 consultas IA/dia, 50 conexões
Enterprise: Ilimitado
```

## Monitoramento

### Métricas Importantes

- Número de consultas IA por empresa/usuário
- Tempo de resposta das consultas
- Taxa de erro das conexões
- Uso de API do Gemini
- Status das conexões de dados

### Logs de Auditoria

Todas as consultas IA são logadas com:
- Usuário e empresa
- Query natural e SQL gerado
- Tempo de execução
- Resultados (se habilitado)
- Erros e exceções

## Extensibilidade

### Novos Adaptadores

O sistema foi projetado para facilmente suportar novos tipos de conexão:

1. Implementar interface `DatabaseAdapter`
2. Adicionar ao `AdapterFactory`
3. Atualizar enums no schema
4. Adicionar validações específicas

### Provedores de IA

Atualmente usa Gemini, mas pode ser estendido para:
- OpenAI GPT
- Claude (Anthropic)
- Azure OpenAI
- Modelos locais

## Roadmap

### Próximas Funcionalidades

- [ ] Suporte a MongoDB e Redis
- [ ] Dashboard de métricas em tempo real
- [ ] Agendamento de consultas
- [ ] Alertas automáticos
- [ ] Exportação de dados (PDF, Excel)
- [ ] Cache inteligente de resultados
- [ ] Suporte a consultas em lote
- [ ] Interface visual para criação de queries

### Melhorias de Performance

- [ ] Pool de conexões otimizado
- [ ] Cache Redis para consultas frequentes
- [ ] Compressão de resultados grandes
- [ ] Paginação automática
- [ ] Índices otimizados no banco

## Troubleshooting

### Problemas Comuns

**Conexão com banco falha**
- Verificar credenciais e firewall
- Testar conectividade de rede
- Validar formato da connection string

**API Gemini retorna erro**
- Verificar chave de API válida
- Confirmar limites de quota
- Checar formato do prompt

**Rate limit atingido**
- Aguardar reset do limite
- Aumentar limites se necessário
- Otimizar frequência de consultas

**Consulta SQL inválida**
- Revisar schema da base de dados
- Melhorar prompt em linguagem natural
- Verificar permissões de acesso

## Contribuição

### Estrutura do Código

```
src/
├── schema/          # GraphQL schemas
├── resolvers/       # GraphQL resolvers  
├── services/        # Lógica de negócio
├── middleware/      # Middlewares de segurança
├── types/           # Definições de tipos
└── utils/           # Utilitários gerais
```

### Padrões de Código

- TypeScript obrigatório
- ESLint + Prettier configurados
- Testes unitários com Jest
- Documentação inline obrigatória
- Commits seguindo padrão conventional

---

**Desenvolvido com foco em segurança, escalabilidade e facilidade de uso.**