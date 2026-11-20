/**
 * AISHWARAYA HOSTELS & PG — VERIFIED SOURCE OF TRUTH
 * Sourced directly from official website: https://amhhostels-lime.vercel.app/
 * (Pages: /, /rooms, /branches, /facilities, /mens-hostel)
 * 
 * Strict Single-Source-Of-Truth: No duplicate hard-coded facts anywhere else.
 */

export const COMPANY = {
  name: "Aishwaraya Hostels & PG",
  shortName: "Aishwaraya",
  logoText: "Aishwaraya",
  logoSubtext: "Hostels & PG",
  consoleTag: "Hostels Console",
  segment: "Mens PG only",
  womensSegmentStatus: "Coming Soon / Priority Waitlist",
  phone: "+91 90434 56234",
  phoneRaw: "9043456234",
  phoneLink: "tel:+919043456234",
  whatsappUrl: "https://wa.me/919043456234",
  email: "aishwaryahostels@gmail.com",
  instagram: "@Aishwarya_Hostels",
  headOffice: "Barathi Nagar, IOB Colony, Selaiyur, Chennai",
  headOfficeFull: "W4CV+83H, Avvai Street, Barathi Nagar, IOB Colony, Selaiyur, Chennai, TN 600073",
  officeHours: "Mon - Sun: 9:00 AM - 9:00 PM",
  amenities: [
    "3-time homely South Indian meals (Breakfast, Lunch, Dinner)",
    "Veg and Non-Veg available",
    "5G Wi-Fi",
    "24/7 CCTV",
    "Biometric access",
    "Covered 2-wheeler parking",
    "Daily housekeeping",
    "Washing machines",
    "Inverter backup",
    "RO water",
  ],
} as const;

export interface BranchConfig {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly address: string;
  readonly pincode: string;
  readonly lat: number;
  readonly lng: number;
  readonly landmark: string;
  readonly mapLink: string;
  readonly phone: string;
}

export const BRANCHES: readonly BranchConfig[] = [
  {
    id: "branch-1",
    name: "Madampakkam",
    code: "MDP",
    address: "Plot no:55A, Dr.S.R road, Devaraj Nagar, Madampakkam, Chennai - 600126",
    pincode: "600126",
    lat: 12.906778,
    lng: 80.145823,
    landmark: "",
    mapLink: "https://maps.google.com/?q=12.906778,80.145823",
    phone: COMPANY.phone,
  },
  {
    id: "branch-2",
    name: "Sanitorium",
    code: "SAN",
    address: "Sanitorium railway station back side, Bharatha madha street, Tambaram Sanitorium, Chennai - 600047",
    pincode: "600047",
    lat: 12.930821,
    lng: 80.127613,
    landmark: "",
    mapLink: "https://maps.google.com/?q=12.930821,80.127613",
    phone: COMPANY.phone,
  },
  {
    id: "branch-3",
    name: "East Tambaram",
    code: "ETB",
    address: "Door No.37/10 Old No.14, Previous Old No.1, Valmiki Street, East Tambaram, Chennai 600059",
    pincode: "600059",
    lat: 12.928632,
    lng: 80.129902,
    landmark: "Near MCC College",
    mapLink: "https://maps.google.com/?q=12.928632,80.129902",
    phone: COMPANY.phone,
  },
  {
    id: "branch-4",
    name: "West Tambaram",
    code: "WTB",
    address: "10, Brindavan Ave, Rajaraththinam street, West Tambaram, Tambaram, Chennai, Tamil Nadu 600045",
    pincode: "600045",
    lat: 12.926587,
    lng: 80.111066,
    landmark: "Near Vidhya Theater & Railway Station",
    mapLink: "https://maps.google.com/?q=12.926587,80.111066",
    phone: COMPANY.phone,
  },
  {
    id: "branch-5",
    name: "Selaiyur (Bharathi Nagar)",
    code: "SBN",
    address: "No. 3, Avvai Street, Barathi Nagar, Selaiyur, Chennai - 600073",
    pincode: "600073",
    lat: 12.920311,
    lng: 80.141296,
    landmark: "Near Viveks Showroom & Bharath University",
    mapLink: "https://maps.google.com/?q=12.920311,80.141296",
    phone: COMPANY.phone,
  },
  {
    id: "branch-6",
    name: "Selaiyur (IOB Colony Main Rd)",
    code: "SIM",
    address: "No:5A, 1st Main Road, IOB Colony, Camp Road, Selaiyur, Chennai - 600073",
    pincode: "600073",
    lat: 12.920457,
    lng: 80.142896,
    landmark: "Near Bethesda Hospital",
    mapLink: "https://maps.google.com/?q=12.920457,80.142896",
    phone: COMPANY.phone,
  },
  {
    id: "branch-7",
    name: "Camp Road (IOB Colony North Ext)",
    code: "CRN",
    address: "7/3 SRS Twinkle Star Apartment, 1st Cross Street, IOB Colony North Extension, Selaiyur, Camp Road, Chennai - 600073",
    pincode: "600073",
    lat: 12.922105,
    lng: 80.14352,
    landmark: "",
    mapLink: "https://maps.google.com/?q=12.922105,80.14352",
    phone: COMPANY.phone,
  },
  {
    id: "branch-8",
    name: "Sembakkam (Arunagiri Nathar St)",
    code: "SEM",
    address: "No. 5, Arunagiri Nathar Street, Sembakkam, Chennai - 600073",
    pincode: "600073",
    lat: 12.928945,
    lng: 80.15124,
    landmark: "Near Velachery Main Road",
    mapLink: "https://maps.google.com/?q=12.928945,80.15124",
    phone: COMPANY.phone,
  },
] as const;

