"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setMessage("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setMessage(result.message);
    setIsSubmitting(false);

    if (result.ok) {
      router.push("/");
    }
  }

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
        <h1 className="text-3xl font-black text-[#3f2a1d]">로그인</h1>
        <p className="mt-3 text-[#6b4b35]">내 감상 창고로 조용히 들어가요.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
            placeholder="아이디"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message ? <p className="text-sm font-semibold text-[#8a5a2f]">{message}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="block w-full rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb] disabled:opacity-60"
          >
            {isSubmitting ? "확인 중..." : "로그인하고 홈으로"}
          </button>
        </form>
        <Link href="/signup" className="mt-5 block text-center text-sm font-semibold text-[#697a4c]">
          아직 계정이 없다면 회원가입
        </Link>
      </section>
    </main>
  );
}
