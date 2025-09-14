# ✅ CREDENCIAIS SUPABASE CORRETAS IDENTIFICADAS

## 🔑 Dados Extraídos da Sua URL

**URL Supabase**: `https://yazvflcxyqdughavhthm.supabase.co`
**Project ID**: `yazvflcxyqdughavhthm`

## 📊 Credenciais PostgreSQL Corretas

```
Host: aws-0-us-west-1.pooler.supabase.com
Port: 5432
Database: postgres
User: postgres.yazvflcxyqdughavhthm
Password: [sua senha do projeto]
```

## ⚠️ Informação Faltante

Você tem todas as credenciais exceto a **senha do banco de dados**. No Supabase, você pode:

1. **Usar a senha que definiu** ao criar o projeto
2. **Resetar a senha** em Settings > Database
3. **Encontrar a senha** na seção "Database password"

## 🧪 Request de Teste Atualizado

```json
{
  "query": "mutation TestConnection($input: DataConnectionInput!) { testConnection(input: $input) { success message latency schemaPreview { totalTables tables { name columns { name type nullable } } } } }",
  "variables": {
    "input": {
      "name": "SmartBI Supabase Test",
      "type": "POSTGRESQL",
      "config": {
        "host": "aws-0-us-west-1.pooler.supabase.com",
        "port": 5432,
        "database": "postgres",
        "username": "postgres.yazvflcxyqdughavhthm",
        "password": "SUA_SENHA_AQUI"
      }
    }
  }
}
```

## 🔍 Como Encontrar Sua Senha

1. Acesse: `https://yazvflcxyqdughavhthm.supabase.co`
2. Vá em **Settings > Database**
3. Procure por **"Database password"** ou **"Connection string"**
4. Use a senha mostrada lá

## 📋 Formatos Alternativos (se não funcionar)

### Transaction Mode:
```
Host: aws-0-us-west-1.pooler.supabase.com
Port: 6543
User: postgres.yazvflcxyqdughavhthm
```

### Session Mode:
```
Host: aws-0-us-west-1.pooler.supabase.com  
Port: 5432
User: postgres.yazvflcxyqdughavhthm
```

---

**Você sabe qual é a senha do banco de dados do seu projeto Supabase? 🔐**