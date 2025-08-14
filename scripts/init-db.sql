-- Script de inițializare pentru bazele de date Spectra Logistics

-- Creează baza de date pentru admin (management tenantilor)
CREATE DATABASE spectra_admin;

-- Creează baza de date pentru tenantii existenți (pentru migrare)
CREATE DATABASE spectra_main;

-- Creează utilizatorul pentru aplicație
CREATE USER spectra_user WITH PASSWORD 'spectra_password';

-- Acordă permisiuni
GRANT ALL PRIVILEGES ON DATABASE spectra_admin TO spectra_user;
GRANT ALL PRIVILEGES ON DATABASE spectra_main TO spectra_user;

-- Conectează la baza de date admin
\c spectra_admin;

-- Creează extensii necesare
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Conectează la baza de date principală
\c spectra_main;

-- Creează extensii necesare
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Setează timezone
SET timezone = 'Europe/Bucharest';

-- Creează funcții utile
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
