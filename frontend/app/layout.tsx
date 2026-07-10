import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HereWeGo",
  description: "xG 기반 축구 분석 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
