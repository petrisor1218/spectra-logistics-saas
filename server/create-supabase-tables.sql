-- Schema pentru tabelele principale în Supabase
-- Aceasta va fi executată în Supabase Dashboard

-- Tabel pentru utilizatori
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'subscriber',
  tenant_id VARCHAR(50),
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_plan VARCHAR(50) DEFAULT 'transport_pro',
  subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru companii
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cif VARCHAR(100),
  trade_registry VARCHAR(100),
  address TEXT,
  commission_rate DECIMAL(5,4) DEFAULT 0.04,
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru driveri
CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  vrid VARCHAR(100),
  email VARCHAR(255),
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru procesarea săptămânală
CREATE TABLE IF NOT EXISTS weekly_processing (
  id SERIAL PRIMARY KEY,
  week_label VARCHAR(100) NOT NULL,
  processing_date TIMESTAMP NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru plăți
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  week_label VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  commission DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru soldurile companiilor
CREATE TABLE IF NOT EXISTS company_balances (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  week_label VARCHAR(100) NOT NULL,
  total_invoiced DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru comenzile de transport
CREATE TABLE IF NOT EXISTS transport_orders (
  id SERIAL PRIMARY KEY,
  order_number INTEGER NOT NULL,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  week_label VARCHAR(100) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru secvențele de comenzi
CREATE TABLE IF NOT EXISTS order_sequences (
  id SERIAL PRIMARY KEY,
  last_order_number INTEGER DEFAULT 1553,
  tenant_id VARCHAR(50) DEFAULT 'main',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru călătoriile istorice
CREATE TABLE IF NOT EXISTS historical_trips (
  id SERIAL PRIMARY KEY,
  vrid VARCHAR(100),
  driver_name VARCHAR(255),
  company_name VARCHAR(255),
  week_label VARCHAR(100),
  amount DECIMAL(15,2),
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pentru istoricul plăților
CREATE TABLE IF NOT EXISTS payment_history (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  week_label VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  tenant_id VARCHAR(50) DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indecși pentru performanță
CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_weekly_processing_tenant_id ON weekly_processing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_balances_tenant_id ON company_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transport_orders_tenant_id ON transport_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_historical_trips_tenant_id ON historical_trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant_id ON payment_history(tenant_id);