-- ============================================================================
-- AISHWARAYA HOSTELS & PG CONSOLE - COMPLETE DATABASE SETUP
-- Full schema for fresh Supabase database with ID + Password authentication.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'manager', 'warden');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('AC', 'Non-AC');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bed_status AS ENUM ('vacant', 'occupied', 'notice', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE resident_status AS ENUM ('active', 'notice', 'vacated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE food_plan AS ENUM ('Veg', 'Non-Veg', 'No food plan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('Cash', 'UPI', 'Bank', 'Card');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('paid', 'partial', 'pending', 'overdue');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. USERS TABLE (ID + Password Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    username_lower TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'warden',
    password_hash TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    uses_initial_password BOOLEAN NOT NULL DEFAULT true,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    assigned_branch_ids UUID[] DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(username_lower);

-- 3. BRANCHES TABLE (The 8 Verified Branches)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT NOT NULL DEFAULT '',
    pincode TEXT NOT NULL DEFAULT '600073',
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    phone TEXT NOT NULL DEFAULT '+91 90434 56234',
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed The 8 Official Branches
INSERT INTO branches (id, code, name, address, landmark, pincode, lat, lng, phone) VALUES
('b0000000-0000-0000-0000-000000000001', 'MDP', 'Madampakkam', 'Plot no:55A, Dr.S.R road, Devaraj Nagar, Madampakkam, Chennai - 600126', '', '600126', 12.906778, 80.145823, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000002', 'SAN', 'Sanitorium', 'Sanitorium railway station back side, Bharatha madha street, Tambaram Sanitorium, Chennai - 600047', '', '600047', 12.930821, 80.127613, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000003', 'ETB', 'East Tambaram', 'Door No.37/10 Old No.14, Valmiki Street, East Tambaram, Chennai 600059', '', '600059', 12.928632, 80.129902, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000004', 'WTB', 'West Tambaram', '10, Brindavan Ave, Rajaraththinam street, West Tambaram, Chennai 600045', '', '600045', 12.926587, 80.111066, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000005', 'SBN', 'Selaiyur (Bharathi Nagar)', 'No. 3, Avvai Street, Barathi Nagar, Selaiyur, Chennai - 600073', '', '600073', 12.920311, 80.141296, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000006', 'SIM', 'Selaiyur (IOB Colony Main Rd)', 'No:5A, 1st Main Road, IOB Colony, Camp Road, Selaiyur, Chennai - 600073', '', '600073', 12.920457, 80.142896, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000007', 'CRN', 'Camp Road (IOB Colony North Ext)', '7/3 SRS Twinkle Star Apartment, 1st Cross Street, Selaiyur, Chennai - 600073', '', '600073', 12.922105, 80.143520, '+91 90434 56234'),
('b0000000-0000-0000-0000-000000000008', 'SEM', 'Sembakkam (Arunagiri Nathar St)', 'No. 5, Arunagiri Nathar Street, Sembakkam, Chennai - 600073', '', '600073', 12.928945, 80.151240, '+91 90434 56234')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    landmark = EXCLUDED.landmark,
    pincode = EXCLUDED.pincode,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng;

-- 4. ROOM_TYPES TABLE (The 6 Allowed Room Types)
CREATE TABLE IF NOT EXISTS room_types (
    id TEXT PRIMARY KEY,
    room_type room_type NOT NULL,
    sharing INTEGER NOT NULL,
    official_name TEXT NOT NULL,
    alias TEXT NOT NULL,
    bed_layout TEXT NOT NULL,
    bathroom TEXT NOT NULL CHECK (bathroom IN ('Attached', 'Common')),
    inclusions TEXT[] NOT NULL DEFAULT '{}',
    needs_owner_confirmation BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO room_types (id, room_type, sharing, official_name, alias, bed_layout, bathroom, inclusions, needs_owner_confirmation) VALUES
('ac-2', 'AC', 2, 'Premium 2-Sharing AC', '2-Sharing Premium AC', '2 individual beds', 'Attached', ARRAY['Split AC', 'personal wooden wardrobe', 'study desk & chair', '5G Wi-Fi'], false),
('ac-3', 'AC', 3, 'Comfort 3-Sharing AC', '3-Sharing Comfort AC', '3 individual beds', 'Attached', ARRAY['Split AC', 'dedicated lockers', 'study corner', 'Wi-Fi'], false),
('ac-4', 'AC', 4, 'Standard 4-Sharing AC', '4-Sharing Standard AC', '2 bunk beds (Upper/Lower)', 'Attached', ARRAY['Split AC', 'personal steel lockers', 'common table', 'Wi-Fi'], true),
('non-ac-2', 'Non-AC', 2, 'Premium 2-Sharing Non-AC', '2-Sharing Deluxe Non-AC', '2 individual beds', 'Attached', ARRAY['Ceiling fans', 'natural ventilation', 'personal wardrobe', '5G Wi-Fi'], false),
('non-ac-4', 'Non-AC', 4, 'Standard 4-Sharing Non-AC', '4-Sharing Economy Non-AC', '2 bunk beds (Upper/Lower)', 'Common', ARRAY['Ceiling fans', 'individual secure lockers', 'daily housekeeping', '5G Wi-Fi'], false),
('non-ac-6', 'Non-AC', 6, 'Economy 6-Sharing Non-AC', '6-Sharing Budget Non-AC', '3 bunk beds (Upper/Lower)', 'Common', ARRAY['Ceiling fans', 'individual lockers', 'Wi-Fi'], false)
ON CONFLICT (id) DO UPDATE SET
    official_name = EXCLUDED.official_name,
    alias = EXCLUDED.alias,
    bed_layout = EXCLUDED.bed_layout,
    bathroom = EXCLUDED.bathroom,
    inclusions = EXCLUDED.inclusions;

-- 5. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    room_no TEXT NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    room_type room_type NOT NULL DEFAULT 'Non-AC',
    sharing_capacity INTEGER NOT NULL CHECK (sharing_capacity IN (2, 3, 4, 6)),
    monthly_rent_per_bed NUMERIC(10,2),
    attached_bath BOOLEAN NOT NULL DEFAULT true,
    room_type_id TEXT REFERENCES room_types(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, room_no),
    CONSTRAINT chk_valid_room_configuration CHECK (
        (room_type = 'AC' AND sharing_capacity IN (2, 3, 4)) OR
        (room_type = 'Non-AC' AND sharing_capacity IN (2, 4, 6))
    )
);

-- 6. BEDS TABLE
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_label TEXT NOT NULL,
    status bed_status NOT NULL DEFAULT 'vacant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, bed_label)
);

-- 7. RESIDENTS TABLE
CREATE TABLE IF NOT EXISTS residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    occupation TEXT NOT NULL DEFAULT 'working',
    college_or_company TEXT,
    aadhaar_last4 VARCHAR(4) CHECK (aadhaar_last4 ~ '^[0-9]{4}$' OR aadhaar_last4 IS NULL),
    food_plan food_plan NOT NULL DEFAULT 'Non-Veg',
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bed_id UUID REFERENCES beds(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    monthly_rent NUMERIC(10,2) NOT NULL,
    security_deposit NUMERIC(10,2) NOT NULL DEFAULT 4000.00,
    deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    rent_due_day INTEGER NOT NULL DEFAULT 5 CHECK (rent_due_day BETWEEN 1 AND 28),
    status resident_status NOT NULL DEFAULT 'active',
    notice_date DATE,
    vacated_date DATE,
    vacate_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);
CREATE INDEX IF NOT EXISTS idx_residents_phone ON residents(phone);

-- 8. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL,
    amount_due NUMERIC(10,2) NOT NULL,
    extra_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (resident_id, month)
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_no TEXT UNIQUE NOT NULL,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    mode payment_mode NOT NULL DEFAULT 'UPI',
    reference_no TEXT,
    paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. SEED DEFAULT OWNER ACCOUNT
INSERT INTO users (
    id,
    username,
    username_lower,
    email,
    full_name,
    phone,
    role,
    uses_initial_password,
    must_change_password,
    active
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Aishowner',
    'aishowner',
    'sundararajan@aishwaryahostels.com',
    'A. Sundararajan (Owner)',
    '+91 90434 56234',
    'owner',
    true,
    false,
    true
)
ON CONFLICT (username_lower) DO NOTHING;
