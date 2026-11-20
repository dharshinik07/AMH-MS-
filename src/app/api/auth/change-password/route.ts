import { NextRequest, NextResponse } from "next/server";
import {
  getUserById,
  saveUsers,
  loadUsers,
  logAuthAudit,
} from "@/lib/server/user-store";
import {
  verifyPassword,
  hashPassword,
  validatePasswordPolicy,
  verifySessionToken,
  signSessionToken,
} from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const session = verifySessionToken<{ userId: string; username: string }>(sessionCookie, SESSION_SECRET);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "Session expired." }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = (await req.json()) || {};

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ success: false, error: "New password is required." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Passwords do not match." }, { status: 400 });
    }

    const allUsers = loadUsers();
    const userIndex = allUsers.findIndex((u) => u.id === session.userId);
    if (userIndex === -1) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const user = allUsers[userIndex];

    // If not forced first-login change, verify current password
    if (!user.must_change_password) {
      if (!currentPassword) {
        return NextResponse.json({ success: false, error: "Current password is required." }, { status: 400 });
      }
      const isCurrentValid = verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentValid) {
        return NextResponse.json({ success: false, error: "Current password is incorrect." }, { status: 400 });
      }
    }

    // Validate password policy
    const policy = validatePasswordPolicy(newPassword, user.username);
    if (!policy.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: policy.errors[0] || "Password does not meet security requirements.",
          errors: policy.errors,
        },
        { status: 400 }
      );
    }

    // Hash new password and update flags
    const newHash = hashPassword(newPassword);
    allUsers[userIndex] = {
      ...user,
      password_hash: newHash,
      uses_initial_password: false,
      must_change_password: false,
      failed_attempts: 0,
      locked_until: null,
    };
    saveUsers(allUsers);

    // Write audit log
    logAuthAudit({
      action: "PASSWORD_CHANGE",
      userId: user.id,
      userName: user.username,
      details: "Password successfully changed by user. Other sessions invalidated.",
    });

    // Rotate and issue new session token (12 hours)
    const newExpiresAt = Date.now() + 12 * 60 * 60 * 1000;
    const newSessionToken = signSessionToken(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        exp: newExpiresAt,
      },
      SESSION_SECRET
    );

    const response = NextResponse.json({
      success: true,
      message: "Password changed successfully.",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        uses_initial_password: false,
        must_change_password: false,
      },
    });

    response.cookies.set("auth_session", newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: "Failed to change password." }, { status: 500 });
  }
}
