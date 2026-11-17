"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";

function getPageTitle(pathname) {
  const page = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .find((segment) => !/^[a-f\d]{24}$/i.test(segment));

  if (!page) return "Dashboard";

  const titles = {
    activity: "Activity Log",
    inventory: "Inventory",
    "master-data": "Master Data",
    "menu-management": "Menu Management",
    networks: "Networks",
    profile: "Profile",
    roles: "Role Management",
    rooms: "Rooms",
    settings: "Settings",
    switches: "Switches",
    users: "Users",
    vlans: "VLANs",
    "wifi-devices": "Wi-Fi Devices",
    "wifi-formatter": "Wi-Fi Formatter",
  };
  const title = titles[page] || page;

  return title
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ActivityTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (!pathname?.startsWith("/dashboard") || lastPath.current === pathname) {
      return;
    }

    lastPath.current = pathname;
    apiRequest("/activity/page-view", {
      method: "POST",
      body: { path: pathname, title: getPageTitle(pathname) },
    }).catch((error) => {
      console.error("Failed to record page view:", error);
    });
  }, [pathname]);

  return null;
}
