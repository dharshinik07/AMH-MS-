import fs from "fs";
import path from "path";
import {
  hashPassword,
  normalizeUsername,
  dummyTimingProtection,
  verifyPassword,
} from "../auth-crypto";
import { User, AuditLog } from "@/types/hostel";
import { COMPANY } from "@/config/business";

export interface StoredUser extends User {
  password_hash: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const AUDIT_FILE = path.join(DATA_DIR, "audit-auth.json");

// In-memory rate limiting tracker: tracks failed attempts by key (IP or username_lower)
interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function getRateLimitEntry(key: string): RateLimitEntry {
  const existing = rateLimitMap.get(key);
  const now = Date.now();
  if (!existing || now - existing.firstAttemptAt > 15 * 60 * 1000) {
    const fresh: RateLimitEntry = { count: 0, firstAttemptAt: now, lockedUntil: null };
    rateLimitMap.set(key, fresh);
    return fresh;
  }
  return existing;
}

export function checkRateLimit(username: string, ip: string): { isLocked: boolean; delayMs: number } {
  const now = Date.now();
  const userKey = `user:${normalizeUsername(username)}`;
  const ipKey = `ip:${ip}`;

  const userEntry = getRateLimitEntry(userKey);
  const ipEntry = getRateLimitEntry(ipKey);

  if ((userEntry.lockedUntil && userEntry.lockedUntil > now) || (ipEntry.lockedUntil && ipEntry.lockedUntil > now)) {
    return { isLocked: true, delayMs: 0 };
  }

  // Calculate progressive delay: 1s after 2 failures, 2s after 3, 4s after 4
  const maxFailures = Math.max(userEntry.count, ipEntry.count);
  let delayMs = 0;
  if (maxFailures === 2) delayMs = 1000;
  else if (maxFailures === 3) delayMs = 2000;
  else if (maxFailures >= 4) delayMs = 4000;

  return { isLocked: false, delayMs };
}

export function recordFailedAttempt(username: string, ip: string): { isLocked: boolean } {
  const now = Date.now();
  const userKey = `user:${normalizeUsername(username)}`;
  const ipKey = `ip:${ip}`;

  const userEntry = getRateLimitEntry(userKey);
  const ipEntry = getRateLimitEntry(ipKey);

  userEntry.count++;
  ipEntry.count++;

  const isLocked = userEntry.count >= 5 || ipEntry.count >= 5;
  if (isLocked) {
    const lockExpiry = now + 15 * 60 * 1000;
    userEntry.lockedUntil = lockExpiry;
    ipEntry.lockedUntil = lockExpiry;
  }

  return { isLocked };
}

export function resetRateLimit(username: string, ip: string): void {
  rateLimitMap.delete(`user:${normalizeUsername(username)}`);
  rateLimitMap.delete(`ip:${ip}`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Loads users from file. If file does not exist, initializes with default accounts.
 */
export function loadUsers(): StoredUser[] {
  ensureDataDir();
  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      // Fallback
    }
  }

  // Initialize from environment
  const ownerUser = process.env.OWNER_USERNAME || "Aishowner";
  const ownerPass = process.env.OWNER_INITIAL_PASSWORD || "";

  const initialUsers: StoredUser[] = [
    {
      id: "usr-1",
      username: ownerUser,
      username_lower: normalizeUsername(ownerUser),
      email: COMPANY.email,
      full_name: "A. Sundararajan (Owner)",
      phone: COMPANY.phone,
      role: "owner",
      password_hash: hashPassword(ownerPass),
      uses_initial_password: true,
      must_change_password: false,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: null,
      active: true,
    },
    {
      id: "usr-2",
      username: "ramesh.warden",
      username_lower: "ramesh.warden",
      email: "warden.selaiyur@aishwaryahostels.com",
      full_name: "M. Ramesh (Warden - Selaiyur)",
      phone: "+91 98401 23456",
      role: "warden",
      password_hash: hashPassword("Warden@2026"),
      uses_initial_password: false,
      must_change_password: true,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: null,
      assigned_branch_ids: ["branch-5", "branch-6", "branch-7"],
      active: true,
    },
    {
      id: "usr-3",
      username: "balaji.warden",
      username_lower: "balaji.warden",
      email: "warden.tambaram@aishwaryahostels.com",
      full_name: "K. Balaji (Warden - Tambaram)",
      phone: "+91 97910 87654",
      role: "warden",
      password_hash: hashPassword("Warden@2026"),
      uses_initial_password: false,
      must_change_password: true,
      failed_attempts: 0,
      locked_until: null,
      last_login_at: null,
      assigned_branch_ids: ["branch-2", "branch-3", "branch-4"],
      active: true,
    },
  ];

  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf-8");
  return initialUsers;
}

export function saveUsers(users: StoredUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export function getUserByUsername(username: string): StoredUser | null {
  const users = loadUsers();
  const lower = normalizeUsername(username);
  return users.find((u) => u.username_lower === lower) || null;
}

export function getUserById(id: string): StoredUser | null {
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
}

export function logAuthAudit(entry: {
  action: "LOGIN" | "FAILED_LOGIN" | "LOCKOUT" | "LOGOUT" | "PASSWORD_CHANGE" | "PASSWORD_RESET" | "STAFF_CREATED" | "STAFF_UPDATED";
  userId?: string;
  userName?: string;
  ip?: string;
  deviceLabel?: string;
  details?: string;
}) {
  try {
    ensureDataDir();
    let logs: any[] = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf-8"));
      } catch {}
    }
    logs.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action: entry.action,
      user_id: entry.userId,
      user_name: entry.userName,
      ip: entry.ip || "unknown",
      device_label: entry.deviceLabel || "Console Terminal",
      details: entry.details,
      timestamp: new Date().toISOString(),
    });
    // Keep last 1000 logs
    if (logs.length > 1000) logs = logs.slice(-1000);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    // Non-blocking
  }
}
