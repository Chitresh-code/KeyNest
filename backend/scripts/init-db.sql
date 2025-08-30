-- KeyNest Production Database Initialization Script
-- This script runs when PostgreSQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE keynest_db WITH ENCODING 'UTF8' LC_COLLATE='C' LC_CTYPE='C' TEMPLATE template0;

-- Connect to the new database
\c keynest_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a read-only user for backups
CREATE USER keynest_backup WITH ENCRYPTED PASSWORD 'backup_user_password';
GRANT CONNECT ON DATABASE keynest_db TO keynest_backup;

-- Create indexes for better performance (will be created by Django migrations)
-- These are just examples - Django will handle the actual schema

-- Grant permissions to main user
GRANT ALL PRIVILEGES ON DATABASE keynest_db TO keynest_user;
GRANT ALL ON SCHEMA public TO keynest_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO keynest_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO keynest_user;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO keynest_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO keynest_user;

-- Create a schema for audit logs (optional optimization)
-- CREATE SCHEMA IF NOT EXISTS audit;
-- GRANT ALL ON SCHEMA audit TO keynest_user;

-- Log successful initialization
INSERT INTO pg_stat_statements_info VALUES ('KeyNest database initialized successfully');