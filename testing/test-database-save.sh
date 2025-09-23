#!/bin/bash
# Test database save functionality for Firebase connections

echo "🔥 Testing Firebase Database Save"
echo "================================="

# First check if server is running
echo "📡 Checking if server is running..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/graphql

if [ $? -ne 0 ]; then
    echo "❌ Server is not running on http://localhost:4000"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Create Firebase Connection
echo "🧪 Test 1: Creating Firebase connection..."
response1=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateFirebaseConnection { createDataConnectionPublic(input: { type: FIREBASE, name: \"Test Firebase Save\", description: \"Testing database save\", config: { apiUrl: \"kimakudi-db\", apiKey: \"AIzaSyDARAd1d_mt6ebQx4yz0SF41dLKPaNWuf8\" } }) { id name type status description config { apiUrl } createdAt } }"
  }')

echo "Response: $response1"
echo ""

# Extract connection ID if successful
connection_id=$(echo $response1 | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$connection_id" ]; then
    echo "✅ Firebase connection created with ID: $connection_id"
else
    echo "❌ Failed to create Firebase connection"
    echo "Check the response above for errors"
    
    # Check if it's an enum error
    if echo $response1 | grep -q "invalid input value for enum"; then
        echo ""
        echo "🔍 DIAGNOSIS: Database enum needs to be updated!"
        echo "Please run this SQL in your Supabase dashboard:"
        echo "ALTER TYPE connection_type ADD VALUE 'FIREBASE';"
        echo "ALTER TYPE connection_type ADD VALUE 'MONGODB';"
    fi
    exit 1
fi

echo ""

# Test 2: Verify connection exists in database
echo "🧪 Test 2: Verifying connection exists in database..."
response2=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query ListConnections { getDataConnectionsPublic { id name type status description createdAt } }"
  }')

echo "Response: $response2"
echo ""

# Check if our connection appears in the list
if echo $response2 | grep -q "$connection_id"; then
    echo "✅ Connection successfully saved and retrieved from database!"
else
    echo "❌ Connection not found in database list"
fi

echo ""

# Test 3: Test MongoDB connection save
echo "🧪 Test 3: Testing MongoDB connection save..."
response3=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateMongoConnection { createDataConnectionPublic(input: { type: MONGODB, name: \"Test MongoDB Save\", description: \"Testing MongoDB save\", config: { connectionString: \"mongodb://localhost:27017/testdb\" } }) { id name type status description createdAt } }"
  }')

echo "Response: $response3"
echo ""

if echo $response3 | grep -q '"id"'; then
    echo "✅ MongoDB connection also saves successfully!"
else
    echo "❌ MongoDB connection failed to save"
    if echo $response3 | grep -q "invalid input value for enum"; then
        echo "Need to add MONGODB to database enum as well"
    fi
fi

echo ""
echo "🎉 Database save testing completed!"
echo "If you see ✅ messages above, the database save is working correctly."
echo "If you see ❌ messages, check the error details and database enum configuration."