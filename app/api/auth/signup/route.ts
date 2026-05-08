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

    const existing = await sql`
      SELECT username FROM acorn_users WHERE username = ${username}
    `;

    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 아이디입니다." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO acorn_users (username, password_hash)
      VALUES (${username}, ${passwordHash})
    `;

    return NextResponse.json({ ok: true, message: "회원가입이 완료되었습니다." });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "회원가입 중 오류가 발생했습니다.",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
