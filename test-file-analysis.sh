#!/bin/bash

# Quick Test Script for SmartBI File Analysis System
# Run this after starting the server with: npm run dev

echo "🧪 Testing SmartBI File Analysis System with curl..."
echo ""

BASE_URL="http://localhost:4000/graphql"

# Test 1: Check if GraphQL endpoint is accessible
echo "1. Testing GraphQL endpoint accessibility..."
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __typename }"}' \
  $BASE_URL)

if [ "$response" = "200" ]; then
    echo "   ✅ GraphQL endpoint is accessible"
else
    echo "   ❌ GraphQL endpoint not accessible (HTTP $response)"
    echo "   💡 Make sure the server is running: npm run dev"
    exit 1
fi

# Test 2: Check schema introspection
echo ""
echo "2. Checking file analysis schema..."
schema_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __type(name: \"FileUpload\") { name fields { name } } }"}' \
  $BASE_URL)

if echo "$schema_response" | grep -q "FileUpload"; then
    echo "   ✅ FileUpload type is available in schema"
else
    echo "   ❌ FileUpload type not found in schema"
fi

# Test 3: Check Upload scalar
echo ""
echo "3. Checking Upload scalar availability..."
upload_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __type(name: \"Upload\") { name kind } }"}' \
  $BASE_URL)

if echo "$upload_response" | grep -q "Upload"; then
    echo "   ✅ Upload scalar is available"
else
    echo "   ❌ Upload scalar not found"
fi

# Test 4: Check available mutations
echo ""
echo "4. Checking file upload mutations..."
mutation_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"query { __type(name: \"Mutation\") { fields { name } } }"}' \
  $BASE_URL)

if echo "$mutation_response" | grep -q "uploadAndAnalyzeFile"; then
    echo "   ✅ uploadAndAnalyzeFile mutation is available"
else
    echo "   ❌ uploadAndAnalyzeFile mutation not found"
fi

echo ""
echo "🎯 Basic endpoint tests completed!"
echo ""
echo "📖 For full file upload testing:"
echo "   1. Import the Postman collection:"
echo "      testing/SmartBI-File-Analysis.postman_collection.json"
echo ""
echo "   2. Or use this curl command for file upload (requires auth token):"
echo "      curl -X POST http://localhost:4000/graphql \\"
echo "        -H \"Authorization: Bearer YOUR_TOKEN\" \\"
echo "        -F 'operations={\"query\":\"mutation UploadFile(\$file: Upload!) { uploadAndAnalyzeFile(file: \$file) { id fileName status } }\",\"variables\":{\$file\":null}}' \\"
echo "        -F 'map={\"0\":[\"variables.file\"]}' \\"
echo "        -F '0=@testing/sample_revenue_data.csv'"
echo ""
echo "   3. Sample files for testing:"
echo "      • testing/sample_revenue_data.csv"
echo "      • testing/sample_sql_analysis.sql"
echo "      • testing/sample_financial_data.json"
echo ""
echo "📚 Complete testing guide: POSTMAN_TESTING_GUIDE.md"