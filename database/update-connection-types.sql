-- Update connection_type enum to include Firebase and MongoDB
-- This migration adds the missing database types that were implemented in the code

-- Add new connection types to the enum
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'FIREBASE';
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'MONGODB';
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'REDIS';
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'ELASTICSEARCH';
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'CASSANDRA';
ALTER TYPE connection_type ADD VALUE IF NOT EXISTS 'DYNAMODB';