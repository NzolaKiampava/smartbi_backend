-- Add SUPABASE to connection_type enum (if not already exists)
DO $$ 
BEGIN
    -- Check if SUPABASE already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'connection_type') 
        AND enumlabel = 'SUPABASE'
    ) THEN
        -- Add SUPABASE to the existing enum
        ALTER TYPE connection_type ADD VALUE 'SUPABASE';
    END IF;
END $$;