import { NextRequest, NextResponse } from "next/server";
import {
  getUserByUsername,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  saveUsers,
  loadUsers,
  logAuthAudit,
} from "@/lib/server/user-store";
import {
  verifyPassword,
  dummyTimingProtection,
  signSessionToken,
} from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request format." }, { status: 400 });
    }

    const { username, password, keepMeSignedIn, deviceLabel } = body || {};

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Invalid ID or password." }, { status: 401 });
    }

    const trimmedUser = username.trim();

    // 1. Check Rate Limiting and Lockout
    const rateCheck = checkRateLimit(trimmedUser, ip);
    if (rateCheck.isLocked) {
      logAuthAudit({
        action: "LOCKOUT",
        userName: trimmedUser,
        ip,
        deviceLabel,
        details: "Blocked attempt: 15-minute lockout active",
      });
      return NextResponse.json(
        { success: false, error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Apply progressive delay if needed (1s, 2s, 4s)
    if (rateCheck.delayMs > 0) {
      await new Promise((res) => setTimeout(res, rateCheck.delayMs));
    }

    // 2. Lookup User
    const user = getUserByUsername(trimmedUser);

    if (!user || !user.active) {
      // Run dummy timing protection to equalize timing and prevent enumeration
      dummyTimingProtection(password);
      recordFailedAttempt(trimmedUser, ip);
      logAuthAudit({
        action: "FAILED_LOGIN",
        userName: trimmedUser,
        ip,
        deviceLabel,
        details: "Failed login attempt (user not found or inactive)",
      });
      return NextResponse.json({ success: false, error: "Invalid ID or password." }, { status: 401 });
    }

    // 3. Verify Password
    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailedAttempt(trimmedUser, ip);
      logAuthAudit({
        action: "FAILED_LOGIN",
        userId: user.id,
        userName: user.username,
        ip,
        deviceLabel,
        details: "Failed login attempt (incorrect password)",
      });
      return NextResponse.json({ success: false, error: "Invalid ID or password." }, { status: 401 });
    }

    // 4. Successful login
    resetRateLimit(trimmedUser, ip);

    // Update last_login_at
    const allUsers = loadUsers();
    const idx = allUsers.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      allUsers[idx].last_login_at = new Date().toISOString();
      allUsers[idx].failed_attempts = 0;
      saveUsers(allUsers);
    }

    logAuthAudit({
      action: "LOGIN",
      userId: user.id,
      userName: user.username,
      ip,
      deviceLabel,
      details: "Successful authentication",
    });

    // Session duration: 30 days if keepMeSignedIn, else 12 hours
    const maxAgeSeconds = keepMeSignedIn ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
    const expiresAt = Date.now() + maxAgeSeconds * 1000;

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: expiresAt,
    };

    const sessionToken = signSessionToken(sessionPayload, SESSION_SECRET);

    const safeUser = {
      id: user.id,
      username: user.username,
      username_lower: user.username_lower,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      uses_initial_password: Boolean(user.uses_initial_password),
      must_change_password: Boolean(user.must_change_password),
      assigned_branch_ids: user.assigned_branch_ids || [],
    };

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });

    response.cookies.set("auth_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: "Invalid ID or password." }, { status: 500 });
  }
}
