"use client";

import { useState } from "react";
import { Sidebar } from "../../components/layout/Sidebar";
import { Topbar } from "../../components/layout/Topbar";
import { RouterProvider } from "../../lib/routerContext";
import { ToastProvider } from "../../lib/toastContext";
import SessionGuard from "../../components/auth/SessionGuard";
import ActivityTracker from "../../components/auth/ActivityTracker";

export default function DashboardLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <RouterProvider>
        <SessionGuard />
        <ActivityTracker />
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar onOpenMobile={() => setMobileSidebarOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </RouterProvider>
    </ToastProvider>
  );
}
