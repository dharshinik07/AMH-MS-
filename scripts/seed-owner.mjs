import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { hashPassword, normalizeUsername } from "../src/lib/auth-crypto.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_LOCAL_PATH = path.join(ROOT_DIR, ".env.local");
const DATA_DIR = path.join(ROOT_DIR, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Read .env.local if present
function loadEnv() {
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    const lines = fs.readFileSync(ENV_LOCAL_PATH, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [k, ...v] = trimmed.split("=");
      if (k && v.length) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

loadEnv();

const ownerUsername = process.env.OWNER_USERNAME || "Aishowner";
const ownerInitialPassword = process.env.OWNER_INITIAL_PASSWORD || "Admin123";

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let users = [];
if (fs.existsSync(USERS_FILE)) {
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    users = [];
  }
}

const ownerLower = normalizeUsername(ownerUsername);
const existingOwnerIndex = users.findIndex((u) => u.username_lower === ownerLower || u.role === "owner");

if (existingOwnerIndex >= 0) {
  const existingOwner = users[existingOwnerIndex];
  // If the owner has already changed their password, DO NOT OVERWRITE IT!
  if (existingOwner.uses_initial_password === false) {
    console.log(`[seed:owner] Owner '${existingOwner.username}' already exists with a customized password.`);
    console.log("[seed:owner] Idempotent safety check: preserved existing password without overwriting.");
    process.exit(0);
  } else {
    // Owner exists with initial password; ensure username & metadata are aligned
    users[existingOwnerIndex] = {
      ...existingOwner,
      username: ownerUsername,
      username_lower: ownerLower,
      password_hash: hashPassword(ownerInitialPassword),
      uses_initial_password: true,
      must_change_password: false,
      failed_attempts: 0,
      locked_until: null,
      active: true,
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    console.log(`[seed:owner] Owner account '${ownerUsername}' verified and updated (initial password state).`);
    process.exit(0);
  }
} else {
  // Create brand new owner
  const newOwner = {
    id: "usr-1",
    username: ownerUsername,
    username_lower: ownerLower,
    email: "sundararajan@aishwaryahostels.com",
    full_name: "A. Sundararajan (Owner)",
    phone: "+91 90434 23336",
    role: "owner",
    password_hash: hashPassword(ownerInitialPassword),
    uses_initial_password: true,
    must_change_password: false,
    failed_attempts: 0,
    locked_until: null,
    last_login_at: null,
    active: true,
  };
  users.unshift(newOwner);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  console.log(`[seed:owner] Owner account '${ownerUsername}' successfully seeded.`);
  process.exit(0);
}
