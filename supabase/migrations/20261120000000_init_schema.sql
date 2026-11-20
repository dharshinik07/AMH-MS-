-- ============================================================================
-- AISHWARAYA HOSTELS & PG CONSOLE - DATABASE SCHEMA & MIGRATIONS
-- Production PostgreSQL / Supabase Schema with Row Level Security (RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'warden');
CREATE TYPE device_status AS ENUM ('active', 'pending', 'revoked');
CREATE TYPE room_type AS ENUM ('AC', 'Non-AC');
CREATE TYPE bed_status AS ENUM ('vacant', 'occupied', 'notice', 'maintenance');
CREATE TYPE resident_status AS ENUM ('active', 'notice', 'vacated');
CREATE TYPE food_plan AS ENUM ('Veg', 'Non-Veg');
CREATE TYPE payment_mode AS ENUM ('Cash', 'UPI', 'Bank', 'Card');
CREATE TYPE invoice_status AS ENUM ('paid', 'partial', 'pending', 'overdue');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'warden',
    pin_hash TEXT NOT NULL, -- 6-digit PIN hashed with bcrypt/argon2
    assigned_branch_ids UUID[] DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DEVICES TABLE (Strict 3-device lock)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_token_hash TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    user_agent TEXT,
    platform TEXT,
    last_ip TEXT,
    city TEXT DEFAULT 'Chennai',
    status device_status NOT NULL DEFAULT 'pending',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_token ON devices(device_token_hash);
CREATE INDEX idx_devices_status ON devices(status);

-- Constraint: Only maximum 3 active devices across the console
CREATE OR REPLACE FUNCTION check_active_device_limit()
RETURNS TRIGGER AS $$
DECLARE
    active_count INT;
BEGIN
    IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
        SELECT COUNT(*) INTO active_count FROM devices WHERE status = 'active';
        IF active_count >= 3 THEN
            RAISE EXCEPTION 'Maximum limit of 3 active devices reached. Must revoke an existing device first.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_device_limit
BEFORE INSERT OR UPDATE OF status ON devices
FOR EACH ROW
EXECUTE FUNCTION check_active_device_limit();

-- 4. BRANCHES TABLE (The 8 Real Tambaram Branches)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT NOT NULL,
    pincode TEXT NOT NULL DEFAULT '600073',
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    phone TEXT NOT NULL DEFAULT '+91 90434 56234',
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    room_no TEXT NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    room_type room_type NOT NULL DEFAULT 'Non-AC',
    sharing_capacity INTEGER NOT NULL CHECK (sharing_capacity IN (2, 3, 4, 6)),
    monthly_rent_per_bed NUMERIC(10,2) NOT NULL,
    attached_bath BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (branch_id, room_no)
);

-- 6. BEDS TABLE
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_label TEXT NOT NULL, -- e.g. "B1-Lower", "B1-Upper", "B2-Single"
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
    occupation TEXT NOT NULL DEFAULT 'working', -- 'student' | 'working'
    college_or_company TEXT,
    aadhaar_last4 VARCHAR(4) CHECK (aadhaar_last4 ~ '^[0-9]{4}$' OR aadhaar_last4 IS NULL),
    photo_url TEXT,
    id_proof_url TEXT,
    permanent_address TEXT,
    emergency_contact TEXT,
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

CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_residents_phone ON residents(phone);
CREATE INDEX idx_residents_bed ON residents(bed_id);

-- 8. INVOICES / RENT CYCLES TABLE
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no TEXT UNIQUE NOT NULL,
    resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    amount_due NUMERIC(10,2) NOT NULL,
    extra_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (resident_id, month)
);

CREATE INDEX idx_invoices_month ON invoices(month);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date);

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
    received_by UUID REFERENCES users(id),
    note TEXT,
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversal_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_resident ON payments(resident_id);
CREATE INDEX idx_payments_date ON payments(paid_on);

-- 10. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Electricity', 'Groceries', 'Maintenance', 'Water', 'Staff', 'Other'
    amount NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    device_id UUID REFERENCES devices(id),
    action TEXT NOT NULL, -- 'LOGIN', 'ADD_RESIDENT', 'VACATE', 'TRANSFER', 'RECORD_PAYMENT', 'REVERSE_PAYMENT', 'DEVICE_APPROVED'
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. FIFO PAYMENT SETTLEMENT FUNCTION
CREATE OR REPLACE FUNCTION settle_resident_payment_fifo(
    p_resident_id UUID,
    p_payment_amount NUMERIC(10,2),
    p_mode payment_mode,
    p_ref TEXT,
    p_user_id UUID,
    p_note TEXT
)
RETURNS UUID AS $$
DECLARE
    v_receipt_no TEXT;
    v_payment_id UUID;
    v_remaining NUMERIC(10,2) := p_payment_amount;
    v_inv RECORD;
    v_needed NUMERIC(10,2);
    v_allocated NUMERIC(10,2);
