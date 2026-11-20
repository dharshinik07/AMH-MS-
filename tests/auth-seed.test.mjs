import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const USERS_FILE = path.join(ROOT_DIR, "data", "users.json");

console.log("Running seed:owner idempotency test...");

// Backup current users file
const originalUsers = fs.readFileSync(USERS_FILE, "utf-8");

try {
  // 1. Simulate owner with customized password
  const customHash = "scrypt$customized_owner_password_hash";
  const users = JSON.parse(originalUsers);
  const ownerIndex = users.findIndex((u) => u.role === "owner");
  users[ownerIndex].password_hash = customHash;
  users[ownerIndex].uses_initial_password = false;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  // 2. Run seed:owner
  const output = execSync("npm run seed:owner", { cwd: ROOT_DIR }).toString();
  assert(
    output.includes("preserved existing password without overwriting") ||
    output.includes("already exists with a customized password"),
    "Seed script must report that customized password was preserved"
  );

  // 3. Verify that password_hash was NOT changed
  const reloaded = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  const reloadedOwner = reloaded.find((u) => u.role === "owner");
  assert.equal(
    reloadedOwner.password_hash,
    customHash,
    "Idempotency check failed: seed script overwrote changed password!"
  );
  assert.equal(reloadedOwner.uses_initial_password, false);

  console.log("✅ seed:owner idempotency test passed: changed password was preserved!");
} finally {
  // Restore original users file
  fs.writeFileSync(USERS_FILE, originalUsers, "utf-8");
}
