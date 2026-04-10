"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/authTokens";

export function useAuthGuard(redirectTo = "/signin") {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();

    if (!token) router.push(redirectTo);
  }, [router, redirectTo]);
}