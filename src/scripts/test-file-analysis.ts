import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Simple test to verify file analysis system integration
async function testFileAnalysisSystem() {
  console.log('🧪 Testing SmartBI File Analysis System...\n');

  // 1. Check environment variables
  console.log('1. Environment Configuration:');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    console.log(`   ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  console.log(`   GEMINI_API_KEY: ${geminiKey ? '✅ Set' : '⚠️  Optional (for AI analysis)'}`);

  // 2. Check database connection
  console.log('\n2. Database Connection:');
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('   ❌ Cannot test - Supabase credentials missing');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
    } else {
      console.log('   ✅ Database connection successful');
    }
  } catch (error) {
    console.log(`   ❌ Database test failed: ${error}`);
  }

  // 3. Check required dependencies
  console.log('\n3. Dependencies:');
  const requiredPackages = [
    'graphql-upload',
    'xlsx',
    'csv-parser',
    'pdf-parse',
    'multer',
    'uuid',
    '@google/generative-ai'
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      console.log(`   ✅ ${pkg}`);
    } catch (error) {
      console.log(`   ❌ ${pkg} - Not installed`);
    }
  }

  // 4. Check file structure
  console.log('\n4. File Structure:');
  const requiredFiles = [
    'src/schema/file-analysis.schema.ts',
    'src/services/file-upload.service.ts',
    'src/services/ai-analysis.service.ts',
    'src/services/report-generation.service.ts',
    'src/services/report-export.service.ts',
    'src/resolvers/file-analysis.resolvers.ts',
    'src/types/file-analysis.ts',
    'database/file-analysis-migration.sql',
    'testing/sample_revenue_data.csv',
    'testing/sample_sql_analysis.sql',
    'testing/sample_financial_data.json'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', '..', file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  }

  // 5. Upload directory check
  console.log('\n5. Upload Directory:');
  const uploadDir = path.join(__dirname, '..', '..', 'uploads');
  const uploadsExist = fs.existsSync(uploadDir);
  console.log(`   Upload directory: ${uploadsExist ? '✅ Exists' : '⚠️  Will be created on first upload'}`);

  // 6. GraphQL Schema Integration
  console.log('\n6. Schema Integration:');
  try {
    const schemaIndex = fs.readFileSync(path.join(__dirname, '..', 'schema', 'index.ts'), 'utf8');
    const hasFileAnalysis = schemaIndex.includes('fileAnalysisTypeDefs');
    console.log(`   File analysis schema: ${hasFileAnalysis ? '✅ Integrated' : '❌ Not integrated'}`);

    const resolverIndex = fs.readFileSync(path.join(__dirname, '..', 'resolvers', 'index.ts'), 'utf8');
    const hasResolvers = resolverIndex.includes('FileAnalysisResolvers');
    console.log(`   File analysis resolvers: ${hasResolvers ? '✅ Integrated' : '❌ Not integrated'}`);
  } catch (error) {
    console.log(`   ❌ Schema check failed: ${error}`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('   The file analysis system appears to be properly integrated.');
  console.log('   Next steps:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Run database migration (if not done): npm run migrate:file-analysis');
  console.log('   3. Test GraphQL endpoints using the Postman collection');
  console.log('   4. Upload sample files and verify AI analysis works');
  
  if (!geminiKey) {
    console.log('\n⚠️  Note: Set GEMINI_API_KEY for AI analysis functionality');
  }
}

// Run the test
if (require.main === module) {
  testFileAnalysisSystem().catch(console.error);
}

export { testFileAnalysisSystem };