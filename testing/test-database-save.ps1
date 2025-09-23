# PowerShell script to test database save functionality
# Test database save functionality for Firebase connections

Write-Host "🔥 Testing Firebase Database Save" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# First check if server is running
Write-Host "📡 Checking if server is running..." -ForegroundColor Cyan

try {
    $serverCheck = Invoke-WebRequest -Uri "http://localhost:4000/graphql" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not running on http://localhost:4000" -ForegroundColor Red
    Write-Host "Please start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: Create Firebase Connection
Write-Host "🧪 Test 1: Creating Firebase connection..." -ForegroundColor Cyan

$body1 = @{
    query = 'mutation CreateFirebaseConnection { createDataConnectionPublic(input: { type: FIREBASE, name: "Test Firebase Save", description: "Testing database save", config: { apiUrl: "kimakudi-db", apiKey: "AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8" } }) { id name type status description config { apiUrl } createdAt } }'
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Body $body1 -ContentType "application/json"
    
    Write-Host "Response:" -ForegroundColor Gray
    $response1 | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    
    if ($response1.data -and $response1.data.createDataConnectionPublic -and $response1.data.createDataConnectionPublic.id) {
        $connectionId = $response1.data.createDataConnectionPublic.id
        Write-Host "✅ Firebase connection created with ID: $connectionId" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Firebase connection" -ForegroundColor Red
        
        if ($response1.errors) {
            Write-Host "Errors:" -ForegroundColor Red
            $response1.errors | ForEach-Object { Write-Host $_.message -ForegroundColor Red }
            
            # Check if it's an enum error
            $errorMessage = $response1.errors[0].message
            if ($errorMessage -like "*invalid input value for enum*") {
                Write-Host ""
                Write-Host "🔍 DIAGNOSIS: Database enum needs to be updated!" -ForegroundColor Yellow
                Write-Host "Please run this SQL in your Supabase dashboard:" -ForegroundColor Yellow
                Write-Host "ALTER TYPE connection_type ADD VALUE 'FIREBASE';" -ForegroundColor Cyan
                Write-Host "ALTER TYPE connection_type ADD VALUE 'MONGODB';" -ForegroundColor Cyan
            }
        }
        exit 1
    }
} catch {
    Write-Host "❌ Error making request: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Verify connection exists in database
Write-Host "🧪 Test 2: Verifying connection exists in database..." -ForegroundColor Cyan

$body2 = @{
    query = 'query ListConnections { getDataConnectionsPublic { id name type status description createdAt } }'
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Body $body2 -ContentType "application/json"
    
    Write-Host "Response:" -ForegroundColor Gray
    $response2 | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    
    if ($response2.data -and $response2.data.getDataConnectionsPublic) {
        $connections = $response2.data.getDataConnectionsPublic
        $firebaseConnection = $connections | Where-Object { $_.id -eq $connectionId }
        
        if ($firebaseConnection) {
            Write-Host "✅ Connection successfully saved and retrieved from database!" -ForegroundColor Green
        } else {
            Write-Host "❌ Connection not found in database list" -ForegroundColor Red
        }
        
        Write-Host "Total connections found: $($connections.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error verifying connection: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Test MongoDB connection save
Write-Host "🧪 Test 3: Testing MongoDB connection save..." -ForegroundColor Cyan

$body3 = @{
    query = 'mutation CreateMongoConnection { createDataConnectionPublic(input: { type: MONGODB, name: "Test MongoDB Save", description: "Testing MongoDB save", config: { connectionString: "mongodb://localhost:27017/testdb" } }) { id name type status description createdAt } }'
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "http://localhost:4000/graphql" -Method POST -Body $body3 -ContentType "application/json"
    
    Write-Host "Response:" -ForegroundColor Gray
    $response3 | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    
    if ($response3.data -and $response3.data.createDataConnectionPublic -and $response3.data.createDataConnectionPublic.id) {
        Write-Host "✅ MongoDB connection also saves successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ MongoDB connection failed to save" -ForegroundColor Red
        if ($response3.errors -and $response3.errors[0].message -like "*invalid input value for enum*") {
            Write-Host "Need to add MONGODB to database enum as well" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Error testing MongoDB: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Database save testing completed!" -ForegroundColor Green
Write-Host "If you see ✅ messages above, the database save is working correctly." -ForegroundColor Gray
Write-Host "If you see ❌ messages, check the error details and database enum configuration." -ForegroundColor Gray