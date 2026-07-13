"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getHealth } from "@/lib/api";

export default function Home() {
  const [status, setStatus] = useState("확인 중...");

  useEffect(() => {
    getHealth()
      .then((data) => setStatus(data.status ?? "unknown"))
      .catch(() => setStatus("backend에 연결할 수 없음"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">HereWeGo</h1>
      <p className="text-gray-500">xG 기반 축구 전술 시뮬레이터</p>
      <div className="flex gap-4">
        <Link href="/tactics" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
          승부 뒤집기 리와인드
        </Link>
        <Link href="/rewind" className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">
          골 장면 리와인드
        </Link>
      </div>
      <p className="text-xs text-gray-400">backend 상태: {status}</p>
    </main>
  );
}
