-- ============================================================================
-- AISHWARAYA HOSTELS & PG CONSOLE - DATABASE MIGRATION: BUSINESS DATA ALIGNMENT
-- Corrects existing rows in place without deleting residents, payments, or history.
-- Aligns schema and constraints strictly with official website verified truth.
-- ============================================================================

-- 1. UPDATE FOOD_PLAN ENUM TO INCLUDE 'No food plan'
ALTER TYPE food_plan ADD VALUE IF NOT EXISTS 'No food plan';

-- 2. CREATE ROOM_TYPES TABLE (Section 3.3)
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

-- Seed the exact 6 allowed room types
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
    inclusions = EXCLUDED.inclusions,
    needs_owner_confirmation = EXCLUDED.needs_owner_confirmation;

-- 3. UPDATE ROOMS CONSTRAINTS & FOREIGN KEY
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type_id TEXT REFERENCES room_types(id);
ALTER TABLE rooms ALTER COLUMN monthly_rent_per_bed DROP NOT NULL;

-- Ensure (room_type, sharing_capacity) is strictly one of the 6 allowed combinations
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS chk_valid_room_configuration;
ALTER TABLE rooms ADD CONSTRAINT chk_valid_room_configuration CHECK (
    (room_type = 'AC' AND sharing_capacity IN (2, 3, 4)) OR
    (room_type = 'Non-AC' AND sharing_capacity IN (2, 4, 6))
);

-- 4. BED COUNT TRIGGER: Ensure count(beds in room) = room.sharing_capacity
CREATE OR REPLACE FUNCTION check_room_bed_capacity_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_count INT;
BEGIN
    SELECT sharing_capacity INTO v_capacity FROM rooms WHERE id = NEW.room_id;
    SELECT COUNT(*) INTO v_count FROM beds WHERE room_id = NEW.room_id;
    
    IF v_count > v_capacity THEN
        RAISE EXCEPTION 'Cannot exceed room sharing capacity of % beds for room %', v_capacity, NEW.room_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_room_bed_capacity ON beds;
CREATE TRIGGER trg_enforce_room_bed_capacity
AFTER INSERT ON beds
FOR EACH ROW
EXECUTE FUNCTION check_room_bed_capacity_trigger();

-- 5. SEED / UPDATE THE 8 REAL BRANCHES (In-place update without dropping rows)
-- Exact addresses, order 1-8, codes, coordinates, and central phone +91 90434 56234
INSERT INTO branches (id, code, name, address, landmark, pincode, lat, lng, phone, active) VALUES
('branch-1', 'MDP', 'Madampakkam', 'Plot no:55A, Dr.S.R road, Devaraj Nagar, Madampakkam, Chennai - 600126', '', '600126', 12.906778, 80.145823, '+91 90434 56234', true),
('branch-2', 'SAN', 'Sanitorium', 'Sanitorium railway station back side, Bharatha madha street, Tambaram Sanitorium, Chennai - 600047', '', '600047', 12.930821, 80.127613, '+91 90434 56234', true),
('branch-3', 'ETB', 'East Tambaram', 'Door No.37/10 Old No.14, Previous Old No.1, Valmiki Street, East Tambaram, Chennai 600059', 'Near MCC College', '600059', 12.928632, 80.129902, '+91 90434 56234', true),
('branch-4', 'WTB', 'West Tambaram', '10, Brindavan Ave, Rajaraththinam street, West Tambaram, Tambaram, Chennai, Tamil Nadu 600045', 'Near Vidhya Theater & Railway Station', '600045', 12.926587, 80.111066, '+91 90434 56234', true),
('branch-5', 'SBN', 'Selaiyur (Bharathi Nagar)', 'No. 3, Avvai Street, Barathi Nagar, Selaiyur, Chennai - 600073', 'Near Viveks Showroom & Bharath University', '600073', 12.920311, 80.141296, '+91 90434 56234', true),
('branch-6', 'SIM', 'Selaiyur (IOB Colony Main Rd)', 'No:5A, 1st Main Road, IOB Colony, Camp Road, Selaiyur, Chennai - 600073', 'Near Bethesda Hospital', '600073', 12.920457, 80.142896, '+91 90434 56234', true),
('branch-7', 'CRN', 'Camp Road (IOB Colony North Ext)', '7/3 SRS Twinkle Star Apartment, 1st Cross Street, IOB Colony North Extension, Selaiyur, Camp Road, Chennai - 600073', '', '600073', 12.922105, 80.143520, '+91 90434 56234', true),
('branch-8', 'SEM', 'Sembakkam (Arunagiri Nathar St)', 'No. 5, Arunagiri Nathar Street, Sembakkam, Chennai - 600073', 'Near Velachery Main Road', '600073', 12.928945, 80.151240, '+91 90434 56234', true)
ON CONFLICT (code) DO UPDATE SET
    id = EXCLUDED.id,
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    landmark = EXCLUDED.landmark,
    pincode = EXCLUDED.pincode,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    phone = EXCLUDED.phone,
    active = EXCLUDED.active;
