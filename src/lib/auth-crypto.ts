import crypto from "crypto";

// Top 20 most common passwords to explicitly reject
export const TOP_20_COMMON_PASSWORDS = [
  "password",
  "12345678",
  "123456789",
  "admin1234",
  "qwertyuiop",
  "welcome1",
  "iloveyou",
  "admin12345",
  "pass1234",
  "letmein1",
  "monkey123",
  "dragon123",
  "master123",
  "sunshine1",
  "princess1",
  "football1",
  "baseball1",
  "trustno1",
  "shadow123",
  "superman1",
] as const;

export interface PasswordPolicyResult {
  isValid: boolean;
  score: number; // 0 to 4
  label: "Weak" | "Fair" | "Good" | "Strong";
  errors: string[];
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    notUsername: boolean;
    notCommon: boolean;
  };
}

/**
 * Validate password against security policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - Not equal to username (case-insensitive)
 * - Not in top 20 common passwords
 */
export function validatePasswordPolicy(password: string, username?: string): PasswordPolicyResult {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const normalizedUser = username ? username.trim().toLowerCase() : "";
  const notUsername = normalizedUser ? password.toLowerCase() !== normalizedUser : true;

  const notCommon = !TOP_20_COMMON_PASSWORDS.includes(password.toLowerCase() as any);

  const errors: string[] = [];
  if (!minLength) errors.push("Password must be at least 8 characters long.");
  if (!hasUpper) errors.push("Password must contain at least one uppercase letter (A-Z).");
  if (!hasLower) errors.push("Password must contain at least one lowercase letter (a-z).");
  if (!hasNumber) errors.push("Password must contain at least one number (0-9).");
  if (!notUsername) errors.push("Password cannot be identical to your ID.");
  if (!notCommon) errors.push("This password is too common and easily guessed.");

  // Calculate strength score
  let score = 0;
  if (minLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score++;
  if (!notCommon || !notUsername || !minLength || !hasUpper || !hasLower || !hasNumber) {
    score = Math.min(score, 1);
  }

  let label: "Weak" | "Fair" | "Good" | "Strong" = "Weak";
  if (score >= 4) label = "Strong";
  else if (score === 3) label = "Good";
  else if (score === 2) label = "Fair";

  const isValid = minLength && hasUpper && hasLower && hasNumber && notUsername && notCommon;

  return {
    isValid,
    score,
    label,
    errors,
    checks: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      notUsername,
      notCommon,
    },
  };
}

/**
 * Normalize username: trim and convert to lowercase for case-insensitive matching
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Validate username format:
 * - 4 to 24 characters
 * - Letters, numbers, dot, underscore only
 */
export function validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 4 || trimmed.length > 24) {
    return { isValid: false, error: "ID must be between 4 and 24 characters." };
  }
  if (!/^[a-zA-Z0-9._]+$/.test(trimmed)) {
    return { isValid: false, error: "ID can only contain letters, numbers, dot (.) and underscore (_)." };
  }
  return { isValid: true };
}

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

/**
 * Hash password securely using Node.js scrypt KDF with per-user random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Constant-time verification of password against stored scrypt hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") {
      return false;
    }
    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = parts[4];
    const key = parts[5];

    const targetBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, targetBuffer.length, { N, r, p });

    return crypto.timingSafeEqual(targetBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Dummy salt used for constant-time dummy verification when user is unknown
const DUMMY_SALT = "a1b2c3d4e5f67890123456789abcdef0";

/**
 * Performs dummy scrypt computation to equalize server response timing
 * and prevent username enumeration attacks.
 */
export function dummyTimingProtection(password: string): void {
  try {
    crypto.scryptSync(password || "dummy_password", DUMMY_SALT, KEY_LEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
    });
  } catch {
    // ignore
  }
}

/**
 * Simple session token generator using HMAC-SHA256
 */
export function signSessionToken(payload: object, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken<T = any>(token: string, secret: string): T | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload as T;
  } catch {
    return null;
  }
}
