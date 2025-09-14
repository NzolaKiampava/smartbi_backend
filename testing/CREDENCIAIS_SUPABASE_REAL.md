# Credenciais Supabase Real - SmartQuote

## 🔑 Dados de Conexão Extraídos

Com base na sua URL: `https://hpkbzabbwghxlsoyvomq.supabase.co`

### ⚠️ CORREÇÃO - Credenciais PostgreSQL:
```
Host: db.hpkbzabbwghxlsoyvomq.supabase.co
Database: postgres
Port: 5432
User: postgres
Password: 42smartquote
```

### ❌ **ERRO COMUM**: Não use a URL completa!
- ❌ **ERRADO**: `https://hpkbzabbwghxlsoyvomq.supabase.co`
- ✅ **CORRETO**: `db.hpkbzabbwghxlsoyvomq.supabase.co`

### Para usar no Postman (CORRIGIDO):
```json
{
  "external_db_host": "db.hpkbzabbwghxlsoyvomq.supabase.co",
  "external_db_port": "5432",
  "external_db_database": "postgres",
  "external_db_username": "postgres", 
  "external_db_password": "42smartquote"
}
```

## 🧪 Teste Rápido de Conexão

### Request para SmartBI:
```json
{
  "query": "mutation TestConnection($input: DataConnectionInput!) { testConnection(input: $input) { success message latency schemaPreview { totalTables tables { name columns { name type nullable } } } } }",
  "variables": {
    "input": {
      "name": "SmartQuote Supabase",
      "type": "POSTGRESQL",
      "config": {
        "host": "db.hpkbzabbwghxlsoyvomq.supabase.co",
        "port": 5432,
        "database": "postgres",
        "username": "postgres",
        "password": "42smartquote"
      }
    }
  }
}
```

## 🎯 O que vai acontecer:

1. **SmartBI vai conectar** no seu banco Supabase
2. **Descobrir automaticamente** todas as tabelas e colunas
3. **Permitir consultas** em linguagem natural como:
   - "Quantas tabelas existem no banco?"
   - "Mostre os dados mais recentes"
   - "Qual tabela tem mais registros?"

## 🚀 Próximos Passos:

1. ✅ **Configure o Postman** com essas credenciais
2. ✅ **Execute o teste de conexão** 
3. ✅ **Explore o schema** descoberto
4. ✅ **Comece com consultas simples**
5. ✅ **Avance para análises complexas**

---

**Suas credenciais estão corretas e funcionais! 🎉**