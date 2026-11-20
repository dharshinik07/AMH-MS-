import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getUserById,
  saveUsers,
  loadUsers,
  logAuthAudit,
} from "@/lib/server/user-store";
import {
  hashPassword,
  normalizeUsername,
  validateUsernameFormat,
  validatePasswordPolicy,
  verifySessionToken,
} from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = verifySessionToken<{ userId: string; role: string }>(sessionCookie, SESSION_SECRET);
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Owner access required." }, { status: 403 });
    }

    const allUsers = loadUsers();
    const safeUsers = allUsers.map((u) => ({
      id: u.id,
      username: u.username,
      username_lower: u.username_lower,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      active: u.active,
      must_change_password: u.must_change_password,
      uses_initial_password: u.uses_initial_password,
      assigned_branch_ids: u.assigned_branch_ids || [],
      last_login_at: u.last_login_at,
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch {
    return NextResponse.json({ error: "Failed to fetch staff list" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const session = verifySessionToken<{ userId: string; role: string; username: string }>(sessionCookie, SESSION_SECRET);
    if (!session || session.role !== "owner") {
      return NextResponse.json({ error: "Forbidden: Owner access required." }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    const allUsers = loadUsers();

    // 1. CREATE STAFF ACCOUNT
    if (action === "create") {
      const { username, full_name, role, assigned_branch_ids, temporary_password, email, phone } = body;

      const formatCheck = validateUsernameFormat(username);
      if (!formatCheck.isValid) {
        return NextResponse.json({ success: false, error: formatCheck.error }, { status: 400 });
      }

      const lower = normalizeUsername(username);
      if (allUsers.some((u) => u.username_lower === lower)) {
        return NextResponse.json({ success: false, error: "An account with this ID already exists." }, { status: 400 });
      }

      const tempPass = temporary_password || `Aish@${crypto.randomBytes(3).toString("hex")}`;
      const policyCheck = validatePasswordPolicy(tempPass, username);
      if (!policyCheck.isValid) {
        return NextResponse.json({ success: false, error: policyCheck.errors[0] }, { status: 400 });
      }

      const newUser = {
        id: `usr-${Date.now()}`,
        username: username.trim(),
        username_lower: lower,
        full_name: full_name?.trim() || username.trim(),
        email: email?.trim() || `${lower}@aishwaryahostels.com`,
        phone: phone?.trim() || "+91 90434 23336",
        role: role === "owner" ? "warden" : (role || "warden"),
        password_hash: hashPassword(tempPass),
        must_change_password: true,
        uses_initial_password: false,
        failed_attempts: 0,
        locked_until: null,
        last_login_at: null,
        assigned_branch_ids: Array.isArray(assigned_branch_ids) ? assigned_branch_ids : [],
        active: true,
      };

      allUsers.push(newUser);
      saveUsers(allUsers);

      logAuthAudit({
        action: "STAFF_CREATED",
        userId: session.userId,
        userName: session.username,
        details: `Created staff account '${newUser.username}' (role: ${newUser.role})`,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          full_name: newUser.full_name,
          role: newUser.role,
        },
        temporaryPassword: tempPass,
      });
    }

    // 2. RESET STAFF PASSWORD
    if (action === "reset_password") {
      const { userId } = body;
      const targetIndex = allUsers.findIndex((u) => u.id === userId);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, error: "Staff user not found." }, { status: 404 });
      }

      const target = allUsers[targetIndex];
      // Generate secure temporary password satisfying policy
      const tempPass = `Temp#${crypto.randomBytes(3).toString("hex")}9`;
      target.password_hash = hashPassword(tempPass);
      target.must_change_password = true;
      target.failed_attempts = 0;
      target.locked_until = null;

      allUsers[targetIndex] = target;
      saveUsers(allUsers);

      logAuthAudit({
        action: "PASSWORD_RESET",
        userId: session.userId,
        userName: session.username,
        details: `Owner reset temporary password for staff '${target.username}'`,
      });

      return NextResponse.json({
        success: true,
        temporaryPassword: tempPass,
        message: `Temporary password for ${target.username} generated successfully.`,
      });
    }

    // 3. TOGGLE ACTIVE STATUS (ENABLE / DISABLE)
    if (action === "toggle_status") {
      const { userId, active } = body;
      const targetIndex = allUsers.findIndex((u) => u.id === userId);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
      }

      if (allUsers[targetIndex].role === "owner") {
        return NextResponse.json({ success: false, error: "Cannot disable owner account." }, { status: 400 });
      }

      allUsers[targetIndex].active = Boolean(active);
      saveUsers(allUsers);

      logAuthAudit({
        action: "STAFF_UPDATED",
        userId: session.userId,
        userName: session.username,
        details: `Owner ${active ? "enabled" : "disabled"} account '${allUsers[targetIndex].username}'`,
      });

      return NextResponse.json({ success: true, active: allUsers[targetIndex].active });
    }

    return NextResponse.json({ success: false, error: "Unknown action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Operation failed." }, { status: 500 });
  }
}
