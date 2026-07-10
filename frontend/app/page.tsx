"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Home() {
  const [status, setStatus] = useState("확인 중...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(data.status ?? "unknown"))
      .catch(() => setStatus("backend에 연결할 수 없음"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">HereWeGo</h1>
      <p>backend 상태: {status}</p>
    </main>
  );
}
