import { NextRequest, NextResponse } from "next/server";
import { logAuthAudit } from "@/lib/server/user-store";
import { verifySessionToken } from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (sessionCookie) {
      const session = verifySessionToken<{ userId: string; username: string }>(sessionCookie, SESSION_SECRET);
      if (session) {
        logAuthAudit({
          action: "LOGOUT",
          userId: session.userId,
          userName: session.username,
          details: "User initiated sign out",
        });
      }
    }

    const response = NextResponse.json({ success: true, message: "Signed out successfully." });
    response.cookies.set("auth_session", "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
    });
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, error: "Logout failed." }, { status: 500 });
  }
}
