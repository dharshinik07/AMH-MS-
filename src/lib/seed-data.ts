import { Branch, Room, Bed, Resident, Invoice, Payment, Device, User } from '@/types/hostel';
import { BRANCHES, generateBedLabels, getRoomTypeConfig, ROOM_TYPES, COMPANY } from '@/config/business';

export const INITIAL_BRANCHES: Branch[] = BRANCHES.map((b) => ({
  id: b.id,
  code: b.code,
  name: b.name,
  address: b.address,
  landmark: b.landmark,
  pincode: b.pincode,
  lat: b.lat,
  lng: b.lng,
  phone: b.phone,
  active: true,
}));

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'Aishowner',
    username_lower: 'aishowner',
    email: COMPANY.email,
    full_name: 'A. Sundararajan (Owner)',
    phone: COMPANY.phone,
    role: 'owner',
    uses_initial_password: true,
    must_change_password: false,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    active: true,
  },
  {
    id: 'usr-2',
    username: 'ramesh.warden',
    username_lower: 'ramesh.warden',
    email: 'warden.selaiyur@aishwaryahostels.com',
    full_name: 'M. Ramesh (Warden - Selaiyur)',
    phone: '+91 98401 23456',
    role: 'warden',
    uses_initial_password: false,
    must_change_password: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    assigned_branch_ids: ['branch-5', 'branch-6', 'branch-7'],
    active: true,
  },
  {
    id: 'usr-3',
    username: 'balaji.warden',
    username_lower: 'balaji.warden',
    email: 'warden.tambaram@aishwaryahostels.com',
    full_name: 'K. Balaji (Warden - Tambaram)',
    phone: '+91 97910 87654',
    role: 'warden',
    uses_initial_password: false,
    must_change_password: true,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    assigned_branch_ids: ['branch-2', 'branch-3', 'branch-4'],
    active: true,
  },
];

export const INITIAL_DEVICES: Device[] = [
  {
    id: 'dev-1',
    user_id: 'usr-1',
    device_token_hash: 'tok-hash-owner-phone',
    label: "Owner's Primary iPhone 15 Pro",
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    platform: 'iOS',
    last_ip: '106.213.88.14',
    city: 'Chennai (Tambaram)',
    status: 'active',
    first_seen: '2026-10-01T08:00:00Z',
    last_seen: '2026-11-20T11:15:00Z',
  },
  {
    id: 'dev-2',
    user_id: 'usr-1',
    device_token_hash: 'tok-hash-office-mac',
    label: 'Selaiyur Head Office iMac',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    platform: 'macOS',
    last_ip: '106.213.88.20',
    city: 'Chennai (Selaiyur)',
    status: 'active',
    first_seen: '2026-10-05T09:30:00Z',
    last_seen: '2026-11-20T10:45:00Z',
  },
  {
    id: 'dev-3',
    user_id: 'usr-2',
    device_token_hash: 'tok-hash-warden-tab',
    label: 'Tambaram Warden Samsung Tab S9',
    user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-X710)',
    platform: 'Android',
    last_ip: '49.207.214.55',
    city: 'Chennai (Camp Road)',
    status: 'active',
    first_seen: '2026-10-12T14:20:00Z',
    last_seen: '2026-11-20T11:28:00Z',
  },
];

