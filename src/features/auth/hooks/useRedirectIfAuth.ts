"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useAuthStore } from "../stores";
import type { JwtPayload } from "../types";

export const useRedirectIfAuth = () => {
  const router = useRouter();
  const { token, setToken } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const now = Date.now() / 1000;
      if (decoded.exp > now) {
        router.replace("/");
      } else {
        setToken(null);
      }
    } catch (err) {
      setToken(null);
    }
  }, [router, token, setToken]);
};
