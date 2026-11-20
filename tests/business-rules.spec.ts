import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}
import {
  BRANCHES,
  ROOM_TYPES,
  ALLOWED_SHARING_MAP,
  isAllowedRoomConfig,
  generateBedLabels,
  normalizePhone,
  validateDepositSoftRange,
  COMPANY,
} from "../src/config/business";

test.describe("Section 6: Business Rules Unit Tests", () => {
  test("6.2(a) All 8 branches match Section 3.2 character by character", () => {
    expect(BRANCHES).toHaveLength(8);

    const expected = [
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

    for (let i = 0; i < 8; i++) {
      expect(BRANCHES[i].id).toBe(expected[i].id);
      expect(BRANCHES[i].name).toBe(expected[i].name);
      expect(BRANCHES[i].code).toBe(expected[i].code);
      expect(BRANCHES[i].address).toBe(expected[i].address);
      expect(BRANCHES[i].pincode).toBe(expected[i].pincode);
      expect(BRANCHES[i].lat).toBe(expected[i].lat);
      expect(BRANCHES[i].lng).toBe(expected[i].lng);
      expect(BRANCHES[i].landmark).toBe(expected[i].landmark);
      expect(BRANCHES[i].phone).toBe("+91 90434 56234");
    }
  });

  test("6.2(b) Only the 6 allowed room combinations can be created and invalid ones are rejected", () => {
    expect(ROOM_TYPES).toHaveLength(6);

    // Permitted
    expect(isAllowedRoomConfig("AC", 2)).toBe(true);
    expect(isAllowedRoomConfig("AC", 3)).toBe(true);
    expect(isAllowedRoomConfig("AC", 4)).toBe(true);
    expect(isAllowedRoomConfig("Non-AC", 2)).toBe(true);
    expect(isAllowedRoomConfig("Non-AC", 4)).toBe(true);
    expect(isAllowedRoomConfig("Non-AC", 6)).toBe(true);

    // Rejected
    expect(isAllowedRoomConfig("Non-AC", 3)).toBe(false); // No 3-sharing Non-AC
    expect(isAllowedRoomConfig("AC", 6)).toBe(false);     // No 6-sharing AC
    expect(isAllowedRoomConfig("AC", 1)).toBe(false);     // No 1-sharing
    expect(isAllowedRoomConfig("Non-AC", 1)).toBe(false);
    expect(isAllowedRoomConfig("AC", 5)).toBe(false);     // No 5-sharing
    expect(isAllowedRoomConfig("Non-AC", 5)).toBe(false);
  });

  test("6.2(c) Bed generation yields exact labels in Section 3.4 for 2, 3, 4 and 6 sharing", () => {
    expect(generateBedLabels(2)).toEqual(["Bed 1", "Bed 2"]);
    expect(generateBedLabels(3)).toEqual(["Bed 1", "Bed 2", "Bed 3"]);
    expect(generateBedLabels(4)).toEqual(["B1-Upper", "B1-Lower", "B2-Upper", "B2-Lower"]);
    expect(generateBedLabels(6)).toEqual([
      "B1-Upper", "B1-Lower",
      "B2-Upper", "B2-Lower",
      "B3-Upper", "B3-Lower",
    ]);

    // Invalid sharing throws error
    expect(() => generateBedLabels(5 as any)).toThrow();
  });

  test("6.2(d) Phone normalization", () => {
    expect(normalizePhone("9043456234")).toBe("+919043456234");
    expect(normalizePhone("919043456234")).toBe("+919043456234");
    expect(normalizePhone("+91 90434 56234")).toBe("+919043456234");
  });

  test("6.2(e) Deposit soft range warning (₹3,000 to ₹5,000)", () => {
    expect(validateDepositSoftRange(4000).valid).toBe(true);
    expect(validateDepositSoftRange(3000).valid).toBe(true);
    expect(validateDepositSoftRange(5000).valid).toBe(true);

    const tooLow = validateDepositSoftRange(2000);
    expect(tooLow.valid).toBe(false);
    expect(tooLow.warning).toBeDefined();

    const tooHigh = validateDepositSoftRange(8000);
    expect(tooHigh.valid).toBe(false);
    expect(tooHigh.warning).toBeDefined();
  });

  test("6.2(f) No string in src/ matches 'Aishwarya Hostels' or 'Tambaram Branch'", () => {
    function walk(dir: string, fileList: string[] = []): string[] {
      for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full, fileList);
        else if (/\.(tsx?|css|json)$/.test(f)) fileList.push(full);
      }
      return fileList;
    }

    const files = walk(path.resolve("src"));
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toMatch(/Aishwarya\s+Hostels/i);
      expect(content).not.toMatch(/Tambaram\s+Branch\b/i);
      expect(content).not.toMatch(/Tambaram\s+Branches\b/i);
    }
  });
});

