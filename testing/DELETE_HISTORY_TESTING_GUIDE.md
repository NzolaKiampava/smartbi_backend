# Guia de Testes - Remoção de Histórico de Consultas 🗑️

## Visão Geral
Este guia apresenta como testar a remoção do histórico de consultas AI no SmartBI. Você pode remover uma consulta, múltiplas consultas ou limpar todo o histórico.

## ⚠️ ATENÇÃO
**Estas operações são IRREVERSÍVEIS!** Uma vez removidas, as consultas não podem ser recuperadas.
Use com cuidado, especialmente o comando de limpar todo o histórico.

## 🧪 Testes Disponíveis

### 1. Remover Uma Consulta Específica

**Arquivo**: `test-delete-single-query.json`

**Como usar:**
1. Primeiro, liste o histórico para obter um ID:
   ```bash
   # Use: test-query-history-all.json
   ```
2. Copie o ID de uma consulta que deseja remover
3. Substitua `"SUBSTITUA_PELO_ID_DA_CONSULTA"` pelo ID real
4. Execute o teste

**Exemplo:**
```json
{
  "query": "mutation DeleteSingleQuery($id: ID!) { deleteAIQueryPublic(id: $id) }",
  "variables": {
    "id": "f8f92222-d388-4080-b835-46b1ff793c17"
  }
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "deleteAIQueryPublic": true
  }
}
```

### 2. Remover Múltiplas Consultas

**Arquivo**: `test-delete-multiple-queries.json`

**Como usar:**
1. Liste o histórico para obter vários IDs
2. Substitua os IDs no array `ids`
3. Pode remover de 2 até 50+ consultas de uma vez
4. Execute o teste

**Exemplo:**
```json
{
  "query": "mutation DeleteMultipleQueries($ids: [ID!]!) { deleteMultipleAIQueriesPublic(ids: $ids) { deletedCount errors } }",
  "variables": {
    "ids": [
      "f8f92222-d388-4080-b835-46b1ff793c17",
      "a1b2c3d4-5678-90ab-cdef-123456789012",
      "9876abcd-ef01-2345-6789-abcdef012345"
    ]
  }
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "deleteMultipleAIQueriesPublic": {
      "deletedCount": 3,
      "errors": []
    }
  }
}
```

### 3. Limpar Todo o Histórico

**Arquivo**: `test-clear-all-history.json`

**⚠️ CUIDADO: Remove TODAS as consultas do histórico!**

**Como usar:**
1. Execute diretamente - não precisa de parâmetros
2. Confirme que realmente deseja remover tudo

**Exemplo:**
```json
{
  "query": "mutation ClearAllHistory { clearAIQueryHistoryPublic { deletedCount message } }"
}
```

**Resposta Esperada:**
```json
{
  "data": {
    "clearAIQueryHistoryPublic": {
      "deletedCount": 15,
      "message": "Successfully deleted 15 queries from history"
    }
  }
}
```

## 📋 Fluxo de Teste Recomendado

### Cenário 1: Remover Consulta Específica
1. **Listar histórico**: `test-query-history-all.json`
2. **Escolher uma consulta** para remover
3. **Copiar o ID** da consulta
4. **Remover**: `test-delete-single-query.json` (com o ID)
5. **Verificar**: Listar histórico novamente para confirmar

### Cenário 2: Limpeza Seletiva  
1. **Listar histórico**: `test-query-history-all.json`
2. **Selecionar várias consultas** (ex: as mais antigas)
3. **Remover múltiplas**: `test-delete-multiple-queries.json`
4. **Verificar resultado**: Checar `deletedCount` e `errors`

### Cenário 3: Reset Completo
1. **Verificar total**: `test-query-history-all.json`
2. **Backup** (se necessário - copiar dados importantes)
3. **Limpar tudo**: `test-clear-all-history.json`
4. **Confirmar vazio**: Listar histórico deve retornar array vazio

## 🛡️ Validações e Erros

### Erros Comuns

**ID não encontrado:**
```json
{
  "data": {
    "deleteAIQueryPublic": false
  }
}
```

**IDs inválidos em lote:**
```json
{
  "data": {
    "deleteMultipleAIQueriesPublic": {
      "deletedCount": 2,
      "errors": ["ID não encontrado: xyz123"]
    }
  }
}
```

**Histórico já vazio:**
```json
{
  "data": {
    "clearAIQueryHistoryPublic": {
      "deletedCount": 0,
      "message": "Successfully deleted 0 queries from history"
    }
  }
}
```

## 🔧 Comandos PowerShell para Teste

### Remover uma consulta:
```powershell
# 1. Primeiro, obter IDs disponíveis
$history = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-query-history-all.json" -Raw)
$history.data.getAIQueryHistoryPublic | Select-Object id, naturalQuery, createdAt

# 2. Escolher um ID e remover
# Editar test-delete-single-query.json com o ID
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-delete-single-query.json" -Raw)
```

### Limpar tudo:
```powershell
# CUIDADO: Remove todo o histórico!
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-clear-all-history.json" -Raw)
```

## 📊 Monitoramento

### Antes de remover:
```bash
# Contar total de consultas
GET /graphql -> getAIQueryHistoryPublic -> length
```

### Depois de remover:
```bash
# Verificar o que sobrou
GET /graphql -> getAIQueryHistoryPublic -> verificar ids restantes
```

## 🎯 Casos de Uso Práticos

### 1. **Limpeza de Desenvolvimento**
```bash
# Remover consultas de teste para começar limpo
test-clear-all-history.json
```

### 2. **Remoção de Consultas com Erro**
```bash
# Listar -> filtrar status="ERROR" -> remover só essas
test-delete-multiple-queries.json
```

### 3. **Manter Apenas Recentes**
```bash
# Listar -> pegar IDs antigos -> remover em lote
test-delete-multiple-queries.json
```

### 4. **Remoção de Consulta Sensível**
```bash
# Remover consulta específica que contém dados sensíveis
test-delete-single-query.json
```

## ⚡ Dicas Pro

1. **Sempre liste antes**: Para ver o que você tem antes de remover
2. **IDs únicos**: Cada consulta tem um UUID único - use-o corretamente
3. **Batch removal**: Para muitas consultas, use remoção múltipla (mais eficiente)
4. **Verificação**: Sempre confirme após remoção listando novamente
5. **Backup**: Em produção, considere backup antes de limpezas grandes

---

## 🚨 Lembretes Importantes

- ❌ **NÃO há confirmação adicional** - a remoção é imediata
- ❌ **NÃO há recuperação** - dados removidos são perdidos permanentemente  
- ✅ **Modo desenvolvimento**: Estes endpoints só funcionam em dev mode
- ✅ **Isolamento**: Só afeta a empresa Demo nos testes

**Use com responsabilidade! 🎯**