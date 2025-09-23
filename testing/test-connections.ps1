# Script PowerShell para testar conexões SmartBI
# Teste rápido dos principais tipos de conexão

param(
    [string]$BaseUrl = "http://localhost:4000",
    [switch]$TestAll,
    [string]$ConnectionType = ""
)

Write-Host "🔗 SmartBI - Teste de Conexões" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$graphqlUrl = "$BaseUrl/graphql"

# Função para fazer requisição GraphQL
function Invoke-GraphQLRequest {
    param($query, $name)
    
    Write-Host "🧪 Testando: $name" -ForegroundColor Yellow
    
    $body = @{ query = $query } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $graphqlUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        
        if ($response.data) {
            $connection = $response.data.createDataConnectionPublic
            Write-Host "✅ Sucesso: $($connection.name) (ID: $($connection.id))" -ForegroundColor Green
            Write-Host "   Tipo: $($connection.type) | Status: $($connection.status)" -ForegroundColor Gray
            return $connection.id
        } elseif ($response.errors) {
            Write-Host "❌ Erro GraphQL: $($response.errors[0].message)" -ForegroundColor Red
            if ($response.errors[0].message -like "*enum*") {
                Write-Host "   💡 Dica: Atualize o enum do banco com os novos tipos de conexão" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "❌ Erro de rede: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    return $null
}

# Função para testar query natural
function Test-NaturalQuery {
    param($connectionId, $query, $name)
    
    if (-not $connectionId) {
        Write-Host "⚠️ Pulando teste de query - conexão não criada" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🤖 Testando query natural: $name" -ForegroundColor Cyan
    
    $graphqlQuery = @"
mutation ExecuteQuery(`$input: AIQueryInput!) {
  executeAIQueryPublic(input: `$input) {
    naturalQuery
    generatedQuery
    status
    error
    executionTime
  }
}
"@
    
    $variables = @{
        input = @{
            connectionId = $connectionId
            naturalQuery = $query
        }
    }
    
    $body = @{
        query = $graphqlQuery
        variables = $variables
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $graphqlUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        
        if ($response.data.executeAIQueryPublic) {
            $result = $response.data.executeAIQueryPublic
            Write-Host "   Query gerada: $($result.generatedQuery)" -ForegroundColor Gray
            Write-Host "   Status: $($result.status) | Tempo: $($result.executionTime)ms" -ForegroundColor Gray
            
            if ($result.error) {
                Write-Host "   Erro: $($result.error)" -ForegroundColor Yellow
            } else {
                Write-Host "   ✅ Query executada com sucesso!" -ForegroundColor Green
            }
        }
    } catch {
        Write-Host "   ❌ Erro ao executar query: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Definir conexões para teste
$connections = @{
    "mysql" = @{
        name = "MySQL Local"
        query = 'mutation { createDataConnectionPublic(input: { type: MYSQL, name: "MySQL Local Test", description: "Teste MySQL", config: { host: "localhost", port: 3306, database: "test", username: "root", password: "password" } }) { id name type status } }'
        naturalQuery = "mostrar todas as tabelas"
    }
    "postgresql" = @{
        name = "PostgreSQL Local"
        query = 'mutation { createDataConnectionPublic(input: { type: POSTGRESQL, name: "PostgreSQL Local Test", description: "Teste PostgreSQL", config: { host: "localhost", port: 5432, database: "postgres", username: "postgres", password: "postgres" } }) { id name type status } }'
        naturalQuery = "listar todos os usuários"
    }
    "firebase" = @{
        name = "Firebase Firestore"
        query = 'mutation { createDataConnectionPublic(input: { type: FIREBASE, name: "Firebase Test", description: "Teste Firebase", config: { apiUrl: "kimakudi-db", apiKey: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8" } }) { id name type status } }'
        naturalQuery = "buscar 5 documentos da collection users"
    }
    "mongodb" = @{
        name = "MongoDB Local"
        query = 'mutation { createDataConnectionPublic(input: { type: MONGODB, name: "MongoDB Local Test", description: "Teste MongoDB", config: { connectionString: "mongodb://localhost:27017/test" } }) { id name type status } }'
        naturalQuery = "contar documentos na collection produtos"
    }
    "api" = @{
        name = "API REST"
        query = 'mutation { createDataConnectionPublic(input: { type: API_REST, name: "JSONPlaceholder API", description: "API de teste", config: { apiUrl: "https://jsonplaceholder.typicode.com" } }) { id name type status } }'
        naturalQuery = "listar todos os posts"
    }
    "supabase" = @{
        name = "Supabase"
        query = 'mutation { createDataConnectionPublic(input: { type: SUPABASE, name: "Supabase Test", description: "Teste Supabase", config: { apiUrl: "https://exemplo.supabase.co", apiKey: "sua-api-key-aqui" } }) { id name type status } }'
        naturalQuery = "buscar usuários ativos"
    }
}

# Verificar se servidor está rodando
Write-Host "📡 Verificando servidor..." -ForegroundColor Cyan
try {
    $serverCheck = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Servidor SmartBI está rodando em $BaseUrl" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor não está rodando em $BaseUrl" -ForegroundColor Red
    Write-Host "   Inicie o servidor com: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Executar testes
if ($TestAll) {
    Write-Host "🚀 Testando todas as conexões..." -ForegroundColor Green
    Write-Host ""
    
    foreach ($type in $connections.Keys) {
        $conn = $connections[$type]
        $connectionId = Invoke-GraphQLRequest -query $conn.query -name $conn.name
        Test-NaturalQuery -connectionId $connectionId -query $conn.naturalQuery -name $conn.name
        Start-Sleep 2
    }
} elseif ($ConnectionType -and $connections.ContainsKey($ConnectionType.ToLower())) {
    $conn = $connections[$ConnectionType.ToLower()]
    $connectionId = Invoke-GraphQLRequest -query $conn.query -name $conn.name
    Test-NaturalQuery -connectionId $connectionId -query $conn.naturalQuery -name $conn.name
} else {
    Write-Host "📋 Conexões disponíveis para teste:" -ForegroundColor Cyan
    foreach ($type in $connections.Keys) {
        Write-Host "   - $type : $($connections[$type].name)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 Uso:" -ForegroundColor Yellow
    Write-Host "   .\test-connections.ps1 -TestAll                    # Testa todas as conexões" -ForegroundColor Gray
    Write-Host "   .\test-connections.ps1 -ConnectionType firebase    # Testa apenas Firebase" -ForegroundColor Gray
    Write-Host "   .\test-connections.ps1 -ConnectionType mysql       # Testa apenas MySQL" -ForegroundColor Gray
    Write-Host ""
    
    # Testar apenas Firebase como exemplo
    Write-Host "🔥 Testando Firebase (exemplo)..." -ForegroundColor Green
    Write-Host ""
    $conn = $connections["firebase"]
    $connectionId = Invoke-GraphQLRequest -query $conn.query -name $conn.name
    Test-NaturalQuery -connectionId $connectionId -query $conn.naturalQuery -name $conn.name
}

Write-Host "🎉 Teste concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Para mais exemplos, consulte:" -ForegroundColor Cyan
Write-Host "   - testing/GUIA_COMPLETO_CONEXOES.md" -ForegroundColor Gray
Write-Host "   - testing/SmartBI-All-Connections.postman_collection.json" -ForegroundColor Gray