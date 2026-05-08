import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "도토리 감상 창고",
  description: "AI와 대화하며 나의 감상을 차곡차곡 보관하는 공간",
};

const navItems = [
  { href: "/", label: "홈" },
  { href: "/categories/music", label: "음악" },
  { href: "/categories/media", label: "미디어" },
  { href: "/categories/video", label: "영상" },
  { href: "/taste", label: "내 취향" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-20 border-b border-[#8a5a2f]/15 bg-[#fff8eb]/85 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-[#5b351f]">
              도토리 감상 창고
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#5b351f] transition hover:bg-[#ead7b8]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-[#8a5a2f]/25 px-4 py-2 text-sm font-semibold text-[#5b351f]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#8a5a2f] px-4 py-2 text-sm font-semibold text-[#fff8eb]"
              >
                회원가입
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
