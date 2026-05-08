"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";

const navItems = [
  { href: "/", label: "홈", protected: false },
  { href: "/music", label: "음악", protected: true },
  { href: "/media", label: "미디어", protected: true },
  { href: "/video", label: "영상", protected: true },
  { href: "/taste", label: "내 취향", protected: true },
];

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const refreshUser = () => setUsername(getCurrentUser()?.username ?? null);

    refreshUser();
    window.addEventListener("storage", refreshUser);
    window.addEventListener("acorn-auth-changed", refreshUser);

    return () => {
      window.removeEventListener("storage", refreshUser);
      window.removeEventListener("acorn-auth-changed", refreshUser);
    };
  }, [pathname]);

  function handleProtectedClick(event: React.MouseEvent<HTMLAnchorElement>, protectedRoute: boolean) {
    if (!protectedRoute || username) {
      return;
    }

    event.preventDefault();
    router.push("/login");
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#8a5a2f]/15 bg-[#fff8eb]/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-[#5b351f]">
          취향 책장
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => handleProtectedClick(event, item.protected)}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#5b351f] transition hover:bg-[#ead7b8]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {username ? (
            <>
              <span className="hidden text-sm font-semibold text-[#697a4c] sm:inline">
                {username}님
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-[#8a5a2f]/25 px-4 py-2 text-sm font-semibold text-[#5b351f]"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
