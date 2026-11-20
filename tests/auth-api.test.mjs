import assert from "node:assert/strict";
import fs from "fs";

// Load server env from .env.local
if (fs.existsSync(".env.local")) {
  for (const line of fs.readFileSync(".env.local", "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [k, ...v] = trimmed.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

const BASE_URL = "http://localhost:3000";

async function runApiTests() {
  console.log("Running Authentication API Test Suite...\n");

  const ownerId = process.env.OWNER_USERNAME || "Aishowner";
  const initialPassword = process.env.OWNER_INITIAL_PASSWORD || "";
  assert(initialPassword.length > 0, "OWNER_INITIAL_PASSWORD must be defined in .env.local");

  // 1. Correct ID (exact case) + password
  console.log("1. Testing exact case login: 'Aishowner' + correct password...");
  const res1 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.101" },
    body: JSON.stringify({
      username: ownerId,
      password: initialPassword,
      deviceLabel: "Test Suite Laptop",
    }),
  });
  const data1 = await res1.json();
  assert.equal(res1.status, 200, "Login should succeed with 200 OK");
  assert.equal(data1.success, true);
  assert.equal(data1.user.username, "Aishowner");
  assert.equal(data1.user.role, "owner");
  assert.equal(data1.user.uses_initial_password, true);

  const cookieHeader = res1.headers.get("set-cookie");
  assert(cookieHeader?.includes("auth_session="), "Must set auth_session cookie");
  assert(cookieHeader?.toLowerCase().includes("httponly"), "Must be HttpOnly");
  assert(cookieHeader?.toLowerCase().includes("samesite=strict"), "Must be SameSite=Strict");

  // 2. Case-insensitive username login: 'aishowner'
  console.log("2. Testing case-insensitive username login: 'aishowner'...");
  const res2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.102" },
    body: JSON.stringify({
      username: "aishowner",
      password: initialPassword,
    }),
  });
  const data2 = await res2.json();
  assert.equal(res2.status, 200, "Lowercase username should succeed");
  assert.equal(data2.user.username, "Aishowner");

  // 3. Password case sensitivity: lowercase password must fail
  console.log("3. Testing password case sensitivity: 'admin123' must fail...");
  const resCase = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.103" },
    body: JSON.stringify({
      username: "Aishowner",
      password: initialPassword.toLowerCase(),
    }),
  });
  const dataCase = await resCase.json();
  assert.equal(resCase.status, 401);
  assert.equal(dataCase.error, "Invalid ID or password.");

  // 4. Unknown username returns exact same generic error
  console.log("4. Testing unknown ID returns identical generic error...");
  const resUnknown = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "192.168.1.104" },
    body: JSON.stringify({
      username: "RandomNonExistentUser999",
      password: "SomePassword123",
    }),
  });
  const dataUnknown = await resUnknown.json();
  assert.equal(resUnknown.status, 401);
  assert.equal(dataUnknown.error, "Invalid ID or password.");

  // 5. Rate limiting and 15-minute lockout (5 attempts from single test IP)
  console.log("5. Testing rate-limiting and 15-minute lockout on 5th/6th failed attempt...");
  const uniqueSubnet = Math.floor(Math.random() * 200 + 10);
  const lockTestIp = `192.168.99.${uniqueSubnet}`;
  const lockUser = `test_lockout_user_${Date.now()}`;
  for (let i = 1; i <= 5; i++) {
    const resFail = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": lockTestIp },
      body: JSON.stringify({
        username: lockUser,
        password: `WrongPass${i}!`,
      }),
    });
    assert.equal(resFail.status, 401);
    const dataFail = await resFail.json();
    assert.equal(dataFail.error, "Invalid ID or password.");
  }

  // 6th attempt from the same IP must be locked out with HTTP 429
  const resLocked = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": lockTestIp },
    body: JSON.stringify({
      username: lockUser,
      password: "AnyPassword123",
    }),
  });
  assert.equal(resLocked.status, 429, "6th attempt must return HTTP 429");
  const dataLocked = await resLocked.json();
  assert.equal(dataLocked.error, "Too many attempts. Try again in 15 minutes.");

  // 6. Inactivity unlock API test
  console.log("6. Testing inactivity unlock API...");
  // Using session cookie from res1
  const sessionCookieVal = cookieHeader.split(";")[0];
  const resUnlockSuccess = await fetch(`${BASE_URL}/api/auth/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieVal,
    },
    body: JSON.stringify({ password: initialPassword }),
  });
  const dataUnlock = await resUnlockSuccess.json();
  assert.equal(resUnlockSuccess.status, 200);
  assert.equal(dataUnlock.success, true);

  // Wrong unlock password
  const resUnlockFail = await fetch(`${BASE_URL}/api/auth/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookieVal,
    },
    body: JSON.stringify({ password: "WrongUnlockPassword123" }),
  });
  assert.equal(resUnlockFail.status, 401);
  const dataUnlockFail = await resUnlockFail.json();
  assert(dataUnlockFail.error.includes("Incorrect password"));

  // 7. Logout API test
  console.log("7. Testing logout API...");
  const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookieVal },
  });
  assert.equal(resLogout.status, 200);
  const logoutCookie = resLogout.headers.get("set-cookie");
  assert(logoutCookie?.includes("auth_session=;"), "Logout must clear auth_session cookie");

  console.log("\n✅ All Authentication API tests passed successfully!");
}

runApiTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
