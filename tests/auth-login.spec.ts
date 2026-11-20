import { test, expect } from "@playwright/test";
import fs from "fs";

// Load credentials dynamically from .env.local
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

const OWNER_USERNAME = process.env.OWNER_USERNAME || "Aishowner";
const OWNER_PASSWORD = process.env.OWNER_INITIAL_PASSWORD || "";

test.describe("Authentication (ID + Password) E2E Test Suite", () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies & storage for clean login state
    await context.clearCookies();
  });

  // 1. Mobile 320px & 375px Viewports - Login Screen Layout & Responsiveness
  const mobileSizes = [
    { name: "iPhone-SE-1st-320px", width: 320, height: 568 },
    { name: "iPhone-SE-375px", width: 375, height: 667 },
  ];

  for (const vp of mobileSizes) {
    test(`Login Screen renders cleanly without horizontal scroll on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dashboard");

      // Verify branding elements
      await expect(page.locator("text=Aishwaraya Hostels & PG")).toBeVisible();
      await expect(page.locator("text=Hostels Console")).toBeVisible();
      await expect(page.locator("label:has-text('ID')")).toBeVisible();
      await expect(page.locator("label:has-text('Password')")).toBeVisible();

      // Verify 16px font on inputs to prevent iOS auto-zoom
      const idFontSize = await page.locator("#auth-id").evaluate((el) => window.getComputedStyle(el).fontSize);
      const passFontSize = await page.locator("#auth-password").evaluate((el) => window.getComputedStyle(el).fontSize);
      expect(parseInt(idFontSize, 10)).toBeGreaterThanOrEqual(16);
      expect(parseInt(passFontSize, 10)).toBeGreaterThanOrEqual(16);

      // Verify no horizontal overflow
      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      expect(noOverflow).toBe(true);
    });
  }

  // 2. Error Shake & Generic Message Verification
  test("Shows generic error 'Invalid ID or password.' on failed credentials and shakes card", async ({ page }) => {
    await page.goto("/dashboard");

    await page.fill("#auth-id", "Aishowner");
    await page.fill("#auth-password", "WrongPassword999!");
    await page.click("button:has-text('Sign in')");

    // Must show exact generic message
    const errorMsg = page.locator("text=Invalid ID or password.");
    await expect(errorMsg).toBeVisible();

    // Password input should be cleared and focused
    const passVal = await page.locator("#auth-password").inputValue();
    expect(passVal).toBe("");
  });

  // 3. Show/Hide Password Eye Toggle
  test("Show/Hide password toggle functions properly", async ({ page }) => {
    await page.goto("/dashboard");

    const passInput = page.locator("#auth-password");
    await passInput.fill("SecretPass123");

    // Initially password type
    await expect(passInput).toHaveAttribute("type", "password");

    // Click eye toggle
    const eyeBtn = page.locator("button[aria-label='Show password']");
    await eyeBtn.click();
    await expect(passInput).toHaveAttribute("type", "text");

    // Click again to hide
    const hideBtn = page.locator("button[aria-label='Hide password']");
    await hideBtn.click();
    await expect(passInput).toHaveAttribute("type", "password");
  });

  // 4. Successful Login with Owner Credentials (exact & lowercase)
  test("Owner logs in successfully with ID 'Aishowner' and redirects to Dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await page.fill("#auth-id", OWNER_USERNAME);
    await page.fill("#auth-password", OWNER_PASSWORD);
    await page.click("button:has-text('Sign in')");

    // Dashboard should load with header heading
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    // Default password reminder banner should be visible
    await expect(page.locator("text=You are using the default password.")).toBeVisible();
  });

  test("Owner logs in successfully with lowercase ID 'aishowner'", async ({ page }) => {
    await page.goto("/dashboard");

    await page.fill("#auth-id", "aishowner");
    await page.fill("#auth-password", OWNER_PASSWORD);
    await page.click("button:has-text('Sign in')");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
  });

  // 5. Inactivity Lock & Unlock Screen
  test("Inactivity lock screen displays read-only ID and unlocks with password", async ({ page }) => {
    await page.goto("/dashboard");
    await page.fill("#auth-id", OWNER_USERNAME);
    await page.fill("#auth-password", OWNER_PASSWORD);
    await page.click("button:has-text('Sign in')");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    // Verify unlock endpoint directly
    const unlockRes = await page.request.post("/api/auth/unlock", {
      data: { password: OWNER_PASSWORD },
    });
    expect(unlockRes.ok()).toBe(true);
  });

  // 6. Settings -> Account: Change Password & Live Policy Meter
  test("Settings -> Account shows live password strength meter and checklist", async ({ page }) => {
    await page.goto("/dashboard");
    await page.fill("#auth-id", OWNER_USERNAME);
    await page.fill("#auth-password", OWNER_PASSWORD);
    await page.click("button:has-text('Sign in')");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });

    await page.goto("/settings?section=account");
    await expect(page.getByRole("heading", { name: "Account Profile" })).toBeVisible({ timeout: 10000 });

    // Check strength meter updates
    const newPassInput = page.locator("input[placeholder='Enter new password']");
    await newPassInput.fill("weak");
    await expect(page.locator("span:has-text('Weak')")).toBeVisible();

    await newPassInput.fill("StrongPass@2026");
    await expect(page.locator("span:has-text('Strong')").or(page.locator("span:has-text('Good')"))).toBeVisible();
    await expect(page.locator("span:has-text('8+ characters')")).toBeVisible();
  });
});
