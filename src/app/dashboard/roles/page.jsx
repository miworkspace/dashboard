"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Loader2,
  X,
  Save,
} from "lucide-react";

import {
  createRole,
  deleteRole,
  apiRequest,
  getRoles,
  updateRole,
} from "@/lib/api";

const ACTIONS = [
  { value: "view", label: "View" },
  { value: "create", label: "Create" },
  { value: "edit", label: "Edit" },
  { value: "delete", label: "Delete" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  permissions: [],
};

function flattenMenus(menus = []) {
  return menus.flatMap((menu) => [
    menu,
    ...flattenMenus(menu.children || []),
  ]);
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [availableMenus, setAvailableMenus] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);

      const [roleData, menuData] = await Promise.all([
        getRoles(),
        apiRequest("/rbac/menus"),
      ]);

      setRoles(roleData.roles || []);
      const pageMenus = flattenMenus(menuData.menus || []).filter(
        (menu) =>
          (menu.type === "page" ||
            (!menu.type &&
              typeof menu.path === "string" &&
              menu.path.startsWith("/"))) &&
          menu.isActive,
      );
      setAvailableMenus(pageMenus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingId(role._id);

    setForm({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions.map((item) => ({
        menu: typeof item.menu === "object" ? item.menu._id : item.menu,
        actions: [...item.actions],
      })),
    });

    setError("");
    setModalOpen(true);
  };

  const togglePermission = (menuId, action) => {
    setForm((previous) => {
      const permissions = [...previous.permissions];

      const index = permissions.findIndex((item) => item.menu === menuId);

      if (index === -1) {
        permissions.push({
          menu: menuId,
          actions: [action],
        });
      } else {
        const current = permissions[index];

        const actions = current.actions.includes(action)
          ? current.actions.filter((item) => item !== action)
          : [...current.actions, action];

        if (actions.length === 0) {
          permissions.splice(index, 1);
        } else {
          permissions[index] = {
            ...current,
            actions,
          };
        }
      }

      return {
        ...previous,
        permissions,
      };
    });
  };

  const hasPermission = (menuId, action) => {
    return form.permissions.some(
      (item) => item.menu === menuId && item.actions.includes(action),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateRole(editingId, form);
      } else {
        await createRole(form);
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);

      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      await deleteRole(id);

      await fetchData();
    } catch (err) {
      window.alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage roles and page permissions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-white hover:bg-orange-600"
        >
          <Plus size={18} />
          Create Role
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Role Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Permissions</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {roles.map((role) => (
              <tr key={role._id} className="border-t">
                <td className="p-4 font-medium">{role.name}</td>

                <td className="p-4 text-gray-500">{role.description || "—"}</td>

                <td className="p-4">{role.permissions.length} Pages</td>

                <td className="p-4">
                  <span
                    className={
                      role.isActive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {role.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => openEditModal(role)}
                      className="cursor-pointer text-blue-600"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(role._id)}
                      className="cursor-pointer text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {roles.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No roles found. Create your first role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold">
                  {editingId ? "Edit Role" : "Create New Role"}
                </h2>
                <p className="text-xs text-gray-500">
                  Configure page access and permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer text-gray-500"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Role Name
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. HR Manager"
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Role description..."
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <h3 className="mb-3 font-semibold">Page Permissions</h3>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left">Page</th>

                        {ACTIONS.map((action) => (
                          <th key={action.value} className="p-3 text-center">
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {availableMenus.map((menu) => (
                        <tr key={menu._id} className="border-t">
                          <td className="p-3 font-medium">
                            {menu.name}
                            <p className="text-xs text-gray-400">
                              {menu.group}
                            </p>
                          </td>

                          {ACTIONS.map((action) => {
                            const available = menu.actions.includes(
                              action.value,
                            );

                            return (
                              <td
                                key={action.value}
                                className="p-3 text-center"
                              >
                                <input
                                  type="checkbox"
                                  disabled={!available}
                                  checked={
                                    available &&
                                    hasPermission(menu._id, action.value)
                                  }
                                  onChange={() =>
                                    togglePermission(menu._id, action.value)
                                  }
                                  className="h-4 w-4 cursor-pointer accent-orange-500 disabled:cursor-not-allowed"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-lg border px-4 py-2"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                type="submit"
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {editingId ? "Update Role" : "Save Role"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
