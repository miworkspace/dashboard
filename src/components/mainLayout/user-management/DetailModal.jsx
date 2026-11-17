"use client";

import { Pencil } from "lucide-react";
import Modal from "./Modal";

function formatDate(value) {
  if (!value) return "Never";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Avatar({ user, size = "md" }) {
  const dimensions = size === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={`${user.name || "User"} profile`}
        className={`${dimensions} shrink-0 rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  const initials = (user?.name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700`}
    >
      {initials || "U"}
    </div>
  );
}

export default function DetailModal({ user, onClose, onEdit }) {
  if (!user) return null;

  const rows = [
    ["Email address", user.email],
    ["Phone number", user.phone || "—"],
    ["Employee ID", user.employeeId || "—"],
    ["Department", user.department || "—"],
    ["Designation", user.designation || "—"],
    ["Role", user.role || "—"],
    ["Account status", user.isActive ? "Active" : "Inactive"],
    ["Last login", formatDate(user.lastLoginAt)],
    ["Created at", formatDate(user.createdAt)],
    ["Updated at", formatDate(user.updatedAt)],
  ];

  return (
    <Modal
      title="User details"
      subtitle="Employee profile and account information"
      onClose={onClose}
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
          <Avatar user={user} size="lg" />

          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900">
              {user.name || "Unnamed user"}
            </h3>

            <p className="break-all text-sm text-slate-500">
              {user.email || "No email"}
            </p>

            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                user.isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <dl className="mt-5 divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[125px_minmax(0,1fr)] gap-3 py-3 text-sm"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="break-words font-medium text-slate-800">
                {value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onEdit(user)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <Pencil className="h-4 w-4" />
            Edit user
          </button>
        </div>
      </div>
    </Modal>
  );
}
