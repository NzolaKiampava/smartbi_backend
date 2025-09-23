# PowerShell Terminal Testing Script for SmartBI File Analysis

Write-Host "🧪 Testing SmartBI File Analysis System from Terminal..." -ForegroundColor Cyan
Write-Host ""

$BaseUrl = "http://localhost:4000/graphql"

# Function to check if server is running
function Test-Server {
    Write-Host "1. Checking if server is running..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body '{"query":"query { __typename }"}' -ErrorAction Stop
        Write-Host "   ✅ Server is running and accessible" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "   ❌ Server not accessible: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   💡 Start the server with: npm run dev" -ForegroundColor Blue
        return $false
    }
}

# Function to test GraphQL schema
function Test-Schema {
    Write-Host "`n2. Testing GraphQL schema..." -ForegroundColor Yellow
    
    try {
        # Test FileUpload type
        $schemaQuery = '{"query":"query { __type(name: \"FileUpload\") { name fields { name type { name } } } }"}'
        $schemaResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $schemaQuery
        
        if ($schemaResponse.data.__type.name -eq "FileUpload") {
            Write-Host "   ✅ FileUpload type available" -ForegroundColor Green
            
            $fields = $schemaResponse.data.__type.fields.name -join ", "
            if ($fields) {
                Write-Host "   📋 Fields: $fields" -ForegroundColor Blue
            }
        } else {
            Write-Host "   ❌ FileUpload type not found" -ForegroundColor Red
        }

        # Test Upload scalar
        $uploadQuery = '{"query":"query { __type(name: \"Upload\") { name kind } }"}'
        $uploadResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $uploadQuery
        
        if ($uploadResponse.data.__type.name -eq "Upload") {
            Write-Host "   ✅ Upload scalar available" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Upload scalar not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Error testing schema: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to test file upload mutation structure
function Test-Mutation {
    Write-Host "`n3. Testing upload mutation structure..." -ForegroundColor Yellow
    
    try {
        $mutationQuery = '{"query":"query { __type(name: \"Mutation\") { fields { name args { name type { name kind } } } } }"}'
        $mutationResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $mutationQuery
        
        $uploadMutation = $mutationResponse.data.__type.fields | Where-Object { $_.name -eq "uploadAndAnalyzeFile" }
        
        if ($uploadMutation) {
            Write-Host "   ✅ uploadAndAnalyzeFile mutation available" -ForegroundColor Green
            
            $args = $uploadMutation.args.name -join ", "
            if ($args) {
                Write-Host "   📋 Arguments: $args" -ForegroundColor Blue
            }
        } else {
            Write-Host "   ❌ uploadAndAnalyzeFile mutation not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Error testing mutations: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to create test file and attempt upload
function Test-FileUpload {
    Write-Host "`n4. Testing file upload (without auth)..." -ForegroundColor Yellow
    Write-Host "   Note: This will fail without authentication token" -ForegroundColor Blue
    
    # Create a simple test CSV file
    $testCsv = "test_data.csv"
    $csvContent = @"
Date,Product,Revenue
2024-01-01,Product A,1000
2024-01-02,Product B,1500
"@
    $csvContent | Out-File -FilePath $testCsv -Encoding UTF8
    
    try {
        # Prepare multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        
        $operations = '{"query":"mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary } }","variables":{"input":{"file":null,"description":"Test"}}}'
        $map = '{"0":["variables.input.file"]}'
        
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"operations`"",
            "",
            $operations,
            "--$boundary",
            "Content-Disposition: form-data; name=`"map`"",
            "",
            $map,
            "--$boundary",
            "Content-Disposition: form-data; name=`"0`"; filename=`"test_data.csv`"",
            "Content-Type: text/csv",
            "",
            $csvContent,
            "--$boundary--"
        )
        
        $body = $bodyLines -join $LF
        
        $headers = @{
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        }
        
        $response = Invoke-RestMethod -Uri $BaseUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
        
        Write-Host "   ✅ Upload successful!" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Blue
        
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -match "Authentication|Unauthorized|token") {
            Write-Host "   ⚠️  Upload endpoint reachable (needs authentication)" -ForegroundColor Yellow
            Write-Host "   💡 This is expected - authentication required for uploads" -ForegroundColor Blue
        } else {
            Write-Host "   ❌ Upload failed: $errorMessage" -ForegroundColor Red
        }
    } finally {
        # Clean up test file
        if (Test-Path $testCsv) {
            Remove-Item $testCsv -Force
        }
    }
}

# Function to show available queries
function Show-AvailableQueries {
    Write-Host "`n5. Available Queries and Mutations:" -ForegroundColor Yellow
    
    try {
        $schemaQuery = '{"query":"query { __schema { queryType { fields { name description } } mutationType { fields { name description } } } }"}'
        $schemaResponse = Invoke-RestMethod -Uri $BaseUrl -Method POST -ContentType "application/json" -Body $schemaQuery
        
        Write-Host "`n📋 Available Queries:" -ForegroundColor Blue
        $queries = $schemaResponse.data.__schema.queryType.fields | Where-Object { $_.name -match "(file|upload|analysis|report)" }
        if ($queries) {
            $queries | ForEach-Object { Write-Host "   • $($_.name)" -ForegroundColor Gray }
        } else {
            Write-Host "   No file-related queries found" -ForegroundColor Gray
        }
        
        Write-Host "`n📋 Available Mutations:" -ForegroundColor Blue
        $mutations = $schemaResponse.data.__schema.mutationType.fields | Where-Object { $_.name -match "(file|upload|analysis|report)" }
        if ($mutations) {
            $mutations | ForEach-Object { Write-Host "   • $($_.name)" -ForegroundColor Gray }
        } else {
            Write-Host "   No file-related mutations found" -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ❌ Error retrieving schema: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Function to show PowerShell examples
function Show-PowerShellExamples {
    Write-Host "`n6. PowerShell Examples for Testing:" -ForegroundColor Yellow
    
    Write-Host "`n🔹 Test server connection:" -ForegroundColor Blue
    Write-Host @'
$response = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body '{"query":"query { __typename }"}'
'@ -ForegroundColor Gray
    
    Write-Host "`n🔹 Upload file (with auth token):" -ForegroundColor Blue
    Write-Host @'
$headers = @{ "Authorization" = "Bearer YOUR_TOKEN_HERE" }
$form = @{
    operations = '{"query":"mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary } }","variables":{"input":{"file":null,"description":"Test upload"}}}'
    map = '{"0":["variables.input.file"]}'
    "0" = Get-Item "testing/sample_revenue_data.csv"
}
$response = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Form $form -Headers $headers
'@ -ForegroundColor Gray

    Write-Host "`n🔹 Get analysis report:" -ForegroundColor Blue
    Write-Host @'
$headers = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN_HERE" 
}
$body = '{"query":"query GetAnalysisReport($reportId: ID!) { getAnalysisReport(reportId: $reportId) { id title summary insights { type title confidence } } }","variables":{"reportId":"REPORT_ID_HERE"}}'
$response = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Headers $headers -Body $body
'@ -ForegroundColor Gray
}

# Main execution
function Main {
    if (Test-Server) {
        Test-Schema
        Test-Mutation
        Test-FileUpload
        Show-AvailableQueries
    }
    
    Show-PowerShellExamples
    
    Write-Host "`n🎯 Terminal testing completed!" -ForegroundColor Green
    Write-Host "`n📖 Next steps:" -ForegroundColor Blue
    Write-Host "   1. Get authentication token first" -ForegroundColor White
    Write-Host "   2. Use the PowerShell examples above with your token" -ForegroundColor White
    Write-Host "   3. Test with sample files in testing/ directory" -ForegroundColor White
    Write-Host "   4. Check POSTMAN_TESTING_GUIDE.md for detailed examples" -ForegroundColor White
}

# Run main function
Main