export type BranchId = typeof BRANCHES[number]["id"];
export type BranchCode = typeof BRANCHES[number]["code"];

export const ALLOWED_PINCODES = [
  "600126",
  "600047",
  "600059",
  "600045",
  "600073",
] as const;

export interface RoomTypeConfig {
  readonly id: string;
  readonly roomType: "AC" | "Non-AC";
  readonly sharing: 2 | 3 | 4 | 6;
  readonly officialName: string;
  readonly alias: string;
  readonly bedLayout: string;
  readonly bathroom: "Attached" | "Common";
  readonly inclusions: readonly string[];
  readonly needsOwnerConfirmation?: boolean;
}

export const ROOM_TYPES: readonly RoomTypeConfig[] = [
  {
    id: "ac-2",
    roomType: "AC",
    sharing: 2,
    officialName: "Premium 2-Sharing AC",
    alias: "2-Sharing Premium AC",
    bedLayout: "2 individual beds",
    bathroom: "Attached",
    inclusions: [
      "Split AC",
      "personal wooden wardrobe",
      "study desk & chair",
      "5G Wi-Fi",
    ],
  },
  {
    id: "ac-3",
    roomType: "AC",
    sharing: 3,
    officialName: "Comfort 3-Sharing AC",
    alias: "3-Sharing Comfort AC",
    bedLayout: "3 individual beds",
    bathroom: "Attached",
    inclusions: [
      "Split AC",
      "dedicated lockers",
      "study corner",
      "Wi-Fi",
    ],
  },
  {
    id: "ac-4",
    roomType: "AC",
    sharing: 4,
    officialName: "Standard 4-Sharing AC",
    alias: "4-Sharing Standard AC",
    bedLayout: "2 bunk beds (Upper/Lower)",
    bathroom: "Attached",
    inclusions: [
      "Split AC",
      "personal steel lockers",
      "common table",
      "Wi-Fi",
    ],
    needsOwnerConfirmation: true, // bathroom is "Attached" on /rooms and "Attached/Adjacent" on homepage
  },
  {
    id: "non-ac-2",
    roomType: "Non-AC",
    sharing: 2,
    officialName: "Premium 2-Sharing Non-AC",
    alias: "2-Sharing Deluxe Non-AC",
    bedLayout: "2 individual beds",
    bathroom: "Attached",
    inclusions: [
      "Ceiling fans",
      "natural ventilation",
      "personal wardrobe",
      "5G Wi-Fi",
    ],
  },
  {
    id: "non-ac-4",
    roomType: "Non-AC",
    sharing: 4,
    officialName: "Standard 4-Sharing Non-AC",
    alias: "4-Sharing Economy Non-AC",
    bedLayout: "2 bunk beds (Upper/Lower)",
    bathroom: "Common",
    inclusions: [
      "Ceiling fans",
      "individual secure lockers",
      "daily housekeeping",
      "5G Wi-Fi",
    ],
  },
  {
    id: "non-ac-6",
    roomType: "Non-AC",
    sharing: 6,
    officialName: "Economy 6-Sharing Non-AC",
    alias: "6-Sharing Budget Non-AC",
    bedLayout: "3 bunk beds (Upper/Lower)",
    bathroom: "Common",
    inclusions: [
      "Ceiling fans",
      "individual lockers",
      "Wi-Fi",
    ],
  },
] as const;

