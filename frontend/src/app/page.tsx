"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root page — redirect berdasarkan login status
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    router.replace(token ? "/chat" : "/login");
  }, [router]);

  return null;
}
