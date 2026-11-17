"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Cable,
  ChartNoAxesCombined,
  ChevronDown,
  Circle,
  FileText,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Network,
  Package,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Wifi,
  Printer,
  Server,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

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
  printer: Printer,
  server: Server,
  "file-text": FileText,
};

function MenuItems({ menus, pathname, onNavigate }) {
  const [openMenus, setOpenMenus] = useState([]);

  useEffect(() => {
    const activeParents = menus
      .filter(
        (menu) =>
          menu.type === "group" &&
          menu.children?.some(
            (child) =>
              pathname === child.path || pathname.startsWith(`${child.path}/`),
          ),
      )
      .map((menu) => menu._id);

    setOpenMenus((previous) => [...new Set([...previous, ...activeParents])]);
  }, [menus, pathname]);

  const toggleMenu = (id) => {
    setOpenMenus((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const isActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="space-y-1">
      {menus.map((menu) => {
        const Icon = ICONS[menu.icon] || Circle;

        // Parent dropdown
        if (menu.type === "group") {
          const isOpen = openMenus.includes(menu._id);

          if (!menu.children?.length) return null;

          return (
            <div key={menu._id}>
              <button
                type="button"
                onClick={() => toggleMenu(menu._id)}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="flex items-center gap-3">
                  <Icon size={19} />
                  {menu.name}
                </span>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
                  <MenuItems
                    menus={menu.children}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                </div>
              )}
            </div>
          );
        }

        // Normal page
        return (
          <Link
            key={menu._id}
            href={menu.path || "/dashboard"}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive(menu.path)
                ? "bg-orange-500 text-white"
                : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Icon size={19} />
            {menu.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNavigation({ onNavigate }) {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function fetchMenus() {
      try {
        const data = await apiRequest("/rbac/sidebar");

        if (mounted && data.success) {
          setMenus(data.menus || []);
        }
      } catch (error) {
        if (mounted) {
          setError(error.message || "Unable to load menu.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMenus();

    window.addEventListener("rbac:menus-updated", fetchMenus);

    return () => {
      mounted = false;
      window.removeEventListener("rbac:menus-updated", fetchMenus);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 px-3 py-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="px-4 py-3 text-sm text-red-500">{error}</p>;
  }

  return (
    <MenuItems menus={menus} pathname={pathname} onNavigate={onNavigate} />
  );
}
