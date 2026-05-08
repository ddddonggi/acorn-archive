"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/lib/auth";

export default function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password || !passwordConfirm) {
      setMessage("모든 항목을 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const result = signup(username, password);
    setMessage(result.message);

    if (result.ok) {
      router.push("/login");
    }
  }

  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
        <h1 className="text-3xl font-black text-[#3f2a1d]">회원가입</h1>
        <p className="mt-3 text-[#6b4b35]">감상을 보관할 작은 창고를 만들어요.</p>
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
          <input
            className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
            placeholder="비밀번호 확인"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
          {message ? <p className="text-sm font-semibold text-[#8a5a2f]">{message}</p> : null}
          <button
            type="submit"
            className="block w-full rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb]"
          >
            가입하고 로그인으로
          </button>
        </form>
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-[#697a4c]">
          이미 계정이 있다면 로그인
        </Link>
      </section>
    </main>
  );
}
