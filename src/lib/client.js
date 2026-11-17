const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function handleUnauthorized() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Avoid redirecting repeatedly
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const { headers: customHeaders = {}, body, ...restOptions } = options;

  const headers = {
    Accept: "application/json",
    ...customHeaders,
  };

  if (
    body !== undefined &&
    !(typeof FormData !== "undefined" && body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers,
    body:
      body !== undefined &&
      !(typeof FormData !== "undefined" && body instanceof FormData)
        ? JSON.stringify(body)
        : body,
  });

  // Token expired or invalid
  if (response.status === 401) {
    const { logout } = await import("@/lib/auth/session");

    logout();

    throw new Error("Session expired. Please login again.");
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status})`);
  }

  return data;
}
