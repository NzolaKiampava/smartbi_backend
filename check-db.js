const { supabase } = require('./dist/config/database');

async function checkDatabase() {
  console.log('🔍 Checking database status...');
  
  // Check if companies table exists
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'companies');

  if (tablesError) {
    console.error('❌ Error checking tables:', tablesError.message);
    return;
  }

  if (!tables || tables.length === 0) {
    console.log('❌ Companies table does not exist. Please run the migration script in Supabase dashboard.');
    console.log('📄 Migration file: database/migration.sql');
    return;
  }

  console.log('✅ Companies table exists');

  // Check if there's any data in companies table
  const { data: companies, error: companiesError, count } = await supabase
    .from('companies')
    .select('id, name, is_active', { count: 'exact' })
    .limit(5);

  if (companiesError) {
    console.error('❌ Error querying companies:', companiesError.message);
    return;
  }

  console.log(`📊 Found ${count} companies in database`);
  
  if (companies && companies.length > 0) {
    console.log('📋 Sample companies:');
    companies.forEach((company) => {
      console.log(`  - ${company.name} (active: ${company.is_active})`);
    });
  } else {
    console.log('❌ No companies found. Please run the migration script to insert sample data.');
  }

  // Check users table as well
  const { data: users, error: usersError, count: userCount } = await supabase
    .from('users')
    .select('id, email, role', { count: 'exact' })
    .limit(3);

  if (usersError) {
    console.error('❌ Error querying users:', usersError.message);
    return;
  }

  console.log(`👥 Found ${userCount} users in database`);
  
  if (users && users.length > 0) {
    console.log('👤 Sample users:');
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });
  }
}

checkDatabase().catch(console.error);
