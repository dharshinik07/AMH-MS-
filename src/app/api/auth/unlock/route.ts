import { NextRequest, NextResponse } from "next/server";
import { getUserById, logAuthAudit } from "@/lib/server/user-store";
import { verifyPassword, verifySessionToken } from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

// In-memory unlock failure tracker per session / user
const unlockFailures = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Session expired.", forceSignOut: true }, { status: 401 });
    }

    const session = verifySessionToken<{ userId: string; username: string; role: string }>(
      sessionCookie,
      SESSION_SECRET
    );

    if (!session || !session.userId) {
      const resp = NextResponse.json({ success: false, error: "Session invalid.", forceSignOut: true }, { status: 401 });
      resp.cookies.set("auth_session", "", { path: "/", maxAge: 0 });
      return resp;
    }

    const { password } = (await req.json()) || {};
    if (!password || typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Password is required." }, { status: 400 });
    }

    const user = getUserById(session.userId);
    if (!user) {
      const resp = NextResponse.json({ success: false, error: "User not found.", forceSignOut: true }, { status: 401 });
      resp.cookies.set("auth_session", "", { path: "/", maxAge: 0 });
      return resp;
    }

    const isValid = verifyPassword(password, user.password_hash);
    const key = `unlock:${user.id}`;
    const failures = (unlockFailures.get(key) || 0);

    if (!isValid) {
      const newFailures = failures + 1;
      unlockFailures.set(key, newFailures);

      logAuthAudit({
        action: "FAILED_LOGIN",
        userId: user.id,
        userName: user.username,
        details: `Inactivity unlock failed attempt ${newFailures}/5`,
      });

      if (newFailures >= 5) {
        unlockFailures.delete(key);
        const resp = NextResponse.json(
          {
            success: false,
            error: "Too many failed attempts. You have been signed out.",
            forceSignOut: true,
          },
          { status: 401 }
        );
        resp.cookies.set("auth_session", "", { path: "/", maxAge: 0 });
        return resp;
      }

      return NextResponse.json(
        {
          success: false,
          error: `Incorrect password. (${5 - newFailures} attempts remaining)`,
          remainingAttempts: 5 - newFailures,
        },
        { status: 401 }
      );
    }

    // Success
    unlockFailures.delete(key);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "An error occurred." }, { status: 500 });
  }
}
