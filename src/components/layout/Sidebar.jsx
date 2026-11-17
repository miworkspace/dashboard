"use client";

import { useEffect, useState } from "react";
import { SidebarNavigation } from "./SidebarNavigation";

import {
  LayoutDashboard,
  Package,
  Network,
  GitBranch,
  Cable,
  MapPin,
  Activity,
  Settings,
  X,
  Wifi,
  Users,
  LogOut,
  ShieldCheck,
  UserCog,
  Circle,
  FolderKanban,
  ListChecks,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiRequest, getSidebarMenus } from "../../lib/api";
import { useCurrentUser } from "../../lib/useCurrentUser";

// Map Backend icon names to Lucide components
const ICONS = {
  "layout-dashboard": LayoutDashboard,
  package: Package,
  network: Network,
  "git-branch": GitBranch,
  cable: Cable,
  "map-pin": MapPin,
  activity: Activity,
  settings: Settings,
  wifi: Wifi,
  users: Users,
  "user-cog": UserCog,
  "shield-check": ShieldCheck,
  "folder-kanban": FolderKanban,
  "list-checks": ListChecks,
  "chart-no-axes-combined": ChartNoAxesCombined,
};

const ROLE_LABELS = {
  admin: "Super Admin",
  manager: "Manager",
};

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || "U"
  );
}

// "IT Engineer, IT Department" → falls back to the role name
function userSubtitle(user) {
  const parts = [user.designation, user.department].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");

  return (
    ROLE_LABELS[user.role] ||
    (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "")
  );
}

function UserAvatar({ user }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (user.image && !imageFailed) {
    return (
      // User-uploaded remote image; plain img avoids Next image host config
      <img
        src={user.image}
        alt={`${user.name || "User"} profile`}
        onError={() => setImageFailed(true)}
        className="h-9 w-9 shrink-0 rounded-full border border-slate-600 object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white"
      aria-hidden="true"
    >
      {getInitials(user.name)}
    </div>
  );
}

export function Sidebar({ mobileOpen, onCloseMobile }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [menus, setMenus] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Fetch sidebar menus from backend
  useEffect(() => {
    let mounted = true;

    async function fetchSidebarMenus() {
      try {
        const data = await getSidebarMenus();

        if (mounted && data.success) {
          setMenus(data.menus || []);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar menus:", error);
      } finally {
        if (mounted) {
          setMenuLoading(false);
        }
      }
    }

    fetchSidebarMenus();

    return () => {
      mounted = false;
    };
  }, []);

  // Active route check
  const isActive = (itemPath) => {
    if (itemPath === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };
  const toggleMenu = (menuId) => {
    setExpandedMenus((previous) => ({
      ...previous,
      [menuId]: !previous[menuId],
    }));
  };

  const hasActiveChild = (menu) => {
    return (menu.children || []).some(
      (child) => isActive(child.path) || hasActiveChild(child),
    );
  };

  useEffect(() => {
    const activeParents = {};

    const findActiveParents = (items) => {
      items.forEach((item) => {
        if (item.children?.length) {
          if (hasActiveChild(item)) {
            activeParents[item._id] = true;
          }

          findActiveParents(item.children);
        }
      });
    };

    findActiveParents(menus);
    setExpandedMenus((previous) => ({
      ...previous,
      ...activeParents,
    }));
  }, [menus, pathname]);

  // Logout
  async function handleLogout() {
    const confirmed = window.confirm("আপনি কি নিশ্চিতভাবে Logout করতে চান?");

    if (!confirmed) return;

    const token = sessionStorage.getItem("accessToken");

    try {
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token,
        });
      }
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("authUser");

      await fetch("/api/auth/logout", {
        method: "POST",
      }).catch((error) => {
        console.error("Local logout failed:", error);
      });

      router.replace("/login");
      router.refresh();
    }
  }

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800 selection:bg-rose-500 selection:text-white">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9">
            <Image
              src="/dailyamardesh-icon.png"
              alt="Logo"
              width={36}
              height={36}
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">
                Daily Amar Desh
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              IT Infrastructure Suite
            </p>
          </div>
        </div>

        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Status */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            NOC Core: Online
          </span>

          <span className="font-mono text-[10px] text-slate-500">v2.4 LTS</span>
        </div>
      </div>

      {/* Dynamic Navigation */}
      <nav
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto"
        aria-label="Main Navigation"
      >
        {menuLoading ? (
          <div className="space-y-3 px-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-10 rounded-lg bg-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          menus.map((item) => {
            const Icon = ICONS[item.icon] || Circle;
            const hasChildren = item.children?.length > 0;
            const active = item.path ? isActive(item.path) : false;
            const childActive = hasChildren && hasActiveChild(item);
            const isExpanded = expandedMenus[item._id];

            // Parent Menu
            if (item.type === "group" || hasChildren) {
              return (
                <div key={item._id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item._id)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-md font-medium transition-all ${
                      childActive
                        ? "text-white"
                        : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        childActive ? "text-white" : "text-slate-400"
                      }`}
                    />

                    <span className="flex-1 truncate">{item.name}</span>

                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  {/* Child Menus */}
                  {isExpanded && hasChildren && (
                    <div className="ml-4 space-y-1 border-l border-slate-700 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = ICONS[child.icon] || Circle;

                        const childIsActive = isActive(child.path);

                        return (
                          <Link
                            key={child._id}
                            href={child.path || "#"}
                            onClick={onCloseMobile}
                            aria-current={childIsActive ? "page" : undefined}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
                              childIsActive
                                ? "bg-rose-600 text-white font-semibold"
                                : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                            }`}
                          >
                            <ChildIcon size={15} className="shrink-0" />

                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Normal Page Menu
            return (
              <Link
                key={item._id}
                href={item.path || "#"}
                onClick={onCloseMobile}
                aria-current={active ? "page" : undefined}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-md font-medium transition-all text-left group ${
                  active
                    ? "bg-rose-600 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                />

                <span className="truncate">{item.name}</span>
              </Link>
            );
          })
        )}

        {!menuLoading && menus.length === 0 && (
          <p className="px-3 py-5 text-center text-sm text-slate-500">
            No accessible menus found.
          </p>
        )}
      </nav>

      {/* User Profile & Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/50">
          {currentUser ? (
            <Link
              href="/dashboard/profile"
              onClick={onCloseMobile}
              title="View profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md transition hover:opacity-90"
            >
              <UserAvatar key={currentUser.image || "none"} user={currentUser} />

              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.name || "User"}
                </p>

                <p className="text-[10px] text-slate-400 truncate">
                  {userSubtitle(currentUser)}
                </p>

                {currentUser.email && (
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentUser.email}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            // Skeleton while the user loads
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 animate-pulse rounded bg-slate-700" />
                <div className="h-2 w-16 animate-pulse rounded bg-slate-700" />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="shrink-0 cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
