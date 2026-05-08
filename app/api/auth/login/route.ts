import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureDatabase } from "@/lib/server/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const username = body.username?.trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, message: "아이디와 비밀번호를 모두 입력해 주세요." },
        { status: 400 },
      );
    }

    await ensureDatabase();

    const result = await sql`
      SELECT username, password_hash
      FROM acorn_users
      WHERE username = ${username}
    `;
    const user = result.rows[0] as { username: string; password_hash: string } | undefined;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { ok: false, message: "아이디 또는 비밀번호를 확인해 주세요." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "로그인되었습니다.",
      user: { username: user.username, loggedInAt: new Date().toISOString() },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "로그인 중 오류가 발생했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
