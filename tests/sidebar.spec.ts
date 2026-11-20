import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const [k, ...v] = line.trim().split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

test.describe("Sidebar and Navigation Brand UI Verification", () => {
  test.beforeAll(() => {
    const screenshotDir = path.join(process.cwd(), "tests", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

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

  test("Desktop 1440px: Dashboard nav item, active gold pill, logo, and progress bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");

    // Wait for the desktop sidebar
    const sidebar = page.locator("aside.lg\\:flex");
    await expect(sidebar).toBeVisible();

    // Verify Logo tile
    const logoTile = sidebar.locator("div.bg-gold-gradient").first();
    await expect(logoTile).toBeVisible();
    const logoBg = await logoTile.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(logoBg).toContain("linear-gradient");

    // Verify Dashboard NavItem
    const dashboardLink = sidebar.locator('a[href="/dashboard"]');
    await expect(dashboardLink).toBeVisible();
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");

    // Verify label text is not empty and contains "Dashboard"
    const labelSpan = dashboardLink.locator("span.truncate");
    await expect(labelSpan).toBeVisible();
    await expect(labelSpan).toHaveText("Dashboard");

    // Verify text color is the exact brand navy #0F243F (rgb(15, 36, 63))
    const linkTextColor = await dashboardLink.evaluate((el) => window.getComputedStyle(el).color);
    expect(linkTextColor).toBe("rgb(15, 36, 63)");

    // Verify the active pill background has linear-gradient
    const activePill = dashboardLink.locator("span.bg-gold-gradient");
    await expect(activePill).toBeVisible();
    const pillBg = await activePill.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(pillBg).toContain("linear-gradient");

    // Verify the hero section styling ("Good afternoon," / "Sundararajan")
    const heroGreeting = page.locator("h2").filter({ hasText: /Sundararajan/ });
    await expect(heroGreeting).toBeVisible();
    await expect(heroGreeting).toContainText("Sundararajan");

    // Verify collection progress bar collected segment uses linear-gradient
    const collectedBar = page.locator("div.bg-gold-gradient").filter({
      hasNot: sidebar,
    }).first();
    if (await collectedBar.isVisible()) {
      const barBg = await collectedBar.evaluate((el) => window.getComputedStyle(el).backgroundImage);
      expect(barBg).toContain("linear-gradient");
    }

    // Capture screenshot at 1440px
    await page.screenshot({
      path: "tests/screenshots/sidebar-1440px.png",
      fullPage: false,
    });
  });

  test("Mobile 375px: Navigation and responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // Mobile bottom navigation bar should be visible
    const mobileNav = page.locator("nav.fixed.bottom-0");
    await expect(mobileNav).toBeVisible();

    // Verify dashboard link in mobile nav has aria-current="page"
    const mobileDashboard = mobileNav.locator('a[href="/dashboard"]');
    await expect(mobileDashboard).toBeVisible();
    await expect(mobileDashboard).toHaveAttribute("aria-current", "page");

    // Verify active pill on mobile has gold gradient
    const mobilePill = mobileDashboard.locator("span.bg-gold-gradient");
    await expect(mobilePill).toBeVisible();
    const mobilePillBg = await mobilePill.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    expect(mobilePillBg).toContain("linear-gradient");

    // Capture screenshot at 375px
    await page.screenshot({
      path: "tests/screenshots/sidebar-375px.png",
      fullPage: false,
    });
  });
});
