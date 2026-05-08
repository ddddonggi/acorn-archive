import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
        <h1 className="text-3xl font-black text-[#3f2a1d]">회원가입</h1>
        <p className="mt-3 text-[#6b4b35]">감상을 보관할 작은 창고를 만들어요.</p>
        <form className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="아이디" />
          <input className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="비밀번호" type="password" />
          <input className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="비밀번호 확인" type="password" />
          <Link href="/login" className="block rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb]">
            가입하고 로그인으로
          </Link>
        </form>
      </section>
    </main>
  );
}
