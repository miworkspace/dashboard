"use client";

let logoutTimer = null;

function getTokenExpiry(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const payload = JSON.parse(atob(base64));

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function clearTokenExpiryTimer() {
  if (logoutTimer !== null) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
}

export async function logout() {
  if (typeof window === "undefined") return;

  clearTokenExpiryTimer();

  sessionStorage.removeItem("authUser");
  sessionStorage.removeItem("tokenExpiresAt");

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });
  } finally {
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }
}

function scheduleExpiry(expiresAt) {
  clearTokenExpiryTimer();
  sessionStorage.setItem("tokenExpiresAt", String(expiresAt));
  const remainingTime = expiresAt - Date.now();
  if (remainingTime <= 0) {
    logout();
    return;
  }

  logoutTimer = setTimeout(() => {
    logout();
  }, remainingTime);
}

export function startTokenExpiryTimer(expiry) {
  if (typeof window === "undefined") return;

  // Prefer the expiration calculated by the server; accept a JWT for older callers.
  const expiresAt = Number.isFinite(expiry)
    ? expiry
    : getTokenExpiry(expiry);

  if (!expiresAt) {
    console.error("Token expiration could not be read.");
    return;
  }

  scheduleExpiry(expiresAt);
}

export function checkTokenExpiry() {
  if (typeof window === "undefined") return;

  const expiresAt = Number(sessionStorage.getItem("tokenExpiresAt"));
  if (expiresAt && Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    void logout();
  }
}

export function restoreTokenExpiryTimer() {
  if (typeof window === "undefined") return;

  const expiresAt = Number(sessionStorage.getItem("tokenExpiresAt"));

  // No saved expiry means no timer to restore.
  if (!expiresAt || !Number.isFinite(expiresAt)) return;

  scheduleExpiry(expiresAt);
}
