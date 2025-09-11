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
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error) {
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