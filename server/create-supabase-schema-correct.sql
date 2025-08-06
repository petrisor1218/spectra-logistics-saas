-- Schema corectă pentru Supabase bazată pe shared/schema.ts
-- Aceasta trebuie executată în Supabase Dashboard

-- Tabel pentru utilizatori (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'subscriber',
  tenant_id VARCHAR(100) UNIQUE,
  company_name VARCHAR(200),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  trial_ends_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru companii (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  cif VARCHAR(50),
  trade_register_number VARCHAR(100),
  address TEXT,
  location VARCHAR(100),
  county VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Romania',
  contact TEXT,
  is_main_company BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru driveri (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  name_variants JSONB,
  phone VARCHAR(20) DEFAULT '',
  email VARCHAR(100) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru procesarea săptămânală (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS weekly_processing (
  id SERIAL PRIMARY KEY,
  week_label VARCHAR(100) NOT NULL,
  processing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trip_data_count INTEGER DEFAULT 0,
  invoice7_count INTEGER DEFAULT 0,
  invoice30_count INTEGER DEFAULT 0,
  processed_data JSONB,
  trip_data JSONB,
  invoice7_data JSONB,
  invoice30_data JSONB
);

-- Tabel pentru călătoriile istorice (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS historical_trips (
  id SERIAL PRIMARY KEY,
  vrid VARCHAR(100) NOT NULL,
  driver_name VARCHAR(200),
  week_label VARCHAR(100) NOT NULL,
  trip_date TIMESTAMP,
  route VARCHAR(200),
  raw_trip_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru secvențele de comenzi (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS order_sequences (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  current_number INTEGER DEFAULT 1550,
  last_used_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru comenzile de transport (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS transport_orders (
  id SERIAL PRIMARY KEY,
  order_number INTEGER NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  week_label VARCHAR(100) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  commission_amount DECIMAL(15,2) NOT NULL,
  driver_payments JSONB,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru plăți (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  week_label VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru istoricul plăților (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS payment_history (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  week_label VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru soldurile companiilor (conform shared/schema.ts)
CREATE TABLE IF NOT EXISTS company_balances (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  week_label VARCHAR(100) NOT NULL,
  total_invoiced DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_date TIMESTAMP,
  notes TEXT
);

-- Indecși pentru performanță
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_name ON drivers(name);
CREATE INDEX IF NOT EXISTS idx_weekly_processing_week_label ON weekly_processing(week_label);
CREATE INDEX IF NOT EXISTS idx_historical_trips_vrid ON historical_trips(vrid);
CREATE INDEX IF NOT EXISTS idx_historical_trips_week_label ON historical_trips(week_label);
CREATE INDEX IF NOT EXISTS idx_transport_orders_company_name ON transport_orders(company_name);
CREATE INDEX IF NOT EXISTS idx_transport_orders_week_label ON transport_orders(week_label);
CREATE INDEX IF NOT EXISTS idx_payments_company_name ON payments(company_name);
CREATE INDEX IF NOT EXISTS idx_payments_week_label ON payments(week_label);
CREATE INDEX IF NOT EXISTS idx_company_balances_company_name ON company_balances(company_name);
CREATE INDEX IF NOT EXISTS idx_company_balances_week_label ON company_balances(week_label);

-- Insert default users pentru testare
INSERT INTO users (username, password, email, role, tenant_id) VALUES 
('petrisor', '$2b$10$example.hash.for.test123', 'petrisor@fastexpress.ro', 'admin', 'main'),
('admin', '$2b$10$example.hash.for.admin123', 'admin@transport.pro', 'admin', 'admin'),
('toma', '$2b$10$example.hash.for.test123', 'toma@test.com', 'subscriber', 'tenant_1754291118685_qi17iipyv')
ON CONFLICT (username) DO NOTHING;