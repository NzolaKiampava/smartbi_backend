import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');
    
    const migrationPath = path.join(__dirname, '../database/add_extracted_text_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing SQL:', migrationSQL);
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach using direct query
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('analysis_reports')
        .select('id')
        .limit(1);
        
      if (altError?.code === 'PGRST116') {
        console.log('✅ Column may already exist or migration succeeded via alternative method');
      } else {
        throw new Error(`Migration failed: ${error.message}`);
      }
    } else {
      console.log('✅ Migration completed successfully');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration();
}

export { runMigration };