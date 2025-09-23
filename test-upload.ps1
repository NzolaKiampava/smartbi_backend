# PowerShell script to test file upload and analysis
# Windows equivalent of curl command for GraphQL file upload

Write-Host "Testing GraphQL File Upload and Analysis..." -ForegroundColor Green

# Check if sample file exists
$sampleFile = ".\testing\sample-data.csv"
if (-not (Test-Path $sampleFile)) {
    Write-Host "Sample file not found. Creating sample CSV..." -ForegroundColor Yellow
    
    # Create sample CSV if it doesn't exist
    $csvContent = @"
Date,Product,Revenue,Quantity,Region
2024-01-15,Product A,1500.50,25,North
2024-01-16,Product B,2300.75,40,South
2024-01-17,Product C,1800.25,30,East
2024-01-18,Product A,2100.00,35,West
2024-01-19,Product B,1950.50,32,North
2024-01-20,Product C,2450.25,45,South
2024-01-21,Product A,1750.75,28,East
2024-01-22,Product B,2200.00,38,West
2024-01-23,Product C,1650.50,27,North
2024-01-24,Product A,2350.25,42,South
"@
    
    New-Item -Path ".\testing" -ItemType Directory -Force | Out-Null
    $csvContent | Out-File -FilePath $sampleFile -Encoding UTF8
    Write-Host "Sample CSV created at: $sampleFile" -ForegroundColor Green
}

# Test 1: Basic GraphQL connectivity
Write-Host "`n1. Testing basic GraphQL connectivity..." -ForegroundColor Cyan
try {
    $basicTest = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -ContentType "application/json" -Body '{"query":"{ __typename }"}'
    Write-Host "✓ Server is responding: $($basicTest.__typename)" -ForegroundColor Green
} catch {
    Write-Host "✗ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: File upload using multipart/form-data
Write-Host "`n2. Testing file upload and analysis..." -ForegroundColor Cyan

$uri = "http://localhost:4000/graphql"
$filePath = Resolve-Path $sampleFile

# Prepare the multipart form data
$boundary = [System.Guid]::NewGuid().ToString()

# GraphQL operations JSON
$operations = @{
    query = "mutation UploadAndAnalyzeFile(`$input: FileUploadInput!) { uploadAndAnalyzeFile(input: `$input) { id title summary status createdAt insights { type title description confidence } fileInfo { originalName size mimeType } } }"
    variables = @{
        input = @{
            file = $null
            description = "Test upload of sample revenue data for analysis"
            analysisType = "COMPREHENSIVE"
        }
    }
} | ConvertTo-Json -Depth 10

# Map JSON
$map = @{
    "0" = @("variables.input.file")
} | ConvertTo-Json

# Read file content
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileName = [System.IO.Path]::GetFileName($filePath)

# Create multipart body
$bodyLines = @()
$bodyLines += "--$boundary"
$bodyLines += 'Content-Disposition: form-data; name="operations"'
$bodyLines += 'Content-Type: application/json'
$bodyLines += ''
$bodyLines += $operations
$bodyLines += "--$boundary"
$bodyLines += 'Content-Disposition: form-data; name="map"'
$bodyLines += 'Content-Type: application/json'
$bodyLines += ''
$bodyLines += $map
$bodyLines += "--$boundary"
$bodyLines += "Content-Disposition: form-data; name=`"0`"; filename=`"$fileName`""
$bodyLines += 'Content-Type: text/csv'
$bodyLines += ''

# Convert to byte array
$bodyText = $bodyLines -join "`r`n"
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyText)
$endBoundaryBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

# Combine all parts
$fullBody = New-Object System.Collections.Generic.List[byte]
$fullBody.AddRange($bodyBytes)
$fullBody.AddRange($fileBytes)
$fullBody.AddRange($endBoundaryBytes)

# Create the web request
$webRequest = [System.Net.HttpWebRequest]::Create($uri)
$webRequest.Method = "POST"
$webRequest.ContentType = "multipart/form-data; boundary=$boundary"
$webRequest.ContentLength = $fullBody.Count

try {
    # Write the body
    $requestStream = $webRequest.GetRequestStream()
    $requestStream.Write($fullBody.ToArray(), 0, $fullBody.Count)
    $requestStream.Close()

    # Get the response
    $response = $webRequest.GetResponse()
    $responseStream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($responseStream)
    $responseText = $reader.ReadToEnd()
    $reader.Close()
    $response.Close()

    Write-Host "✓ File uploaded successfully!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    
    # Parse and format JSON response
    $jsonResponse = $responseText | ConvertFrom-Json
    if ($jsonResponse.data -and $jsonResponse.data.uploadAndAnalyzeFile) {
        $report = $jsonResponse.data.uploadAndAnalyzeFile
        Write-Host "Report ID: $($report.id)" -ForegroundColor White
        Write-Host "Title: $($report.title)" -ForegroundColor White
        Write-Host "Status: $($report.status)" -ForegroundColor White
        Write-Host "Summary: $($report.summary)" -ForegroundColor White
        
        if ($report.insights -and $report.insights.Count -gt 0) {
            Write-Host "`nInsights:" -ForegroundColor Magenta
            foreach ($insight in $report.insights) {
                Write-Host "  - $($insight.title) (Confidence: $($insight.confidence)%)" -ForegroundColor Cyan
                Write-Host "    $($insight.description)" -ForegroundColor Gray
            }
        }
        
        if ($report.fileInfo) {
            Write-Host "`nFile Info:" -ForegroundColor Magenta
            Write-Host "  - Name: $($report.fileInfo.originalName)" -ForegroundColor Cyan
            Write-Host "  - Size: $($report.fileInfo.size) bytes" -ForegroundColor Cyan
            Write-Host "  - Type: $($report.fileInfo.mimeType)" -ForegroundColor Cyan
        }
    } else {
        Write-Host $responseText -ForegroundColor Red
    }

} catch {
    Write-Host "✗ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $errorReader.ReadToEnd()
        Write-Host "Error details: $errorText" -ForegroundColor Red
    }
}

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "If you want to test with your own file, replace the file path in the script." -ForegroundColor Yellow