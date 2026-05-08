import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "도토리 감상 창고",
  description: "AI와 대화하며 나의 감상을 차곡차곡 보관하는 공간",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
