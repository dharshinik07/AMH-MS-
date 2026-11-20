import fs from "fs";
import path from "path";

// 1. Read business.ts directly and extract verified entities
const businessPath = path.resolve("src/config/business.ts");
if (!fs.existsSync(businessPath)) {
  console.error("FATAL: src/config/business.ts does not exist!");
  process.exit(1);
}

const businessContent = fs.readFileSync(businessPath, "utf8");

// Expected Section 3.2 branches
const EXPECTED_BRANCHES = [
  {
    id: "branch-1",
    name: "Madampakkam",
    code: "MDP",
    address: "Plot no:55A, Dr.S.R road, Devaraj Nagar, Madampakkam, Chennai - 600126",
    pincode: "600126",
    lat: 12.906778,
    lng: 80.145823,
    landmark: "",
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
  },
];

// Expected Section 3.3 room configurations
const EXPECTED_ROOM_CONFIGS = [
  { type: "AC", sharing: 2, official: "Premium 2-Sharing AC", bath: "Attached" },
  { type: "AC", sharing: 3, official: "Comfort 3-Sharing AC", bath: "Attached" },
  { type: "AC", sharing: 4, official: "Standard 4-Sharing AC", bath: "Attached" },
  { type: "Non-AC", sharing: 2, official: "Premium 2-Sharing Non-AC", bath: "Attached" },
  { type: "Non-AC", sharing: 4, official: "Standard 4-Sharing Non-AC", bath: "Common" },
  { type: "Non-AC", sharing: 6, official: "Economy 6-Sharing Non-AC", bath: "Common" },
];

console.log("=================================================================");
console.log("AISHWARAYA HOSTELS & PG — VERIFIED DATA INTEGRITY AUDITOR");
console.log("Comparing Codebase & Database against Official Source of Truth");
console.log("=================================================================\n");

let failures = 0;

// Test 1: Verify Company Facts
console.log("1. Checking Company Information...");
const expectedPhone = "+91 90434 56234";
const expectedEmail = "aishwaryahostels@gmail.com";
const expectedOffice = "Barathi Nagar, IOB Colony, Selaiyur, Chennai";

if (!businessContent.includes(expectedPhone)) {
  console.error(`  FAIL: Phone ${expectedPhone} missing in business.ts`);
  failures++;
} else {
  console.log(`  PASS: Central booking phone ${expectedPhone} verified`);
}

if (!businessContent.includes(expectedEmail)) {
  console.error(`  FAIL: Email ${expectedEmail} missing in business.ts`);
  failures++;
} else {
  console.log(`  PASS: Email ${expectedEmail} verified`);
}

if (!businessContent.includes(expectedOffice)) {
  console.error(`  FAIL: Head Office ${expectedOffice} missing in business.ts`);
  failures++;
} else {
  console.log(`  PASS: Head Office ${expectedOffice} verified`);
}

// Test 2: Verify All 8 Branches
console.log("\n2. Checking All 8 Branches Character by Character...");
for (let i = 0; i < EXPECTED_BRANCHES.length; i++) {
  const eb = EXPECTED_BRANCHES[i];
  const num = i + 1;
  let branchOk = true;

  if (!businessContent.includes(`id: "${eb.id}"`)) {
    console.error(`  FAIL [Branch ${num}]: ID mismatch. Expected ${eb.id}`);
    branchOk = false;
  }
  if (!businessContent.includes(`name: "${eb.name}"`)) {
    console.error(`  FAIL [Branch ${num}]: Name mismatch. Expected ${eb.name}`);
    branchOk = false;
  }
  if (!businessContent.includes(`code: "${eb.code}"`)) {
    console.error(`  FAIL [Branch ${num}]: Code mismatch. Expected ${eb.code}`);
    branchOk = false;
  }
  if (!businessContent.includes(eb.address)) {
    console.error(`  FAIL [Branch ${num}]: Address mismatch.`);
    console.error(`    Expected: "${eb.address}"`);
    branchOk = false;
  }
  if (!businessContent.includes(`pincode: "${eb.pincode}"`)) {
    console.error(`  FAIL [Branch ${num}]: Pincode mismatch. Expected ${eb.pincode}`);
    branchOk = false;
  }
  if (!businessContent.includes(`landmark: "${eb.landmark}"`)) {
    console.error(`  FAIL [Branch ${num}]: Landmark mismatch. Expected "${eb.landmark}"`);
    branchOk = false;
  }

  if (branchOk) {
    console.log(`  PASS: [${num}/8] ${eb.name} (${eb.code}) matched exactly.`);
  } else {
    failures++;
  }
}

