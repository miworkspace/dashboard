import { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Plus,
  AlertTriangle,
  ChevronDown,
  Layers,
  Network,
  Package,
  Cable,
  MapPin,
  LogOut,
} from "lucide-react";
import { useRouter } from "../../lib/routerContext";
import { apiRequest } from "../../lib/api";

export function Topbar({ onOpenMobile }) {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const { navigate } = useRouter();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    const confirmed = window.confirm("আপনি কি নিশ্চিতভাবে Logout করতে চান?");

    if (!confirmed) return;

    const token = sessionStorage.getItem("accessToken");

    try {
      // Revoke the session on the backend first.
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
          token,
        });
      }
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      // Always clear the local session.
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("authUser");
      await fetch("/api/auth/logout", { method: "POST" }).catch((error) => {
        console.error("Local logout failed:", error);
      });

      navigate("/login");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Amar Desh
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-700">
              IT Management System
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-sm font-medium text-red-400 transition hover:bg-red-500 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
    </>
  );
}
