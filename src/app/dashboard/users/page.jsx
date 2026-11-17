"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  LoaderCircle,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { usersApi } from "../../../lib/api/users";
import { apiRequest } from "../../../lib/api";
import UserFormModal from "../../../components/mainLayout/user-management/UserFormModal";
import DetailModal from "../../../components/mainLayout/user-management/DetailModal";
import DeleteModal from "../../../components/mainLayout/user-management/DeleteModal";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50";

function initials(name = "") {
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

  return user?.image ? (
    // Remote user-uploaded image URL; use an ordinary img to avoid Next image-host config.
    <img
      src={user.image}
      alt={`${user.name || "User"} profile`}
      className={`${dimensions} rounded-full border border-slate-200 object-cover`}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700 ring-1 ring-orange-200`}
      aria-label={`${user?.name || "User"} initials`}
    >
      {initials(user?.name)}
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await usersApi("");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setPageError(error.message || "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...users]
      .filter((user) => {
        const matchesSearch =
          !search ||
          [
            user.name,
            user.email,
            user.employeeId,
            user.department,
            user.designation,
            user.phone,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search),
          );
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" ? user.isActive : !user.isActive);
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        const delta = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return sortNewest ? delta : -delta;
      });
  }, [users, query, roleFilter, statusFilter, sortNewest]);

  const activeCount = users.filter((user) => user.isActive).length;
  const adminCount = users.filter(
    (user) => user.role === "admin" && user.isActive,
  ).length;

  async function saveUser(payload) {
    setBusy(true);
    setNotice("");
    try {
      if (modal?.mode === "edit") {
        await usersApi(`/${modal.user.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotice("User details updated successfully.");
        console.log("User details updated successfully.", payload);
      } else {
        await apiRequest("/users", {
          method: "POST",
          body: payload,
        });
        setNotice("New user created successfully.");
      }
      setModal(null);
      await loadUsers();
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(user) {
    const nextStatus = !user.isActive;
    const message = nextStatus
      ? `Activate ${user.name}'s account?`
      : `Deactivate ${user.name}'s account? They may lose access immediately.`;
    if (!window.confirm(message)) return;

    setPageError("");
    setNotice("");
    try {
      await usersApi(`/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: nextStatus }),
      });
      setNotice(
        `Account ${nextStatus ? "activated" : "deactivated"} successfully.`,
      );
      await loadUsers();
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function deleteUser() {
    // Delete modal থেকে নির্বাচিত user নাও
    const userToDelete = modal?.user;

    if (!userToDelete) {
      setPageError("No user selected for deletion.");
      return;
    }

    setBusy(true);
    setPageError("");
    setNotice("");

    try {
      await usersApi(`/${userToDelete.id}`, {
        method: "DELETE",
      });

      setNotice("User deleted successfully.");
      setModal(null);

      // তালিকা আবার লোড করো
      await loadUsers();
    } catch (error) {
      setPageError(error.message || "Could not delete user.");
    } finally {
      setBusy(false);
    }
  }

  function openEdit(user) {
    setSelectedUser(null);
    setModal({ mode: "edit", user });
  }

  return (
    <main className="min-h-screen bg-slate-50/80 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-orange-700">User Management</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              User management
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
              Manage authorized IT accounts, employee details and system access.
            </p>
          </div>
          <button
            onClick={() => setModal({ mode: "create", user: null })}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
          >
            <UserRoundPlus className="h-4 w-4" /> Add new user
          </button>
        </div>

        {notice && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" /> {notice}
            <button
              onClick={() => setNotice("")}
              className="ml-auto cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {pageError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{pageError}</span>
            <button
              onClick={() => setPageError("")}
              className="ml-auto cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Total users
              </span>
              <span className="rounded-xl bg-orange-50 p-2.5 text-orange-700">
                <Users className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {users.length}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Registered system accounts
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Active accounts
              </span>
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <Activity className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {activeCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">Can access the system</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Active admins
              </span>
              <span className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {adminCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Accounts with admin role
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Inactive accounts
              </span>
              <span className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Clock3 className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 text-3xl font-bold tracking-tight">
              {users.length - activeCount}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Sign-in currently blocked
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">All users</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {filteredUsers.length} matching{" "}
                  {filteredUsers.length === 1 ? "account" : "accounts"}
                </p>
              </div>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_170px_170px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Search name, email, employee ID..."
                  aria-label="Search users"
                />
              </div>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`${inputClass} pl-9`}
                  aria-label="Filter by role"
                >
                  <option value="all">All roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={inputClass}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={() => setSortNewest((value) => !value)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <ArrowUpDown className="h-4 w-4" />{" "}
                {sortNewest ? "Newest first" : "Oldest first"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-4 py-3.5">Employee details</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Last login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center text-sm text-slate-500"
                    >
                      <LoaderCircle className="mx-auto mb-3 h-6 w-6 animate-spin text-orange-600" />
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="mt-3 font-medium text-slate-800">
                        No users found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or create a new user.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                              {user.name}
                            </p>
                            <p className="mt-1 flex max-w-[240px] items-center gap-1 truncate text-xs text-slate-500">
                              <Mail className="h-3 w-3 shrink-0" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {user.employeeId || "No employee ID"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.department || "No department"}
                          {user.designation ? ` · ${user.designation}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${user.role === "admin" ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "bg-slate-100 text-slate-700"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? "text-emerald-700" : "text-slate-500"}`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="View details"
                            aria-label={`View ${user.name}`}
                            onClick={() => setSelectedUser(user)}
                            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            title="Edit user"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => openEdit(user)}
                            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title={
                              user.isActive
                                ? "Deactivate user"
                                : "Activate user"
                            }
                            aria-label={`${user.isActive ? "Deactivate" : "Activate"} ${user.name}`}
                            onClick={() => toggleStatus(user)}
                            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {user.isActive ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <ShieldAlert className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            title="Delete user"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => setModal({ mode: "delete", user })}
                            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-600" /> Admin-only
              user management
            </span>
          </div>
        </section>
      </div>

      {modal?.mode === "create" && (
        <UserFormModal
          mode="create"
          users={users}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={saveUser}
        />
      )}
      {modal?.mode === "edit" && (
        <UserFormModal
          key={modal.user.id}
          mode="edit"
          initialUser={modal.user}
          users={users}
          busy={busy}
          onClose={() => setModal(null)}
          onSave={saveUser}
        />
      )}
      {modal?.mode === "delete" && (
        <DeleteModal
          user={modal.user}
          busy={busy}
          onClose={() => !busy && setModal(null)}
          onConfirm={deleteUser}
        />
      )}
      {selectedUser && (
        <DetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={openEdit}
          Avatar={Avatar}
          formatDate={formatDate}
        />
      )}
    </main>
  );
}
