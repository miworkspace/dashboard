import {
  getAccessToken,
  isAuthenticationError,
  logoutAndRedirect,
} from "../api";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

function getToken() {
  return getAccessToken();
}

export async function usersApi(path = "", options = {}) {
  const token = getToken();
  if (!token) {
    void logoutAndRedirect();
    throw new Error("Session expired. Please sign in again.");
  }

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}/users${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    if (
      response.status === 401 ||
      isAuthenticationError(payload.message || "")
    ) {
      void logoutAndRedirect();
      throw new Error(
        "Session expired or you are not logged in. Please sign in again.",
      );
    }
    if (response.status === 403) {
      throw new Error("You do not have permission to manage users.");
    }
    throw new Error(payload.message || "Request failed. Please try again.");
  }

  return payload;
}
