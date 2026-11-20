const table = [
  ["src/lib/seed-data.ts", "5", 'id: "br-1"', 'id: "branch-1" (up to branch-8)', "wrong"],
  ["src/lib/seed-data.ts", "9", 'landmark: "Near Devaraj Nagar Main Junction"', 'landmark: "" (no landmark published)', "invented"],
  ["src/lib/seed-data.ts", "21", 'landmark: "Behind Sanitorium Railway Station"', 'landmark: "" (no landmark published)', "invented"],
  ["src/lib/seed-data.ts", "44", "address missing Tambaram, Chennai, Tamil Nadu 600045", "10, Brindavan Ave, Rajaraththinam street, West Tambaram, Tambaram, Chennai, Tamil Nadu 600045", "wrong"],
  ["src/lib/seed-data.ts", "66", 'code: "SIO"', 'code: "SIM"', "wrong"],
  ["src/lib/seed-data.ts", "78", 'code: "CRP"', 'code: "CRN"', "wrong"],
  ["src/lib/seed-data.ts", "81", 'landmark: "Near Camp Road Junction"', 'landmark: "" (no landmark published)', "invented"],
  ["src/lib/seed-data.ts", "90", 'code: "SMB"', 'code: "SEM"', "wrong"],
  ["src/lib/seed-data.ts", "211", "Invented rents: 8500, 7500, 6500, 5500, 4800", 'Rent NOT PUBLISHED; owner-entered, null = "Rate not set"', "invented"],
  ["src/lib/seed-data.ts", "222", "attached_bath: true on all rooms", "Common bathroom for 4-sharing Non-AC and 6-sharing Non-AC", "wrong"],
  ["src/lib/seed-data.ts", "282", 'food_plan: "Veg" | "Non-Veg"', 'Choices: "Veg" | "Non-Veg" | "No food plan"', "inconsistent"],
  ["supabase/migrations/20261120000000_init_schema.sql", "15", "CREATE TYPE food_plan AS ENUM ('Veg', 'Non-Veg')", "CREATE TYPE food_plan AS ENUM ('Veg', 'Non-Veg', 'No food plan')", "missing"],
  ["supabase/migrations/20261120000000_init_schema.sql", "96", "CHECK (sharing_capacity IN (2, 3, 4, 6))", "CHECK ((room_type='AC' AND sharing IN (2,3,4)) OR (room_type='Non-AC' AND sharing IN (2,4,6)))", "missing"],
  ["supabase/migrations/20261120000000_init_schema.sql", "354-361", "Branch codes SIO, CRP, SMB & invented landmarks", "Codes SIM, CRN, SEM & exact landmarks / addresses from Section 3.2", "wrong"],
  ["src/types/hostel.ts", "6", "export type FoodPlan = 'Veg' | 'Non-Veg'", "export type FoodPlan = 'Veg' | 'Non-Veg' | 'No food plan'", "missing"],
  ["src/types/hostel.ts", "31", "monthly_rent_per_bed: number", "monthly_rent_per_bed: number | null", "wrong"],
  ["src/lib/utils.ts", "178", "Head Office: ... Selaiyur, Tambaram, Chennai", "Head Office: Barathi Nagar, IOB Colony, Selaiyur, Chennai", "wrong"],
  ["src/components/Dashboard.tsx", "119", "Tambaram Cluster Console • 8 Branches", "Aishwaraya Hostels & PG • 8 Branches", "inconsistent"],
  ["src/components/Dashboard.tsx", "394", "Tambaram Branches Performance", "Branch Performance", "wrong"],
  ["src/components/BranchSwitcher.tsx", "86", "Search 8 Tambaram branches...", "Search 8 branches...", "wrong"],
  ["src/components/BranchSwitcher.tsx", "115", "Tambaram Cluster", "All Locations", "wrong"],
  ["src/components/OutstandingReport.tsx", "176", "Average bed occupancy rate across all 8 Tambaram branches", "Average bed occupancy rate across all 8 branches", "wrong"],
  ["src/components/OutstandingReport.tsx", "217", "across Tambaram cluster", "across all 8 branches", "wrong"],
  ["src/components/OutstandingReport.tsx", "367", "Aishwaraya Hostels", "Aishwaraya Hostels & PG", "inconsistent"],
  ["src/components/ResidentsDirectory.tsx", "117", "across 8 Tambaram branches", "across 8 branches", "wrong"],
  ["src/components/ResidentsDirectory.tsx", "160", "Only Veg and Non-Veg filters", 'Add "No food plan" filter option', "missing"],
  ["src/components/SettingsScreen.tsx", "121", "Tambaram Branch Network (8 Locations)", "Branch Network (8 Locations)", "wrong"],
  ["src/components/SettingsScreen.tsx", "136", "Missing interactive maps, full address tooltip, and room setup flow", "Exact address, coordinates map link, call/whatsapp buttons, Setup Wizard", "missing"],
  ["src/components/AddResidentModal.tsx", "49", "Default monthlyRent = 6500", 'Default to bed rent or require entry if "Rate not set"', "invented"],
  ["src/components/AddResidentModal.tsx", "432", "Food plan only Veg / Non-Veg", "Food plan options: Veg, Non-Veg, No food plan", "missing"],
  ["src/components/AppShell.tsx", "98", "Real-time vacant beds across all 8 Tambaram branches", "Live vacant beds across all 8 branches", "wrong"],
  ["src/components/BedMap.tsx", "200", "Beds typed freely or hardcoded numbers", 'Follow 3.4 bed labeling; show "No rooms set up yet" when empty', "missing"],
  ["src/lib/store.tsx", "178", "Initializes invented demo data on first load unconditionally", "Only load demo data if NEXT_PUBLIC_ENABLE_DEMO=true; empty in prod", "invented"]
];

console.log("| File | Line | Current value | Correct value | Type |");
console.log("|---|---|---|---|---|");
for (const r of table) {
  console.log(`| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[4]} |`);
}
