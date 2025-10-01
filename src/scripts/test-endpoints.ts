import { readFileSync } from 'fs';
import path from 'path';

// Simple test script to verify GraphQL file upload endpoints
async function testFileAnalysisEndpoints() {
  const baseUrl = 'http://localhost:4000/graphql';
  
  console.log('🧪 Testing SmartBI File Analysis System...\n');

  // Test 1: Health check
  console.log('1. Testing GraphQL endpoint...');
  try {
    const healthQuery = {
      query: `
        query {
          __schema {
            types {
              name
            }
          }
        }
      `
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healthQuery)
    });

    if (response.ok) {
      console.log('   ✅ GraphQL endpoint is accessible');
    } else {
      console.log('   ❌ GraphQL endpoint not accessible:', response.statusText);
      return;
    }
  } catch (error) {
    console.log('   ❌ Cannot reach GraphQL endpoint:', error);
    console.log('   💡 Make sure the server is running: npm run dev');
    return;
  }

  // Test 2: Check file upload schema
  console.log('\n2. Checking file analysis schema...');
  try {
    const schemaQuery = {
      query: `
        query {
          __type(name: "FileUpload") {
            name
            fields {
              name
              type {
                name
              }
            }
          }
        }
      `
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemaQuery)
    });

  const result: any = await response.json();
    
    if (result.data?.__type?.name === 'FileUpload') {
      console.log('   ✅ FileUpload type is available');
      console.log('   📋 Available fields:', result.data.__type.fields.map((f: any) => f.name).join(', '));
    } else {
      console.log('   ❌ FileUpload type not found in schema');
    }
  } catch (error) {
    console.log('   ❌ Error checking schema:', error);
  }

  // Test 3: Check for Upload scalar
  console.log('\n3. Checking Upload scalar...');
  try {
    const uploadQuery = {
      query: `
        query {
          __type(name: "Upload") {
            name
            kind
          }
        }
      `
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadQuery)
    });

  const result: any = await response.json();
    
    if (result.data?.__type?.name === 'Upload') {
      console.log('   ✅ Upload scalar is available');
    } else {
      console.log('   ❌ Upload scalar not found');
    }
  } catch (error) {
    console.log('   ❌ Error checking Upload scalar:', error);
  }

  // Test 4: Test file upload mutation (without actual file)
  console.log('\n4. Testing file upload mutation structure...');
  try {
    const mutationQuery = {
      query: `
        query {
          __type(name: "Mutation") {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mutationQuery)
    });

  const result: any = await response.json();
    const mutations = result.data?.__type?.fields || [];
    const uploadMutation = mutations.find((m: any) => m.name === 'uploadAndAnalyzeFile');
    
    if (uploadMutation) {
      console.log('   ✅ uploadAndAnalyzeFile mutation is available');
      console.log('   📋 Arguments:', uploadMutation.args.map((a: any) => `${a.name}: ${a.type.name || a.type.kind}`).join(', '));
    } else {
      console.log('   ❌ uploadAndAnalyzeFile mutation not found');
      console.log('   📋 Available mutations:', mutations.map((m: any) => m.name).join(', '));
    }
  } catch (error) {
    console.log('   ❌ Error checking mutations:', error);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   The file analysis system endpoints are ready for testing.');
  console.log('\n📖 Next Steps:');
  console.log('   1. Use the Postman collection for full testing');
  console.log('   2. Get an authentication token first');
  console.log('   3. Upload sample files with multipart/form-data');
  console.log('   4. Check the generated analysis reports');
  console.log('\n📁 Sample files available:');
  console.log('   • testing/sample_revenue_data.csv');
  console.log('   • testing/sample_sql_analysis.sql');
  console.log('   • testing/sample_financial_data.json');
  console.log('\n📚 Documentation:');
  console.log('   • POSTMAN_TESTING_GUIDE.md - Complete testing guide');
  console.log('   • testing/SmartBI-File-Analysis.postman_collection.json - Postman collection');
}

// Run the test
if (require.main === module) {
  testFileAnalysisEndpoints().catch(console.error);
}

export { testFileAnalysisEndpoints };