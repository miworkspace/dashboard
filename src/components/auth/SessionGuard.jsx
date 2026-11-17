"use client";

import { useEffect } from "react";
import {
  checkTokenExpiry,
  restoreTokenExpiryTimer,
} from "@/lib/auth/session";

export default function SessionGuard() {
  useEffect(() => {
    restoreTokenExpiryTimer();

    const checkExpiry = () => checkTokenExpiry();
    window.addEventListener("focus", checkExpiry);
    document.addEventListener("visibilitychange", checkExpiry);

    return () => {
      window.removeEventListener("focus", checkExpiry);
      document.removeEventListener("visibilitychange", checkExpiry);
    };
  }, []);

  return null;
}
