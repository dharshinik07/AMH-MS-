import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import {
  hashPassword,
  validatePasswordPolicy,
  normalizeUsername,
} from "../src/lib/auth-crypto.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-auth.json");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

async function main() {
  console.log("\n=======================================================");
  console.log(" Aishwaraya Hostels & PG - Owner Password Reset Tool ");
  console.log("=======================================================\n");

  if (!fs.existsSync(USERS_FILE)) {
    console.error("Error: users database file not found. Run 'npm run seed:owner' first.");
    rl.close();
    process.exit(1);
  }

  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (e) {
    console.error("Error reading users file:", e);
    rl.close();
    process.exit(1);
  }

  const ownerIndex = users.findIndex((u) => u.role === "owner");
  if (ownerIndex === -1) {
    console.error("Error: No owner user found in database. Run 'npm run seed:owner' first.");
    rl.close();
    process.exit(1);
  }

  const owner = users[ownerIndex];
  console.log(`Target account: ${owner.username} (${owner.full_name})\n`);

  const newPass = await question("Enter new password: ");
  if (!newPass) {
    console.log("Aborted: Password cannot be blank.");
    rl.close();
    process.exit(1);
  }

  const policy = validatePasswordPolicy(newPass, owner.username);
  if (!policy.isValid) {
    console.error("\n❌ Password policy validation failed:");
    for (const err of policy.errors) {
      console.error(` - ${err}`);
    }
    rl.close();
    process.exit(1);
  }

  const confirmPass = await question("Confirm new password: ");
  if (newPass !== confirmPass) {
    console.error("\n❌ Passwords do not match. Aborted.");
    rl.close();
    process.exit(1);
  }

  // Update owner in database
  const newHash = hashPassword(newPass);
  users[ownerIndex] = {
    ...owner,
    password_hash: newHash,
    uses_initial_password: false,
    failed_attempts: 0,
    locked_until: null,
  };

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");

  // Write audit log entry
  try {
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      logs = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf-8"));
    }
    logs.push({
      id: `audit-${Date.now()}-reset`,
      action: "PASSWORD_RESET",
      user_id: owner.id,
      user_name: owner.username,
      ip: "127.0.0.1 (CLI)",
      device_label: "Terminal CLI Tool",
      details: "Owner password successfully reset via npm run reset-owner-password",
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch {}

  console.log("\n✅ Owner password successfully updated!");
  console.log("Account lockouts have been cleared and audit log recorded.\n");
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  rl.close();
  process.exit(1);
});
