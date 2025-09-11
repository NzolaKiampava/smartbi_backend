import { createClient } from '@supabase/supabase-js';
import { config } from './environment';

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Simple connection test by trying to get database schema info
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);
    
    // Even if we get an error about missing tables, it means the connection works
    if (error && !error.message.includes('Could not find the table')) {
      console.error('Database connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};