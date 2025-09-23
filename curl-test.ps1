# Simple curl equivalent for Windows PowerShell
# This script mimics the curl command you requested

Write-Host "GraphQL File Upload Test - Curl Style" -ForegroundColor Green

# Check if curl is available (Windows 10+ usually has curl.exe)
$curlAvailable = Get-Command curl.exe -ErrorAction SilentlyContinue

if ($curlAvailable) {
    Write-Host "Using curl.exe..." -ForegroundColor Cyan
    
    # Create sample file if needed
    $sampleFile = ".\testing\sample-data.csv"
    if (-not (Test-Path $sampleFile)) {
        Write-Host "Creating sample CSV file..." -ForegroundColor Yellow
        New-Item -Path ".\testing" -ItemType Directory -Force | Out-Null
        @"
Date,Product,Revenue,Quantity,Region
2024-01-15,Product A,1500.50,25,North
2024-01-16,Product B,2300.75,40,South
2024-01-17,Product C,1800.25,30,East
2024-01-18,Product A,2100.00,35,West
2024-01-19,Product B,1950.50,32,North
"@ | Out-File -FilePath $sampleFile -Encoding UTF8
    }
    
    # Get absolute path for curl
    $absolutePath = Resolve-Path $sampleFile
    
    Write-Host "Uploading file: $absolutePath" -ForegroundColor Yellow
    
    # Execute curl command (Windows version)
    $curlCommand = @"
curl.exe -X POST http://localhost:4000/graphql \
  -H "x-apollo-operation-name: UploadAndAnalyzeFile" \
  -F 'operations={
    \"query\": \"mutation UploadAndAnalyzeFile(\$input: FileUploadInput!) { uploadAndAnalyzeFile(input: \$input) { id title summary status insights { type title description confidence } fileInfo { originalName size mimeType } } }\",
    \"variables\": { \"input\": { \"file\": null, \"description\": \"Test upload via curl\" } }
  }' \
  -F 'map={ \"0\": [\"variables.input.file\"] }' \
  -F "0=@$absolutePath"
"@
    
    Write-Host "Executing curl command..." -ForegroundColor Cyan
    Invoke-Expression $curlCommand
    
} else {
    Write-Host "curl.exe not found. Use the main test-upload.ps1 script instead." -ForegroundColor Red
    Write-Host "Or install curl: winget install Git.Git" -ForegroundColor Yellow
}

Write-Host "`nAlternatively, run: .\test-upload.ps1 for a more detailed test" -ForegroundColor Green