BEGIN
    v_receipt_no := 'RCP-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM()*10000)::TEXT, 4, '0');
    
    INSERT INTO payments (receipt_no, resident_id, amount, mode, reference_no, received_by, note)
    VALUES (v_receipt_no, p_resident_id, p_payment_amount, p_mode, p_ref, p_user_id, p_note)
    RETURNING id INTO v_payment_id;

    FOR v_inv IN 
        SELECT id, amount_due, extra_charges, discount, amount_paid,
               (amount_due + extra_charges - discount - amount_paid) AS balance
        FROM invoices
        WHERE resident_id = p_resident_id AND status != 'paid'
        ORDER BY due_date ASC
    LOOP
        EXIT WHEN v_remaining <= 0;
        
        v_needed := v_inv.balance;
        IF v_remaining >= v_needed THEN
            v_allocated := v_needed;
            v_remaining := v_remaining - v_needed;
            UPDATE invoices
            SET amount_paid = amount_paid + v_allocated,
                status = 'paid',
                updated_at = NOW()
            WHERE id = v_inv.id;
        ELSE
            v_allocated := v_remaining;
            v_remaining := 0;
            UPDATE invoices
            SET amount_paid = amount_paid + v_allocated,
                status = 'partial',
                updated_at = NOW()
            WHERE id = v_inv.id;
        END IF;
    END LOOP;

    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- 13. PRORATION & AUTO-INVOICING FUNCTION (1st of month)
CREATE OR REPLACE FUNCTION generate_monthly_invoices(p_month VARCHAR(7))
RETURNS INT AS $$
DECLARE
    r RECORD;
    v_count INT := 0;
    v_due_date DATE;
    v_invoice_no TEXT;
BEGIN
    FOR r IN 
        SELECT id, branch_id, monthly_rent, rent_due_day, join_date
        FROM residents
        WHERE status IN ('active', 'notice')
    LOOP
        -- Due date in target month
        v_due_date := TO_DATE(p_month || '-' || LPAD(r.rent_due_day::TEXT, 2, '0'), 'YYYY-MM-DD');
        v_invoice_no := 'INV-' || REPLACE(p_month, '-', '') || '-' || SUBSTRING(r.id::TEXT, 1, 6);

        INSERT INTO invoices (invoice_no, resident_id, branch_id, month, amount_due, due_date)
        VALUES (v_invoice_no, r.id, r.branch_id, p_month, r.monthly_rent, v_due_date)
        ON CONFLICT (resident_id, month) DO NOTHING;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Device authorization helper for RLS
CREATE OR REPLACE FUNCTION is_device_active(p_token_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM devices 
        WHERE device_token_hash = p_token_hash AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for authenticated active staff
CREATE POLICY p_active_device_all_branches ON branches
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_rooms ON rooms
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_beds ON beds
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_residents ON residents
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_invoices ON invoices
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_payments ON payments
    FOR ALL USING (true);

CREATE POLICY p_active_device_all_expenses ON expenses
    FOR ALL USING (true);

-- 15. SEED DATA FOR THE 8 REAL TAMBARAM BRANCHES
INSERT INTO branches (code, name, address, landmark, pincode, lat, lng, phone) VALUES
('MDP', 'Madampakkam', 'Plot no:55A, Dr.S.R road, Devaraj Nagar, Madampakkam, Chennai - 600126', 'Near Devaraj Nagar Main Junction', '600126', 12.906778, 80.145823, '+91 90434 56234'),
('SAN', 'Sanitorium', 'Sanitorium railway station back side, Bharatha madha street, Tambaram Sanitorium, Chennai - 600047', 'Behind Sanitorium Railway Station', '600047', 12.930821, 80.127613, '+91 90434 56234'),
('ETB', 'East Tambaram', 'Door No.37/10 Old No.14, Previous Old No.1, Valmiki Street, East Tambaram, Chennai 600059', 'Near Madras Christian College (MCC)', '600059', 12.928632, 80.129902, '+91 90434 56234'),
('WTB', 'West Tambaram', '10, Brindavan Ave, Rajaraththinam street, West Tambaram, Chennai 600045', 'Near Vidhya Theater & Railway Station', '600045', 12.926587, 80.111066, '+91 90434 56234'),
('SBN', 'Selaiyur (Bharathi Nagar)', 'No. 3, Avvai Street, Barathi Nagar, Selaiyur, Chennai - 600073', 'Near Viveks Showroom & Bharath University', '600073', 12.920311, 80.141296, '+91 90434 56234'),
('SIO', 'Selaiyur (IOB Colony Main Rd)', 'No:5A, 1st Main Road, IOB Colony, Camp Road, Selaiyur, Chennai - 600073', 'Near Bethesda Hospital', '600073', 12.920457, 80.142896, '+91 90434 56234'),
('CRP', 'Camp Road (IOB Colony North Ext)', '7/3 SRS Twinkle Star Apartment, 1st Cross Street, IOB Colony North Extension, Selaiyur, Camp Road, Chennai - 600073', 'Near Camp Road Junction', '600073', 12.922105, 80.143520, '+91 90434 56234'),
('SMB', 'Sembakkam (Arunagiri Nathar St)', 'No. 5, Arunagiri Nathar Street, Sembakkam, Chennai - 600073', 'Near Velachery Main Road', '600073', 12.928945, 80.151240, '+91 90434 56234')
ON CONFLICT (code) DO NOTHING;

-- Initial Owner User (PIN: 123456)
INSERT INTO users (email, full_name, phone, role, pin_hash) VALUES
('owner@aishwaryahostels.com', 'Aishwaraya Owner', '+91 90434 56234', 'owner', '$2a$10$wN31c77fK47k7P6q3uVjbeDk8K8L1K.8.d1.670W945bC3hF10i1G')
ON CONFLICT (email) DO NOTHING;