// Helper to generate realistic demo rooms, beds, residents, invoices and payments
// ONLY invoked when NEXT_PUBLIC_ENABLE_DEMO=true or explicitly requested by user
export function generateDemoData() {
  const rooms: Room[] = [];
  const beds: Bed[] = [];
  const residents: Resident[] = [];
  const invoices: Invoice[] = [];
  const payments: Payment[] = [];

  const sampleNames = [
    'Karthik Subramanian', 'Vignesh Raghavan', 'Suresh Kumar', 'Praveen Chandran',
    'Arun Prasath', 'Dinesh Balasubramanian', 'Manoj Krishnan', 'Saravanan Natarajan',
    'Vijay Anand', 'Ashwin Venkatesh', 'Gowtham Raj', 'Hariharan Murali',
    'Deepak Selvam', 'Ranjith Senthil', 'Santhosh Pandian', 'Surya Narayanan',
    'Naveen Kumar', 'Sivakumar Rajendran', 'Manikandan V.', 'Ajith Kumar',
    'Thirumalai N.', 'Aravind Swaminathan', 'Yuvaraj Shanmugam', 'Kishore Varadhan',
    'Pradeep Raman', 'Balamurugan S.', 'Vijayakanth R.', 'Senthil Nathan'
  ];

  const companiesColleges = [
    'Zoho Corporation, Guduvanchery', 'Cognizant Technology Solutions, MEPZ',
    'Infosys, Mahindra City', 'Bharath University, Selaiyur',
    'Madras Christian College (MCC)', 'Accenture, Sholinganallur',
    'TCS, Siruseri', 'Ford Global Technology, Sholinganallur',
    'B.S. Abdur Rahman Crescent Institute', 'Standard Chartered GBS'
  ];

  let resIdx = 0;
  let invCounter = 100;
  let payCounter = 500;

  // The 6 verified room types from business.ts
  const allowedConfigs = [
    { type: 'AC' as const, sharing: 2 as const },
    { type: 'AC' as const, sharing: 3 as const },
    { type: 'AC' as const, sharing: 4 as const },
    { type: 'Non-AC' as const, sharing: 2 as const },
    { type: 'Non-AC' as const, sharing: 4 as const },
    { type: 'Non-AC' as const, sharing: 6 as const },
  ];

  INITIAL_BRANCHES.forEach((branch, bIdx) => {
    // 6 rooms per branch representing each of the 6 official configurations
    for (let r = 0; r < allowedConfigs.length; r++) {
      const cfgOption = allowedConfigs[r];
      const floor = r < 3 ? 1 : 2;
      const roomNum = `${floor}0${(r % 3) + 1}`;
      const cfg = getRoomTypeConfig(cfgOption.type, cfgOption.sharing)!;
      const roomId = `rm-${branch.code.toLowerCase()}-${roomNum}`;

      // In demo mode, sample rent rates
      const demoRent = cfg.roomType === 'AC' 
        ? (cfg.sharing === 2 ? 8500 : cfg.sharing === 3 ? 7500 : 6500)
        : (cfg.sharing === 2 ? 6000 : cfg.sharing === 4 ? 4800 : 4200);

      rooms.push({
        id: roomId,
        branch_id: branch.id,
        room_no: roomNum,
        floor,
        room_type: cfg.roomType,
        sharing_capacity: cfg.sharing,
        monthly_rent_per_bed: demoRent,
        attached_bath: cfg.bathroom === 'Attached',
        notes: `${cfg.officialName} · ${cfg.bedLayout}`,
        room_type_id: cfg.id,
      });

      // Generate bed labels automatically from business.ts
      const bedLabels = generateBedLabels(cfg.sharing);
      bedLabels.forEach((bunkLabel, b) => {
        const bedId = `bed-${roomId}-${b + 1}`;
        const dice = (bIdx * 7 + r * 5 + b * 3) % 10;
        let bedStatus: 'vacant' | 'occupied' | 'notice' = 'vacant';

        if (dice < 7) {
          bedStatus = 'occupied';
        } else if (dice === 7) {
          bedStatus = 'notice';
        } else {
          bedStatus = 'vacant';
        }

        beds.push({
          id: bedId,
          room_id: roomId,
          bed_label: bunkLabel,
          status: bedStatus,
        });

        if (bedStatus === 'occupied' || bedStatus === 'notice') {
          const name = sampleNames[resIdx % sampleNames.length];
          const company = companiesColleges[resIdx % companiesColleges.length];
          const isStudent = company.includes('College') || company.includes('University') || company.includes('Institute');
          const resId = `res-${branch.code.toLowerCase()}-${roomNum}-${b + 1}`;
          const joinMonthOffset = (resIdx % 6) + 1;
          const joinDate = `2026-0${Math.max(1, 11 - joinMonthOffset)}-05`;
          const currentMonth = '2026-11';
          const dueDay = 5;

          const isNotice = bedStatus === 'notice';
          const isPaid = dice % 3 === 0;
          const isPartial = dice === 2;
          const isOverdue = dice === 5;

          const foodOptions = ['Veg', 'Non-Veg', 'No food plan'] as const;
          const foodPlan = foodOptions[resIdx % foodOptions.length];

          const deposit = cfg.roomType === 'AC' ? 5000 : 3500;

          residents.push({
            id: resId,
            full_name: name,
            phone: `+91 ${9840000000 + (resIdx * 1373) % 9999999}`,
            alternate_phone: `+91 ${9710000000 + (resIdx * 921) % 9999999}`,
            parent_name: `${name.split(' ')[1] || 'S.'} Nathan`,
            parent_phone: `+91 ${9444000000 + (resIdx * 543) % 9999999}`,
            occupation: isStudent ? 'student' : 'working',
            college_or_company: company,
            aadhaar_last4: String(1000 + (resIdx * 37) % 9000),
            permanent_address: '12, North Car Street, Tirunelveli, Tamil Nadu',
            emergency_contact: COMPANY.phone,
            food_plan: foodPlan,
            join_date: joinDate,
            bed_id: bedId,
            branch_id: branch.id,
            monthly_rent: demoRent,
            security_deposit: deposit,
            deposit_paid: deposit,
            rent_due_day: dueDay,
            status: isNotice ? 'notice' : 'active',
            notice_date: isNotice ? '2026-11-10' : undefined,
            notes: isNotice ? 'Relocating to Coimbatore branch next month' : 'Prefers lower bunk, non-smoker',
          });

          // Invoice
          const invId = `inv-${invCounter++}`;
          let amountPaid = 0;
          let invStatus: 'paid' | 'partial' | 'pending' | 'overdue' = 'pending';

          if (isPaid) {
            amountPaid = demoRent;
            invStatus = 'paid';
          } else if (isPartial) {
            amountPaid = Math.floor(demoRent / 2);
            invStatus = 'partial';
          } else if (isOverdue) {
            amountPaid = 0;
            invStatus = 'overdue';
          } else {
            amountPaid = 0;
            invStatus = 'overdue';
          }

          invoices.push({
            id: invId,
            invoice_no: `INV-202611-${String(invCounter).padStart(4, '0')}`,
            resident_id: resId,
            branch_id: branch.id,
            month: currentMonth,
            amount_due: demoRent,
            extra_charges: 0,
            discount: 0,
            amount_paid: amountPaid,
            status: invStatus,
            due_date: `${currentMonth}-05`,
          });

          if (amountPaid > 0) {
            payments.push({
              id: `pay-${payCounter++}`,
              receipt_no: `RCP-2611-${String(payCounter).padStart(4, '0')}`,
              resident_id: resId,
              invoice_id: invId,
              amount: amountPaid,
              mode: resIdx % 2 === 0 ? 'UPI' : 'Cash',
              reference_no: resIdx % 2 === 0 ? `UPI-TXN-${990000 + payCounter}` : undefined,
              paid_on: '2026-11-04',
              received_by: 'usr-1',
              note: isPaid ? 'Full rent payment' : 'First installment, balance promised by 25th',
            });
          }

          resIdx++;
        }
      });
    }
  });

  return { rooms, beds, residents, invoices, payments };
}
