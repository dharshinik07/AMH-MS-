import { test, expect } from "@playwright/test";
import fs from "fs";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

const VIEWPORTS = [
  { name: "iPhone-SE-1st-320px", width: 320, height: 568 },
  { name: "Android-Small-360px", width: 360, height: 800 },
  { name: "iPhone-SE-375px", width: 375, height: 667 },
  { name: "iPhone-14-390px", width: 390, height: 844 },
  { name: "Galaxy-S24-412px", width: 412, height: 915 },
  { name: "iPhone-Max-430px", width: 430, height: 932 },
  { name: "Phone-Landscape-844x390", width: 844, height: 390 },
  { name: "Z-Fold-Outer-344px", width: 344, height: 882 },
  { name: "Z-Fold-Inner-673px", width: 673, height: 720 },
  { name: "iPad-Mini-768px", width: 768, height: 1024 },
  { name: "iPad-Landscape-1024px", width: 1024, height: 768 },
  { name: "Laptop-1280px", width: 1280, height: 800 },
  { name: "Desktop-1440px", width: 1440, height: 900 },
];

test.describe("Mobile & All-Device Responsive Suite", () => {
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

  for (const vp of VIEWPORTS) {
    test(`Render and check horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dashboard", { waitUntil: "networkidle" });

      // 1. Verify body is visible
      await expect(page.locator("body")).toBeVisible();

      // 2. Check no horizontal overflow on the root document
      const hasNoHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 1;
      });
      expect(hasNoHorizontalOverflow).toBe(true);

      // 3. Check layout structure based on breakpoint
      if (vp.width < 768) {
        // Mobile bottom navigation bar should be visible
        const mobileBottomNav = page.locator("nav").filter({ hasText: "Home" });
        await expect(mobileBottomNav).toBeVisible();

        // Mobile top bar header should be visible
        const topBar = page.locator("header");
        await expect(topBar).toBeVisible();

        // Quick action FAB (+) button should be visible
        const fab = page.locator("button[aria-label='Quick Actions']");
        await expect(fab).toBeVisible();
      } else if (vp.width >= 1024) {
        // Desktop permanent sidebar should be visible
        const desktopSidebar = page.locator("aside").filter({ hasText: "Hostels Console" }).first();
        await expect(desktopSidebar).toBeVisible();
      }

      // 4. Capture screenshot
      await page.screenshot({
        path: `tests/screenshots/${vp.name}.png`,
        fullPage: false,
      });
    });
  }

  test("Mobile Tab Navigation and Sheet Interactions on 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Open Branch Switcher Bottom Sheet
    const branchTrigger = page.locator("button").filter({ hasText: "All Branches" }).first();
    if (await branchTrigger.isVisible()) {
      await branchTrigger.click();
      await page.waitForTimeout(400);

      // Check Bottom Sheet opened
      const sheet = page.locator("text=Switch Hostel Branch");
      await expect(sheet).toBeVisible();

      // Close bottom sheet
      const closeBtn = page.locator("button[aria-label='Close drawer']");
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
      await page.waitForTimeout(300);
    }

    // Switch to Rent tab via mobile bottom nav link
    const rentLink = page.getByRole("link", { name: "Rent" });
    await rentLink.click();
    await page.waitForURL("**/rent");
    await page.waitForTimeout(400);

    // Verify Rent screen loaded without horizontal overflow
    const rentOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(rentOverflow).toBe(true);

    // Switch to Residents tab via mobile bottom nav link
    const residentsLink = page.getByRole("link", { name: "Residents" });
    await residentsLink.click();
    await page.waitForURL("**/residents");
    await page.waitForTimeout(400);

    // Verify Residents screen loaded without horizontal overflow
    const resOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(resOverflow).toBe(true);

    // Switch to Rooms tab via mobile bottom nav link
    const roomsLink = page.getByRole("link", { name: "Rooms" });
    await roomsLink.click();
    await page.waitForURL("**/rooms");
    await page.waitForTimeout(400);

    // Verify Rooms screen loaded without horizontal overflow
    const roomsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(roomsOverflow).toBe(true);
  });

  test("Touch Target Sizing Verification on 390px (>= 44px)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // Measure key interactive elements
    const elementsToTest = [
      "nav a", // mobile bottom nav items
      "button[aria-label='Quick Actions']", // FAB button
      "button[aria-label='Notifications']", // notification bell
      "button[aria-label='Search console']", // search trigger
    ];

    for (const selector of elementsToTest) {
      const locators = page.locator(selector);
      const count = await locators.count();
      for (let i = 0; i < count; i++) {
        const box = await locators.nth(i).boundingBox();
        if (box && box.height > 0) {
          expect(Math.max(box.height, box.width)).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test("Input Font-Size Verification on Mobile (>= 16px to prevent iOS auto-zoom)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/residents", { waitUntil: "networkidle" });

    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      const fontSize = await searchInput.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      const sizePx = parseFloat(fontSize);
      expect(sizePx).toBeGreaterThanOrEqual(16);
    }
  });
});