export type RoomTypeId = typeof ROOM_TYPES[number]["id"];

/**
 * The ONLY allowed roomType and sharing combinations.
 * AC: 2, 3, 4
 * Non-AC: 2, 4, 6
 */
export const ALLOWED_SHARING_MAP = {
  AC: [2, 3, 4] as const,
  "Non-AC": [2, 4, 6] as const,
} as const;

export function isAllowedRoomConfig(roomType: "AC" | "Non-AC", sharing: number): boolean {
  if (roomType === "AC") {
    return sharing === 2 || sharing === 3 || sharing === 4;
  }
  if (roomType === "Non-AC") {
    return sharing === 2 || sharing === 4 || sharing === 6;
  }
  return false;
}

export function getRoomTypeConfig(roomType: "AC" | "Non-AC", sharing: number): RoomTypeConfig | undefined {
  return ROOM_TYPES.find((rt) => rt.roomType === roomType && rt.sharing === sharing);
}

/**
 * Bed labels according to Section 3.4
 * - 2-Sharing and 3-Sharing: Bed 1, Bed 2, (Bed 3).
 * - 4-Sharing: B1-Upper, B1-Lower, B2-Upper, B2-Lower.
 * - 6-Sharing: B1-Upper, B1-Lower, B2-Upper, B2-Lower, B3-Upper, B3-Lower.
 */
export function generateBedLabels(sharing: 2 | 3 | 4 | 6): string[] {
  if (sharing === 2) return ["Bed 1", "Bed 2"];
  if (sharing === 3) return ["Bed 1", "Bed 2", "Bed 3"];
  if (sharing === 4) return ["B1-Upper", "B1-Lower", "B2-Upper", "B2-Lower"];
  if (sharing === 6) {
    return [
      "B1-Upper", "B1-Lower",
      "B2-Upper", "B2-Lower",
      "B3-Upper", "B3-Lower",
    ];
  }
  throw new Error(`Invalid sharing count: ${sharing}. Allowed: 2, 3, 4, 6.`);
}

export const COMMERCIAL_RULES = {
  deposit: {
    min: 3000,
    max: 5000,
    noticeDays: 30,
    refundableNote: "Fully refundable when vacating with 30 days prior notice",
  },
  foodPlans: ["Veg", "Non-Veg", "No food plan"] as const,
  rent: {
    published: false,
    label: "Direct Rates",
    notSetLabel: "Rate not set",
  },
  brokerage: "No Hidden Brokerage",
} as const;

export type FoodPlanOption = typeof COMMERCIAL_RULES.foodPlans[number];

/**
 * Format official room label for cards, receipts, and listings:
 * e.g. "Standard 4-Sharing AC · B2-Upper · Selaiyur (Bharathi Nagar)"
 */
export function formatOfficialBedTitle(params: {
  roomType: "AC" | "Non-AC";
  sharing: 2 | 3 | 4 | 6;
  bedLabel: string;
  branchName?: string;
}): string {
  const cfg = getRoomTypeConfig(params.roomType, params.sharing);
  const typeName = cfg ? cfg.officialName : `${params.sharing}-Sharing ${params.roomType}`;
  const parts = [typeName, params.bedLabel];
  if (params.branchName) parts.push(params.branchName);
  return parts.join(" · ");
}

/**
 * Normalizes any Indian 10-digit phone to +91XXXXXXXXXX
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`;
  }
  return raw.trim();
}

/**
 * Soft range validation for deposit: warns if outside 3,000 to 5,000
 */
export function validateDepositSoftRange(amount: number): { valid: boolean; warning?: string } {
  if (amount < COMMERCIAL_RULES.deposit.min || amount > COMMERCIAL_RULES.deposit.max) {
    return {
      valid: false,
      warning: `Security deposit is typically ₹3,000 to ₹5,000 per official website guidelines. Current: ₹${amount.toLocaleString("en-IN")}.`,
    };
  }
  return { valid: true };
}
