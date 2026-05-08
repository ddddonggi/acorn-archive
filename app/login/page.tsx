import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
        <h1 className="text-3xl font-black text-[#3f2a1d]">로그인</h1>
        <p className="mt-3 text-[#6b4b35]">내 감상 창고로 조용히 들어가요.</p>
        <form className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="아이디" />
          <input className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="비밀번호" type="password" />
          <Link href="/" className="block rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb]">
            로그인하고 홈으로
          </Link>
        </form>
        <Link href="/signup" className="mt-5 block text-center text-sm font-semibold text-[#697a4c]">
          아직 계정이 없다면 회원가입
        </Link>
      </section>
    </main>
  );
}
