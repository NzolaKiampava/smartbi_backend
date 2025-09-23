#!/bin/bash

# Terminal Testing Script for SmartBI File Analysis
# Run this script to test the GraphQL endpoints from command line

echo "🧪 Testing SmartBI File Analysis System from Terminal..."
echo ""

BASE_URL="http://localhost:4000/graphql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}1. Checking if server is running...${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __typename }"}' \
        $BASE_URL 2>/dev/null)

    if [ "$response" = "200" ]; then
        echo -e "   ${GREEN}✅ Server is running and accessible${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Server not accessible (HTTP $response)${NC}"
        echo -e "   ${BLUE}💡 Start the server with: npm run dev${NC}"
        return 1
    fi
}

# Function to test GraphQL schema
test_schema() {
    echo -e "\n${YELLOW}2. Testing GraphQL schema...${NC}"
    
    # Test FileUpload type
    schema_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __type(name: \"FileUpload\") { name fields { name type { name } } } }"}' \
        $BASE_URL)

    if echo "$schema_response" | grep -q "FileUpload"; then
        echo -e "   ${GREEN}✅ FileUpload type available${NC}"
        
        # Extract field names
        fields=$(echo "$schema_response" | jq -r '.data.__type.fields[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
        if [ ! -z "$fields" ]; then
            echo -e "   ${BLUE}📋 Fields: $fields${NC}"
        fi
    else
        echo -e "   ${RED}❌ FileUpload type not found${NC}"
    fi

    # Test Upload scalar
    upload_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __type(name: \"Upload\") { name kind } }"}' \
        $BASE_URL)

    if echo "$upload_response" | grep -q "Upload"; then
        echo -e "   ${GREEN}✅ Upload scalar available${NC}"
    else
        echo -e "   ${RED}❌ Upload scalar not found${NC}"
    fi
}

# Function to test file upload mutation structure
test_mutation() {
    echo -e "\n${YELLOW}3. Testing upload mutation structure...${NC}"
    
    mutation_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __type(name: \"Mutation\") { fields { name args { name type { name kind } } } } }"}' \
        $BASE_URL)

    if echo "$mutation_response" | grep -q "uploadAndAnalyzeFile"; then
        echo -e "   ${GREEN}✅ uploadAndAnalyzeFile mutation available${NC}"
        
        # Check mutation arguments
        args=$(echo "$mutation_response" | jq -r '.data.__type.fields[] | select(.name=="uploadAndAnalyzeFile") | .args[].name' 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
        if [ ! -z "$args" ]; then
            echo -e "   ${BLUE}📋 Arguments: $args${NC}"
        fi
    else
        echo -e "   ${RED}❌ uploadAndAnalyzeFile mutation not found${NC}"
    fi
}

# Function to test actual file upload (requires auth)
test_file_upload() {
    echo -e "\n${YELLOW}4. Testing file upload (without auth)...${NC}"
    echo -e "   ${BLUE}Note: This will fail without authentication token${NC}"
    
    # Create a simple test CSV file
    test_csv="test_data.csv"
    echo "Date,Product,Revenue" > $test_csv
    echo "2024-01-01,Product A,1000" >> $test_csv
    echo "2024-01-02,Product B,1500" >> $test_csv
    
    # Try to upload (will fail without auth, but tests the endpoint)
    upload_response=$(curl -s -X POST \
        -F 'operations={"query":"mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary } }","variables":{"input":{"file":null,"description":"Test"}}}' \
        -F 'map={"0":["variables.input.file"]}' \
        -F "0=@$test_csv" \
        $BASE_URL 2>&1)

    if echo "$upload_response" | grep -q "Authentication\|Unauthorized\|token"; then
        echo -e "   ${YELLOW}⚠️  Upload endpoint reachable (needs authentication)${NC}"
        echo -e "   ${BLUE}💡 This is expected - authentication required for uploads${NC}"
    elif echo "$upload_response" | grep -q "uploadAndAnalyzeFile"; then
        echo -e "   ${GREEN}✅ Upload successful!${NC}"
        echo -e "   ${BLUE}Response: $(echo "$upload_response" | jq -c '.' 2>/dev/null)${NC}"
    else
        echo -e "   ${RED}❌ Upload failed${NC}"
        echo -e "   ${BLUE}Response: $upload_response${NC}"
    fi
    
    # Clean up test file
    rm -f $test_csv
}

# Function to show available queries
show_available_queries() {
    echo -e "\n${YELLOW}5. Available Queries and Mutations:${NC}"
    
    queries_response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"query":"query { __schema { queryType { fields { name description } } mutationType { fields { name description } } } }"}' \
        $BASE_URL)

    echo -e "\n${BLUE}📋 Available Queries:${NC}"
    echo "$queries_response" | jq -r '.data.__schema.queryType.fields[]? | "   • \(.name)"' 2>/dev/null | grep -E "(file|upload|analysis|report)" || echo "   No file-related queries found"
    
    echo -e "\n${BLUE}📋 Available Mutations:${NC}"
    echo "$queries_response" | jq -r '.data.__schema.mutationType.fields[]? | "   • \(.name)"' 2>/dev/null | grep -E "(file|upload|analysis|report)" || echo "   No file-related mutations found"
}

# Function to show curl examples
show_curl_examples() {
    echo -e "\n${YELLOW}6. Curl Examples for Testing:${NC}"
    
    echo -e "\n${BLUE}🔹 Test server connection:${NC}"
    echo 'curl -X POST http://localhost:4000/graphql \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -d '\''{"query":"query { __typename }"}'\'''
    
    echo -e "\n${BLUE}🔹 Upload file (with auth token):${NC}"
    echo 'curl -X POST http://localhost:4000/graphql \'
    echo '  -H "Authorization: Bearer YOUR_TOKEN_HERE" \'
    echo '  -F '\''operations={"query":"mutation UploadAndAnalyzeFile($input: FileUploadInput!) { uploadAndAnalyzeFile(input: $input) { id title summary } }","variables":{"input":{"file":null,"description":"Test upload"}}}'\'' \'
    echo '  -F '\''map={"0":["variables.input.file"]}'\'' \'
    echo '  -F '\''0=@testing/sample_revenue_data.csv'\'''
    
    echo -e "\n${BLUE}🔹 Get analysis report:${NC}"
    echo 'curl -X POST http://localhost:4000/graphql \'
    echo '  -H "Content-Type: application/json" \'
    echo '  -H "Authorization: Bearer YOUR_TOKEN_HERE" \'
    echo '  -d '\''{"query":"query GetAnalysisReport($reportId: ID!) { getAnalysisReport(reportId: $reportId) { id title summary insights { type title confidence } } }","variables":{"reportId":"REPORT_ID_HERE"}}'\'''
}

# Main execution
main() {
    if check_server; then
        test_schema
        test_mutation
        test_file_upload
        show_available_queries
    fi
    
    show_curl_examples
    
    echo -e "\n${GREEN}🎯 Terminal testing completed!${NC}"
    echo -e "\n${BLUE}📖 Next steps:${NC}"
    echo -e "   1. Get authentication token first"
    echo -e "   2. Use the curl examples above with your token"
    echo -e "   3. Test with sample files in testing/ directory"
    echo -e "   4. Check POSTMAN_TESTING_GUIDE.md for detailed examples"
}

# Run main function
main