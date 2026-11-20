import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/server/user-store";
import { verifySessionToken } from "@/lib/auth-crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "aishwaraya_console_secret_key_2026_super_secure_hash";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("auth_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const session = verifySessionToken<{ userId: string; username: string; role: string; exp: number }>(
      sessionCookie,
      SESSION_SECRET
    );

    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false });
    }

    const user = getUserById(session.userId);
    if (!user || !user.active) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        username_lower: user.username_lower,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        uses_initial_password: Boolean(user.uses_initial_password),
        must_change_password: Boolean(user.must_change_password),
        assigned_branch_ids: user.assigned_branch_ids || [],
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
