const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get access token
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem("accessToken");
}

// Get logged-in user
export function getAuthUser() {
  if (typeof window === "undefined") return null;

  try {
    const user = sessionStorage.getItem("authUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

// Logout and redirect
export async function logoutAndRedirect() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("authUser");

  await fetch("/api/auth/logout", {
    method: "POST",
  }).catch(() => {});

  window.location.replace("/login");
}

// Check authentication errors
export function isAuthenticationError(message = "") {
  return /authentication|required.*token|token.*required|invalid token|token expired|session expired/i.test(
    message,
  );
}

// Main API request helper
export async function apiRequest(
  endpoint,
  { token, headers = {}, ...options } = {},
) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const accessToken = token ?? getAccessToken();

  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const body =
    hasBody && !isFormData && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    ...(hasBody ? { body } : {}),
    headers: {
      ...(hasBody && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
      ...headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      typeof window !== "undefined" &&
      (response.status === 401 || isAuthenticationError(data.message || ""))
    ) {
      await logoutAndRedirect();
    }

    throw new Error(data.message || "API request failed");
  }

  return data;
}

// ================================
// RBAC HELPERS
// ================================

// Get current user's RBAC sidebar menus
export async function getSidebarMenus() {
  return apiRequest("/rbac/sidebar");
}

// Get all available RBAC menus (Admin)
export async function getRBACMenus() {
  return apiRequest("/rbac/menus");
}

// Get all custom roles (Admin)
export async function getRoles() {
  return apiRequest("/rbac/roles");
}

// Get single custom role (Admin)
export async function getRoleById(id) {
  return apiRequest(`/rbac/roles/${id}`);
}

// Create custom role (Admin)
export async function createRole(payload) {
  return apiRequest("/rbac/roles", {
    method: "POST",
    body: payload,
  });
}

// Update custom role (Admin)
export async function updateRole(id, payload) {
  return apiRequest(`/rbac/roles/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

// Delete custom role (Admin)
export async function deleteRole(id) {
  return apiRequest(`/rbac/roles/${id}`, {
    method: "DELETE",
  });
}

// ================================
// RBAC PERMISSION HELPERS
// ================================

// Check if user is Super Admin
export function isSuperAdmin() {
  const user = getAuthUser();
  return user?.role === "admin";
}

// Check if user has access to a menu
export function hasMenuAccess(menuSlug) {
  if (isSuperAdmin()) return true;

  const user = getAuthUser();
  const permissions = user?.accessRole?.permissions || [];

  return permissions.some(
    (permission) =>
      permission.menu?.slug === menuSlug &&
      permission.actions?.includes("view"),
  );
}

// Check specific action permission
export function hasPermission(menuSlug, action) {
  if (isSuperAdmin()) return true;

  const user = getAuthUser();
  const permissions = user?.accessRole?.permissions || [];

  return permissions.some(
    (permission) =>
      permission.menu?.slug === menuSlug &&
      permission.actions?.includes(action),
  );
}
