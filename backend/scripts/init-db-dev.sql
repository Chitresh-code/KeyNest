-- KeyNest Development Database Initialization Script
-- This script runs when PostgreSQL container starts for the first time in dev mode

-- Create development database if it doesn't exist
CREATE DATABASE keynest_dev WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;

-- Connect to the new database
\c keynest_dev;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions to dev user
GRANT ALL PRIVILEGES ON DATABASE keynest_dev TO keynest_dev;
GRANT ALL ON SCHEMA public TO keynest_dev;
GRANT ALL ON ALL TABLES IN SCHEMA public TO keynest_dev;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO keynest_dev;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keynest_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keynest_dev;

-- Create development-specific schemas (optional)
CREATE SCHEMA IF NOT EXISTS test_data;
GRANT ALL ON SCHEMA test_data TO keynest_dev;

-- Development logging
\echo 'KeyNest development database initialized successfully';