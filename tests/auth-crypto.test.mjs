import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  dummyTimingProtection,
  normalizeUsername,
  validateUsernameFormat,
  validatePasswordPolicy,
  signSessionToken,
  verifySessionToken,
  TOP_20_COMMON_PASSWORDS,
} from "../src/lib/auth-crypto.ts";

console.log("Testing auth-crypto module...");

// 1. Password Hashing & Verification
const testPass = "TestSecret2026!";
const hash = hashPassword(testPass);
assert(hash.startsWith("scrypt$"), "Hash should start with scrypt$");
assert(verifyPassword(testPass, hash) === true, "Correct password should verify true");
assert(verifyPassword("WrongPassword123", hash) === false, "Wrong password should verify false");
assert(verifyPassword(testPass.toLowerCase(), hash) === false, "Password check must be case-sensitive");

// 2. Timing Protection
dummyTimingProtection("sample");

// 3. Username Normalization
assert.equal(normalizeUsername("  AishOwner  "), "aishowner");
assert.equal(normalizeUsername("AISHOWNER"), "aishowner");

// 4. Username Format Validation
assert.equal(validateUsernameFormat("abc").isValid, false, "Should reject < 4 chars");
assert.equal(validateUsernameFormat("a".repeat(25)).isValid, false, "Should reject > 24 chars");
assert.equal(validateUsernameFormat("invalid user!").isValid, false, "Should reject spaces/exclamation");
assert.equal(validateUsernameFormat("Aishowner").isValid, true, "Should accept Aishowner");
assert.equal(validateUsernameFormat("warden.selaiyur").isValid, true, "Should accept dot");
assert.equal(validateUsernameFormat("staff_tambaram_1").isValid, true, "Should accept underscore & numbers");

// 5. Password Policy
assert.equal(validatePasswordPolicy("short1A").isValid, false, "Reject < 8 chars");
assert.equal(validatePasswordPolicy("nouppercase123").isValid, false, "Reject no uppercase");
assert.equal(validatePasswordPolicy("NOLOWERCASE123").isValid, false, "Reject no lowercase");
assert.equal(validatePasswordPolicy("NoNumbersHere!").isValid, false, "Reject no number");
assert.equal(validatePasswordPolicy("Aishowner", "Aishowner").isValid, false, "Reject password equal to ID");
assert.equal(validatePasswordPolicy("aishowner", "Aishowner").isValid, false, "Reject case-insensitive ID match");

for (const common of TOP_20_COMMON_PASSWORDS) {
  assert.equal(validatePasswordPolicy(common).isValid, false, `Reject common password: ${common}`);
}

// Check that Admin123 passes the minimum policy requirements
const admin123Check = validatePasswordPolicy("Admin123", "Aishowner");
assert.equal(admin123Check.isValid, true, "Admin123 must satisfy password policy");

// Check strong password
const strongCheck = validatePasswordPolicy("Hostel@2026Secure", "Aishowner");
assert.equal(strongCheck.isValid, true);
assert.equal(strongCheck.score >= 3, true);

// 6. Session Token Signing & Verification
const secret = "test_super_secret_session_key_12345";
const payload = { userId: "usr-1", username: "Aishowner", role: "owner", exp: Date.now() + 60000 };
const token = signSessionToken(payload, secret);
const verified = verifySessionToken(token, secret);
assert.equal(verified?.username, "Aishowner");

// Tampered token
const tamperedToken = token.slice(0, -3) + "xyz";
assert.equal(verifySessionToken(tamperedToken, secret), null, "Tampered token must return null");

// Expired token
const expiredPayload = { userId: "usr-1", exp: Date.now() - 1000 };
const expiredToken = signSessionToken(expiredPayload, secret);
assert.equal(verifySessionToken(expiredToken, secret), null, "Expired token must return null");

console.log("All auth-crypto tests passed successfully!");