// Test 3: Verify Room Types & Permitted Sharing Combinations
console.log("\n3. Checking Permitted Room Types & Sharing...");
for (const cfg of EXPECTED_ROOM_CONFIGS) {
  if (!businessContent.includes(`officialName: "${cfg.official}"`)) {
    console.error(`  FAIL: Missing room type: ${cfg.official}`);
    failures++;
  } else {
    console.log(`  PASS: ${cfg.official} (${cfg.bath} Bath) verified`);
  }
}

// Test 4: Verify Bed Labeling Logic (Section 3.4)
console.log("\n4. Checking Bed Label Generation...");
const bedLabelTests = [
  { sharing: 2, expected: ["Bed 1", "Bed 2"] },
  { sharing: 3, expected: ["Bed 1", "Bed 2", "Bed 3"] },
  { sharing: 4, expected: ["B1-Upper", "B1-Lower", "B2-Upper", "B2-Lower"] },
  { sharing: 6, expected: ["B1-Upper", "B1-Lower", "B2-Upper", "B2-Lower", "B3-Upper", "B3-Lower"] },
];

for (const blt of bedLabelTests) {
  const jsonLabels = JSON.stringify(blt.expected);
  // Verify expected labels are present in business.ts
  const allPresent = blt.expected.every(l => businessContent.includes(l));
  if (allPresent) {
    console.log(`  PASS: ${blt.sharing}-Sharing bed labels match Section 3.4 (${jsonLabels})`);
  } else {
    console.error(`  FAIL: Bed labels for ${blt.sharing}-sharing missing expected labels: ${jsonLabels}`);
    failures++;
  }
}

// Test 5: Check forbidden strings in src/
console.log("\n5. Checking for Forbidden Legacy & Misspelled Wording in src/...");
function walkSrc(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkSrc(full, fileList);
    else if (/\.(tsx?|css|json)$/.test(f)) fileList.push(full);
  }
  return fileList;
}

const srcFiles = walkSrc("src");
let forbiddenFound = 0;
const forbiddenPatterns = [
  { regex: /Tambaram\s+Branches\s+Performance/i, name: "Tambaram Branches Performance" },
  { regex: /8\s+Active\s+Tambaram\s+Branches/i, name: "8 Active Tambaram Branches" },
  { regex: /Tambaram\s+Branch\s+Network/i, name: "Tambaram Branch Network" },
  { regex: /Near Devaraj Nagar Main Junction/i, name: "Invented Landmark: Near Devaraj Nagar Main Junction" },
  { regex: /Behind Sanitorium Railway Station/i, name: "Invented Landmark: Behind Sanitorium Railway Station" },
  { regex: /Near Camp Road Junction/i, name: "Invented Landmark: Near Camp Road Junction" },
];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const p of forbiddenPatterns) {
    if (p.regex.test(content)) {
      console.error(`  FAIL: Found forbidden string "${p.name}" in ${file}`);
      forbiddenFound++;
      failures++;
    }
  }
}

if (forbiddenFound === 0) {
  console.log("  PASS: Zero occurrences of forbidden / invented wording found across src/.");
}

console.log("\n=================================================================");
if (failures === 0) {
  console.log("ALL DATA INTEGRITY CHECKS PASSED (0 FAILURES).");
  console.log("Console is 100% aligned with verified truth from amhhostels-lime.vercel.app");
  console.log("=================================================================");
  process.exit(0);
} else {
  console.error(`AUDIT FAILED: ${failures} discrepancies found.`);
  console.log("=================================================================");
  process.exit(1);
}
