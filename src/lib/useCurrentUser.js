"use client";

import { useEffect, useState } from "react";
import { apiRequest, getAuthUser } from "./api";

export const AUTH_USER_UPDATED_EVENT = "auth:user-updated";

// Logged-in user's details. Shows the cached login user first, then
// refreshes from GET /auth/me (which also has image, designation, department).
// Dispatch AUTH_USER_UPDATED_EVENT on window after a profile change to refresh.
export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const cached = getAuthUser();
      if (active && cached) setUser((previous) => previous ?? cached);

      try {
        const data = await apiRequest("/auth/me");
        if (active && data.user) setUser(data.user);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    }

    loadUser();
    window.addEventListener(AUTH_USER_UPDATED_EVENT, loadUser);

    return () => {
      active = false;
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, loadUser);
    };
  }, []);

  return user;
}
