-- Database Schema for DisasterBreadSystem Ver.3

-- 1. Master Products
CREATE TABLE m_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  specification TEXT,
  unit_cs_to_p INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  mfg_type TEXT
);

-- 2. Master Items
CREATE TABLE m_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  safety_stock NUMERIC NOT NULL,
  min_stock_level NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Master BOM
CREATE TABLE m_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES m_products(id),
  product_code TEXT NOT NULL,
  item_id UUID REFERENCES m_items(id),
  item_code TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  usage_rate NUMERIC,
  basis_unit TEXT,
  unit TEXT
);

-- 4. Master Destinations
CREATE TABLE m_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dest_code TEXT UNIQUE NOT NULL,
  dest_name TEXT NOT NULL,
  dest_type TEXT NOT NULL,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  contact_person TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  destination_code TEXT,
  destination_name TEXT
);

-- 5. Master Users
CREATE TABLE m_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 6. Transaction Orders
CREATE TABLE t_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  destination_code TEXT NOT NULL,
  request_delivery_date DATE NOT NULL,
  product_code TEXT NOT NULL,
  product_name_at_order TEXT NOT NULL,
  quantity_cs INTEGER NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT
);

-- 7. Transaction Manufacturing Plans
CREATE TABLE t_mfg_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_code TEXT UNIQUE NOT NULL,
  product_code TEXT NOT NULL,
  order_code TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  amount_kg NUMERIC NOT NULL,
  amount_cs INTEGER NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT
);

-- 8. Transaction Item Stocks
CREATE TABLE t_item_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  actual_stock NUMERIC NOT NULL,
  available_stock NUMERIC NOT NULL,
  stock_status TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Transaction Product Stocks
CREATE TABLE t_product_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  mfg_lot TEXT NOT NULL,
  stock_cs INTEGER NOT NULL,
  stock_p INTEGER NOT NULL,
  expiry_date DATE NOT NULL,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Transaction Receivings
CREATE TABLE t_receivings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiving_code TEXT UNIQUE NOT NULL,
  item_code TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  order_quantity NUMERIC NOT NULL,
  actual_quantity NUMERIC,
  status TEXT NOT NULL,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Transaction Stocktaking Logs
CREATE TABLE t_stocktaking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  before_stock NUMERIC NOT NULL,
  after_stock NUMERIC NOT NULL,
  difference NUMERIC,
  remarks TEXT,
  adjusted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