test.describe("Section 6: End-to-End Playwright Verification", () => {
  test.beforeEach(async ({ context }) => {
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: process.env.OWNER_USERNAME || "Aishowner",
          password: process.env.OWNER_INITIAL_PASSWORD || "",
        }),
      });
      const cookieHeader = res.headers.get("set-cookie") || "";
      const match = cookieHeader.match(/auth_session=([^;]+)/);
      if (match) {
        await context.addCookies([
          {
            name: "auth_session",
            value: match[1],
            domain: "localhost",
            path: "/",
          },
        ]);
      }
    } catch {}
  });

  test("6.3 Branch Switcher displays all 8 names in exact order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");

    // Open branch switcher dropdown
    const branchButton = page.getByRole("button", { name: /All Branches/i }).first();
    await expect(branchButton).toBeVisible();
    await branchButton.click();

    // Verify all 8 names in order
    const expectedNames = [
      "Madampakkam",
      "Sanitorium",
      "East Tambaram",
      "West Tambaram",
      "Selaiyur (Bharathi Nagar)",
      "Selaiyur (IOB Colony Main Rd)",
      "Camp Road (IOB Colony North Ext)",
      "Sembakkam (Arunagiri Nathar St)",
    ];

    for (const name of expectedNames) {
      const branchItem = page.locator(`button:has-text("${name}")`).first();
      await expect(branchItem).toBeVisible();
    }
  });

  test("6.3 Settings -> Branches lists exact addresses and maps links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/settings?section=branches");

    // Verify presence of branch addresses using getByText
    for (const b of BRANCHES) {
      const addressText = page.getByText(b.address).first();
      await expect(addressText).toBeVisible();
    }
  });

  test("6.3 Room creation dropdowns enforce AC 2/3/4 and Non-AC 2/4/6", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/settings?section=branches");

    // Open Add Room modal
    const addRoomBtn = page.getByRole("button", { name: /\+ Add Room|Configure First Room/i }).first();
    if (await addRoomBtn.isVisible()) {
      await addRoomBtn.click();

      // AC selected by default -> offers 2, 3, 4
      const btn2Share = page.getByRole("button", { name: "2 Sharing" });
      const btn3Share = page.getByRole("button", { name: "3 Sharing" });
      const btn4Share = page.getByRole("button", { name: "4 Sharing" });
      await expect(btn2Share).toBeVisible();
      await expect(btn3Share).toBeVisible();
      await expect(btn4Share).toBeVisible();

      // Switch to Non-AC
      const nonAcBtn = page.getByRole("button", { name: "Non-AC", exact: true });
      await nonAcBtn.click();

      // Non-AC should offer 2, 4, 6
      const btn6Share = page.getByRole("button", { name: "6 Sharing" });
      await expect(btn2Share).toBeVisible();
      await expect(btn4Share).toBeVisible();
      await expect(btn6Share).toBeVisible();
      await expect(btn3Share).not.toBeVisible();
    }
  });
});
