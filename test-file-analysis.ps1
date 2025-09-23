# Quick Test Script for SmartBI File Analysis System (PowerShell)
# Run this after starting the server with: npm run dev

Write-Host "🧪 Testing SmartBI File Analysis System..." -ForegroundColor Cyan
Write-Host ""

$BaseUrl = "http://localhost:4000/graphql"

# Test 1: Check if GraphQL endpoint is accessible
Write-Host "1. Testing GraphQL endpoint accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body '{"query":"query { __typename }"}' -ErrorAction Stop
    Write-Host "   ✅ GraphQL endpoint is accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GraphQL endpoint not accessible" -ForegroundColor Red
    Write-Host "   💡 Make sure the server is running: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check schema introspection
Write-Host ""
Write-Host "2. Checking file analysis schema..." -ForegroundColor Yellow
try {
    $schemaQuery = '{"query":"query { __type(name: \"FileUpload\") { name fields { name } } }"}'
    $schemaResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $schemaQuery
    
    if ($schemaResponse.data.__type.name -eq "FileUpload") {
        Write-Host "   ✅ FileUpload type is available in schema" -ForegroundColor Green
        $fields = $schemaResponse.data.__type.fields.name -join ", "
        Write-Host "   📋 Available fields: $fields" -ForegroundColor Cyan
    } else {
        Write-Host "   ❌ FileUpload type not found in schema" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking schema: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check Upload scalar
Write-Host ""
Write-Host "3. Checking Upload scalar availability..." -ForegroundColor Yellow
try {
    $uploadQuery = '{"query":"query { __type(name: \"Upload\") { name kind } }"}'
    $uploadResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $uploadQuery
    
    if ($uploadResponse.data.__type.name -eq "Upload") {
        Write-Host "   ✅ Upload scalar is available" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Upload scalar not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error checking Upload scalar: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check available mutations
Write-Host ""
Write-Host "4. Checking file upload mutations..." -ForegroundColor Yellow
try {
    $mutationQuery = '{"query":"query { __type(name: \"Mutation\") { fields { name } } }"}'
    $mutationResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $mutationQuery
    
    $uploadMutation = $mutationResponse.data.__type.fields | Where-Object { $_.name -eq "uploadAndAnalyzeFile" }
    
    if ($uploadMutation) {
        Write-Host "   ✅ uploadAndAnalyzeFile mutation is available" -ForegroundColor Green
    } else {
        Write-Host "   ❌ uploadAndAnalyzeFile mutation not found" -ForegroundColor Red
        $mutations = $mutationResponse.data.__type.fields.name -join ", "
        Write-Host "   📋 Available mutations: $mutations" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Error checking mutations: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Basic endpoint tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📖 For full file upload testing:" -ForegroundColor Cyan
Write-Host "   1. Import the Postman collection:" -ForegroundColor White
Write-Host "      testing/SmartBI-File-Analysis.postman_collection.json" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Or use PowerShell for file upload (requires auth token):" -ForegroundColor White
Write-Host @"
      `$headers = @{
          "Authorization" = "Bearer YOUR_TOKEN"
      }
      `$form = @{
          operations = '{"query":"mutation UploadFile(`$file: Upload!) { uploadAndAnalyzeFile(file: `$file) { id fileName status } }","variables":{"file":null}}'
          map = '{"0":["variables.file"]}'
          "0" = Get-Item "testing/sample_revenue_data.csv"
      }
      Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Form `$form -Headers `$headers
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "   3. Sample files for testing:" -ForegroundColor White
Write-Host "      • testing/sample_revenue_data.csv" -ForegroundColor Gray
Write-Host "      • testing/sample_sql_analysis.sql" -ForegroundColor Gray
Write-Host "      • testing/sample_financial_data.json" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Complete testing guide: POSTMAN_TESTING_GUIDE.md" -ForegroundColor Cyan