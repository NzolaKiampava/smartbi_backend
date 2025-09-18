# Exemplo Prático - Como Remover Histórico de Consultas

## 🎯 Passo a Passo Completo

### Passo 1: Ver o que temos no histórico
```bash
# Execute este comando no PowerShell
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-query-history-all.json" -Raw) | ConvertTo-Json -Depth 5
```

**Resultado exemplo:**
```json
{
  "data": {
    "getAIQueryHistoryPublic": [
      {
        "id": "f8f92222-d388-4080-b835-46b1ff793c17",
        "naturalQuery": "mostra todos os posts",
        "status": "SUCCESS",
        "createdAt": "2025-09-14T21:23:38.068Z"
      },
      {
        "id": "a1b2c3d4-5678-90ab-cdef-123456789012", 
        "naturalQuery": "quantos usuários temos",
        "status": "ERROR",
        "createdAt": "2025-09-14T20:15:22.123Z"
      }
    ]
  }
}
```

### Passo 2: Escolher o que remover

#### Opção A: Remover uma consulta específica
1. Copie o ID que deseja remover (ex: `f8f92222-d388-4080-b835-46b1ff793c17`)
2. Edite o arquivo `test-delete-single-query.json`:
```json
{
  "query": "mutation DeleteSingleQuery($id: ID!) { deleteAIQueryPublic(id: $id) }",
  "variables": {
    "id": "f8f92222-d388-4080-b835-46b1ff793c17"
  }
}
```
3. Execute:
```bash
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-delete-single-query.json" -Raw)
```

#### Opção B: Remover várias consultas
1. Copie vários IDs
2. Edite o arquivo `test-delete-multiple-queries.json`:
```json
{
  "query": "mutation DeleteMultipleQueries($ids: [ID!]!) { deleteMultipleAIQueriesPublic(ids: $ids) { deletedCount errors } }",
  "variables": {
    "ids": [
      "f8f92222-d388-4080-b835-46b1ff793c17",
      "a1b2c3d4-5678-90ab-cdef-123456789012"
    ]
  }
}
```
3. Execute:
```bash
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-delete-multiple-queries.json" -Raw)
```

#### Opção C: Limpar tudo
```bash
# ⚠️ CUIDADO: Remove todo o histórico!
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-clear-all-history.json" -Raw)
```

### Passo 3: Verificar resultado
```bash
# Liste o histórico novamente para confirmar
Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-query-history-all.json" -Raw) | ConvertTo-Json -Depth 5
```

## 📋 Script Completo de Exemplo

```powershell
# 1. Ver histórico atual
Write-Host "=== HISTÓRICO ATUAL ===" -ForegroundColor Yellow
$current = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-query-history-all.json" -Raw)
$current.data.getAIQueryHistoryPublic | ForEach-Object { 
    Write-Host "ID: $($_.id)" -ForegroundColor Green
    Write-Host "Query: $($_.naturalQuery)" -ForegroundColor Cyan
    Write-Host "Status: $($_.status)" -ForegroundColor White
    Write-Host "---"
}

# 2. Remover uma consulta (substitua o ID)
Write-Host "=== REMOVENDO UMA CONSULTA ===" -ForegroundColor Yellow
$deleteOne = @{
    query = "mutation DeleteSingleQuery(`$id: ID!) { deleteAIQueryPublic(id: `$id) }"
    variables = @{
        id = "SEU_ID_AQUI"  # ⬅️ SUBSTITUA AQUI
    }
} | ConvertTo-Json
# $result = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body $deleteOne

# 3. Ver histórico após remoção
Write-Host "=== HISTÓRICO APÓS REMOÇÃO ===" -ForegroundColor Yellow
# $after = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body (Get-Content "test-query-history-all.json" -Raw)
# $after.data.getAIQueryHistoryPublic | ForEach-Object { Write-Host "$($_.id) - $($_.naturalQuery)" }
```

## 🎯 Casos de Uso Comuns

### Cenário 1: Remover consultas com erro
```bash
# 1. Liste e identifique as com status="ERROR"
# 2. Colete os IDs das consultas com erro
# 3. Use test-delete-multiple-queries.json com esses IDs
```

### Cenário 2: Limpar antes de demonstração
```bash
# Use test-clear-all-history.json para começar com histórico limpo
```

### Cenário 3: Remover consulta específica sensível
```bash
# Use test-delete-single-query.json com o ID da consulta sensível
```

---

**Lembre-se: Estas operações são irreversíveis! Use com cuidado. 🚨**