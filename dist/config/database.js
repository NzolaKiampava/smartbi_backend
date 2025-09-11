"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const environment_1 = require("./environment");
if (!environment_1.config.supabase.url || !environment_1.config.supabase.serviceRoleKey) {
    throw new Error('Supabase configuration is missing. Please check your environment variables.');
}
exports.supabase = (0, supabase_js_1.createClient)(environment_1.config.supabase.url, environment_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
exports.supabaseAdmin = (0, supabase_js_1.createClient)(environment_1.config.supabase.url, environment_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
const testDatabaseConnection = async () => {
    try {
        const { data, error } = await exports.supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
        if (error && !error.message.includes('Could not find the table')) {
            console.error('Database connection test failed:', error.message);
            return false;
        }
        console.log('✅ Database connection successful');
        return true;
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
//# sourceMappingURL=database.js.map