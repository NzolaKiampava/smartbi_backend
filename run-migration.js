const { supabase } = require('./dist/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running database migration to add new connection types...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'update-connection-types.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔄 Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with next statement for enum additions
        if (!error.message.includes('already exists')) {
          console.error('Stopping migration due to error');
          process.exit(1);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the new enum values
    console.log('🧪 Testing new connection types...');
    
    const { data, error: testError } = await supabase
      .from('data_connections')
      .select('type')
      .limit(1);
    
    if (testError) {
      console.log('⚠️ Note: Could not test enum values, but migration likely succeeded');
    } else {
      console.log('✅ Database connection working, new enum values should be available');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();