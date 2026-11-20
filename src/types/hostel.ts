export type UserRole = 'owner' | 'manager' | 'warden';
export type DeviceStatus = 'active' | 'pending' | 'revoked';
export type RoomType = 'AC' | 'Non-AC';
export type BedStatus = 'vacant' | 'occupied' | 'notice' | 'maintenance';
export type ResidentStatus = 'active' | 'notice' | 'vacated';
export type FoodPlan = 'Veg' | 'Non-Veg' | 'No food plan';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank' | 'Card';
export type InvoiceStatus = 'paid' | 'partial' | 'pending' | 'overdue';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  landmark: string;
  pincode: string;
  lat: number;
  lng: number;
  phone: string;
  manager_id?: string;
  active: boolean;
}

export interface Room {
  id: string;
  branch_id: string;
  room_no: string;
  floor: number;
  room_type: RoomType;
  sharing_capacity: 2 | 3 | 4 | 6;
  monthly_rent_per_bed: number | null;
  attached_bath: boolean;
  notes?: string;
  room_type_id?: string;
}

export interface Bed {
  id: string;
  room_id: string;
  bed_label: string; // e.g. "B1-Lower", "B1-Upper", "B2-Single"
  status: BedStatus;
}

export interface Resident {
  id: string;
  full_name: string;
  phone: string;
  alternate_phone?: string;
  parent_name?: string;
  parent_phone?: string;
  occupation: 'student' | 'working';
  college_or_company?: string;
  aadhaar_last4?: string;
  photo_url?: string;
  id_proof_url?: string;
  permanent_address?: string;
  emergency_contact?: string;
  food_plan: FoodPlan;
  join_date: string; // YYYY-MM-DD
  bed_id?: string;
  branch_id?: string;
  monthly_rent: number;
  security_deposit: number;
  deposit_paid: number;
  rent_due_day: number; // 1 to 28
  status: ResidentStatus;
  notice_date?: string;
  vacated_date?: string;
  vacate_reason?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  resident_id: string;
  branch_id: string;
  month: string; // YYYY-MM
  amount_due: number;
  extra_charges: number;
  discount: number;
  amount_paid: number;
  status: InvoiceStatus;
  due_date: string; // YYYY-MM-DD
  notes?: string;
}

export interface Payment {
  id: string;
  receipt_no: string;
  resident_id: string;
  invoice_id?: string;
  amount: number;
  mode: PaymentMode;
  reference_no?: string;
  paid_on: string; // YYYY-MM-DD
  received_by?: string;
  note?: string;
  is_reversed?: boolean;
  reversal_reason?: string;
}

export interface Expense {
  id: string;
  branch_id: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
  created_by?: string;
}

export interface Device {
  id: string;
  user_id?: string;
  device_token_hash: string;
  label: string;
  user_agent?: string;
  platform?: string;
  last_ip?: string;
  city?: string;
  status: DeviceStatus;
  first_seen: string;
  last_seen: string;
}

export interface User {
  id: string;
  username: string;
  username_lower: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  password_hash?: string;
  must_change_password?: boolean;
  uses_initial_password?: boolean;
  failed_attempts?: number;
  locked_until?: string | null;
  last_login_at?: string | null;
  assigned_branch_ids?: string[];
  active: boolean;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  device_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_value?: unknown;
  new_value?: unknown;
  created_at: string;
}

export interface VacateSettlement {
  resident_id: string;
  resident_name: string;
  room_no: string;
  bed_label: string;
  branch_name: string;
  join_date: string;
  vacate_date: string;
  deposit_paid: number;
  pending_rent: number;
  prorated_rent: number;
  damages_charges: number;
  extra_charges: number;
  net_payable: number; // >0 means resident pays, <0 means refund to resident
  refund_amount: number;
  resident_balance_due: number;
  reason?: string;
}
