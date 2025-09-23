# 🔧 SmartBI - Guia de Troubleshooting

## Problemas Comuns e Soluções

### 1. Erro: "Field 'description' is not defined"

**Problema**: GraphQL schema não possui o campo description.

**Solução**:
```typescript
// Já corrigido em data-query.schema.ts
type DataConnection {
  description: String  // ✅ Campo adicionado
}

input DataConnectionInput {
  description: String  // ✅ Campo adicionado
}
```

### 2. Erro: "Value 'FIREBASE' is not in enum ConnectionType"

**Problema**: Database enum não possui os novos tipos de conexão.

**Solução**: Execute no Supabase Dashboard:
```sql
-- Adicionar novos tipos ao enum
ALTER TYPE "ConnectionType" ADD VALUE 'FIREBASE';
ALTER TYPE "ConnectionType" ADD VALUE 'MONGODB';
-- Continue para outros tipos...
```

**Script completo**:
```sql
-- Verificar enum atual
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'ConnectionType'::regtype;

-- Adicionar todos os tipos em falta
DO $$
BEGIN
    -- Firebase
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'FIREBASE' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'FIREBASE';
    END IF;
    
    -- MongoDB
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MONGODB' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'MONGODB';
    END IF;
    
    -- Redis
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REDIS' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'REDIS';
    END IF;
    
    -- Elasticsearch
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ELASTICSEARCH' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'ELASTICSEARCH';
    END IF;
    
    -- Cassandra
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CASSANDRA' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'CASSANDRA';
    END IF;
    
    -- DynamoDB
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DYNAMODB' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'DYNAMODB';
    END IF;
    
    -- API REST
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'API_REST' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'API_REST';
    END IF;
    
    -- API GraphQL
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'API_GRAPHQL' AND enumtypid = 'ConnectionType'::regtype) THEN
        ALTER TYPE "ConnectionType" ADD VALUE 'API_GRAPHQL';
    END IF;
END $$;
```

### 3. Firebase: Erro 401 (Unauthorized)

**Problema**: Regras do Firestore ou autenticação inválida.

**Soluções**:

**Opção A - Regras permissivas (desenvolvimento):**
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // ⚠️ Apenas para desenvolvimento
    }
  }
}
```

**Opção B - Service Account (recomendado):**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Baixar arquivo JSON
4. Usar no código:
```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import serviceAccount from './firebase-service-account.json';

initializeApp({
  credential: cert(serviceAccount as any),
});
```

**Opção C - Access Token:**
```bash
# Gerar token com Firebase CLI
firebase login:ci

# Usar o token retornado na configuração
```

### 4. MongoDB: Connection String Invalid

**Problemas comuns**:
- Porta incorreta (padrão: 27017)
- Username/password com caracteres especiais
- Database não existe

**Soluções**:
```javascript
// Local
mongodb://localhost:27017/database_name

// Com autenticação
mongodb://username:password@localhost:27017/database_name

// MongoDB Atlas
mongodb+srv://user:password@cluster.mongodb.net/database_name

// Caracteres especiais no password - usar URL encoding
mongodb://user:p%40ssw0rd@localhost:27017/database  // p@ssw0rd
```

### 5. AI Query: Markdown formato retornado

**Problema**: AI retorna JSON em markdown em vez de JSON puro.

**Solução**: Atualizar prompts para forçar JSON puro:
```typescript
// ai-query.service.ts - Já corrigido
const prompt = `
Retorne APENAS JSON puro, sem markdown, sem backticks, sem formatação adicional.
Exemplo correto: {"query": "SELECT * FROM users"}
Exemplo INCORRETO: \`\`\`json\n{"query": "SELECT * FROM users"}\n\`\`\`
`;
```

### 6. Servidor não inicia

**Problemas comuns**:
```bash
# Porta já em uso
Error: listen EADDRINUSE :::4000

# Dependências não instaladas  
Cannot find module 'graphql'

# Variables de ambiente faltando
DATABASE_URL is not defined
```

**Soluções**:
```bash
# Verificar porta em uso
netstat -ano | findstr :4000  # Windows
lsof -i :4000                 # Linux/Mac

# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# Iniciar em porta diferente
PORT=4001 npm run dev
```

### 7. GraphQL Playground não carrega

**Problema**: GraphQL Playground não acessível.

**Verificações**:
1. Servidor rodando: `http://localhost:4000`
2. GraphQL endpoint: `http://localhost:4000/graphql`
3. Verificar logs do servidor
4. CORS configurado corretamente

### 8. Postman: Erro de autenticação

**Problema**: Requests falhando no Postman.

**Solução**:
1. Verificar Content-Type: `application/json`
2. Body raw JSON válido
3. URL correta: `http://localhost:4000/graphql`
4. Headers necessários configurados

### 9. Performance: Queries lentas

**Otimizações**:
```typescript
// Limit resultados
const query = `SELECT * FROM users LIMIT 100`;

// Índices no database
CREATE INDEX idx_user_email ON users(email);

// Timeout nas queries
const timeout = 30000; // 30 segundos
```

### 10. Database Connection Pool

**MySQL/PostgreSQL**:
```typescript
// config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 2,
    max: 10,
    idle: 10000,
    acquire: 30000,
  },
};
```

## Scripts de Diagnóstico

### Verificar status do servidor:
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:4000" -Method GET

# cURL
curl -I http://localhost:4000
```

### Testar GraphQL endpoint:
```powershell
# PowerShell
$body = '{"query": "{ __schema { types { name } } }"}'
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Body $body -ContentType "application/json"

# cURL  
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

### Verificar logs:
```bash
# Logs do servidor
npm run dev

# Logs detalhados
DEBUG=* npm run dev

# Logs do database
tail -f /var/log/postgresql/postgresql.log  # PostgreSQL
tail -f /var/log/mysql/mysql.log            # MySQL
```

## Contatos e Recursos

- **Documentação**: `testing/GUIA_COMPLETO_CONEXOES.md`
- **Postman Collection**: `testing/SmartBI-All-Connections.postman_collection.json`
- **Scripts de teste**: `testing/test-connections.ps1` e `testing/test-connections.sh`
- **Configuração**: `testing/config.example.env`

## Logs Úteis para Debug

### GraphQL Errors:
```javascript
// Habilitar logs detalhados
const server = new ApolloServer({
  typeDefs,
  resolvers,
  debug: true,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  },
});
```

### Database Queries:
```javascript
// Prisma query logs
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### AI Service:
```javascript
// Logs da API Gemini
console.log('Prompt enviado:', prompt);
console.log('Resposta recebida:', response);
```