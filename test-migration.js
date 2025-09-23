const { supabase } = require('./dist/config/database');

async function addConnectionTypes() {
  console.log('🔄 Adding new connection types to database...');
  
  try {
    // Instead of trying to alter the enum directly, let's try to insert a test record
    // to see if the new types work, and if not, we'll get a helpful error message
    
    console.log('🧪 Testing if FIREBASE type is supported...');
    
    // First, let's check if we have any companies to work with
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    if (compError) {
      console.error('❌ Error checking companies:', compError);
      return;
    }
    
    if (!companies || companies.length === 0) {
      console.log('⚠️ No companies found. Creating a test company first...');
      
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: 'Test Company for Migration',
          description: 'Temporary company for testing database migration'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating test company:', createError);
        return;
      }
      
      console.log('✅ Test company created:', newCompany.id);
      companies.push(newCompany);
    }
    
    const companyId = companies[0].id;
    console.log('🏢 Using company ID:', companyId);
    
    // Try to create a test Firebase connection
    const testConnection = {
      company_id: companyId,
      name: 'Test Firebase Connection',
      type: 'FIREBASE',
      config: {
        projectId: 'test-project',
        apiKey: 'test-key'
      },
      status: 'INACTIVE'
    };
    
    console.log('🧪 Attempting to insert test Firebase connection...');
    
    const { data: connectionData, error: connectionError } = await supabase
      .from('data_connections')
      .insert(testConnection)
      .select()
      .single();
    
    if (connectionError) {
      console.error('❌ Error inserting Firebase connection:', connectionError);
      
      if (connectionError.message.includes('invalid input value for enum')) {
        console.log('');
        console.log('🔍 DIAGNOSIS: The database enum does not include the new connection types.');
        console.log('');
        console.log('📋 SOLUTION: You need to manually update the database enum.');
        console.log('Please run the following SQL commands in your Supabase SQL Editor:');
        console.log('');
        console.log('-- Add new connection types');
        console.log("ALTER TYPE connection_type ADD VALUE 'FIREBASE';");
        console.log("ALTER TYPE connection_type ADD VALUE 'MONGODB';");
        console.log("ALTER TYPE connection_type ADD VALUE 'REDIS';");
        console.log("ALTER TYPE connection_type ADD VALUE 'ELASTICSEARCH';");
        console.log("ALTER TYPE connection_type ADD VALUE 'CASSANDRA';");
        console.log("ALTER TYPE connection_type ADD VALUE 'DYNAMODB';");
        console.log('');
        console.log('🌐 Access your Supabase dashboard at: https://supabase.com/dashboard');
        console.log('Then go to SQL Editor and run the commands above.');
      }
      
      return;
    }
    
    console.log('✅ Firebase connection created successfully!', connectionData.id);
    
    // Clean up - delete the test connection
    await supabase
      .from('data_connections')
      .delete()
      .eq('id', connectionData.id);
    
    console.log('🧹 Test connection cleaned up');
    
    // Test MongoDB too
    console.log('🧪 Testing MongoDB type...');
    
    const mongoTest = {
      company_id: companyId,
      name: 'Test MongoDB Connection',
      type: 'MONGODB',
      config: {
        connectionString: 'mongodb://localhost:27017/test'
      },
      status: 'INACTIVE'
    };
    
    const { data: mongoData, error: mongoError } = await supabase
      .from('data_connections')
      .insert(mongoTest)
      .select()
      .single();
    
    if (mongoError) {
      console.error('❌ MongoDB type also not supported:', mongoError.message);
    } else {
      console.log('✅ MongoDB connection also works!');
      // Clean up
      await supabase
        .from('data_connections')
        .delete()
        .eq('id', mongoData.id);
    }
    
    console.log('');
    console.log('🎉 Migration test completed!');
    console.log('If you saw success messages, the new types are working.');
    console.log('If you saw errors, please follow the SQL commands above.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addConnectionTypes();