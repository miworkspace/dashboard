"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Folder,
  FileText,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

const initialForm = {
  name: "",
  slug: "",
  path: "",
  icon: "circle",
  type: "page",
  parent: "",
  actions: ["view"],
  isActive: true,
};

const availableActions = [
  { value: "view", label: "View" },
  { value: "create", label: "Create" },
  { value: "edit", label: "Edit" },
  { value: "delete", label: "Delete" },
];

function flattenMenus(menus = []) {
  return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children || [])]);
}

function MenuTree({ menus, onEdit, onDelete, onMove, movingId, depth = 0 }) {
  return menus.map((menu, index) => (
    <div key={menu._id}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {menu.type === "group" ? (
            <Folder className="shrink-0 text-orange-500" size={19} />
          ) : (
            <FileText className="shrink-0 text-gray-400" size={19} />
          )}

          <div className="min-w-0">
            <p className="font-medium text-gray-800 dark:text-gray-100">
              {menu.name}
            </p>

            <p className="truncate text-xs text-gray-500">
              {menu.type === "group" ? "Dropdown Group" : menu.path}
            </p>
          </div>

          <span
            className={`rounded-full px-2 py-1 text-xs ${
              menu.isActive
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {menu.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => onMove(menu, "up")}
              disabled={index === 0 || Boolean(movingId)}
              className="cursor-pointer rounded-l-lg p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 dark:text-gray-300"
              title="Move up"
              aria-label={`Move ${menu.name} up`}
            >
              <ArrowUp size={16} />
            </button>
            <span className="min-w-7 border-x border-gray-200 px-1 text-center font-mono text-xs text-gray-500 tabular-nums dark:border-gray-700">
              {index + 1}
            </span>
            <button
              type="button"
              onClick={() => onMove(menu, "down")}
              disabled={index === menus.length - 1 || Boolean(movingId)}
              className="cursor-pointer rounded-r-lg p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-600 dark:text-gray-300"
              title="Move down"
              aria-label={`Move ${menu.name} down`}
            >
              <ArrowDown size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onEdit(menu)}
            className="cursor-pointer rounded-lg p-2 text-blue-600 hover:bg-blue-50"
            title="Edit"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(menu)}
            className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {menu.children?.length > 0 && (
        <MenuTree
          menus={menu.children}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          movingId={movingId}
          depth={depth + 1}
        />
      )}
    </div>
  ));
}

export default function MenuManagementPage() {
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [movingId, setMovingId] = useState(null);
  const allMenus = flattenMenus(menus);

  const parentMenus = allMenus.filter(
    (menu) => menu.type === "group" && menu._id !== editingId,
  );

  // silent = true keeps the list on screen (used after reordering).
  async function loadMenus(silent = false) {
    try {
      if (!silent) setLoading(true);
      setError("");

      const data = await apiRequest("/rbac/menus");

      setMenus(data.menus || []);
    } catch (err) {
      setError(err.message || "Failed to load menus.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(menu, direction) {
    setMovingId(menu._id);
    setError("");
    setSuccess("");

    try {
      await apiRequest(`/rbac/menus/${menu._id}/move`, {
        method: "PATCH",
        body: { direction },
      });

      await loadMenus(true);
      window.dispatchEvent(new Event("rbac:menus-updated"));
    } catch (err) {
      setError(err.message || "Failed to change menu order.");
    } finally {
      setMovingId(null);
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function generateSlug(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleNameChange(value) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: editingId ? previous.slug : generateSlug(value),
    }));
  }

  function toggleAction(action) {
    setForm((previous) => ({
      ...previous,
      actions: previous.actions.includes(action)
        ? previous.actions.filter((item) => item !== action)
        : [...previous.actions, action],
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function handleEdit(menu) {
    setEditingId(menu._id);

    setForm({
      name: menu.name || "",
      slug: menu.slug || "",
      path: menu.path || "",
      icon: menu.icon || "circle",
      type: menu.type || "page",
      parent: menu.parent?._id || menu.parent || "",
      actions: menu.actions || ["view"],
      isActive: menu.isActive ?? true,
    });

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Order is managed with the up/down buttons; new menus go to the end.
      const payload = {
        ...form,
        path: form.type === "page" ? form.path : null,
        parent: form.type === "page" ? form.parent || null : null,
        actions: form.type === "page" ? form.actions : ["view"],
      };

      if (editingId) {
        await apiRequest(`/rbac/menus/${editingId}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        await apiRequest("/rbac/menus", {
          method: "POST",
          body: payload,
        });
      }

      // resetForm() clears messages, so set the success text afterwards.
      resetForm();
      setSuccess(
        editingId ? "Menu updated successfully." : "Menu created successfully.",
      );
      window.dispatchEvent(new Event("rbac:menus-updated"));
      await loadMenus(true);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(menu) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${menu.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest(`/rbac/menus/${menu._id}`, {
        method: "DELETE",
      });

      setSuccess("Menu deleted successfully.");
      window.dispatchEvent(new Event("rbac:menus-updated"));
      await loadMenus();

      if (editingId === menu._id) resetForm();
    } catch (err) {
      setError(err.message || "Failed to delete menu.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Menu Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and organize dashboard menus and pages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadMenus()}
          className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {editingId ? "Edit Menu" : "Add New Menu"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Menu Name *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. inventory"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug *</label>
            <input
              required
              value={form.slug}
              onChange={(e) =>
                updateField("slug", generateSlug(e.target.value))
              }
              placeholder="inventory"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Menu Type *
            </label>
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value;

                setForm((previous) => ({
                  ...previous,
                  type,
                  parent: type === "group" ? "" : previous.parent,
                  path: type === "group" ? "" : previous.path,
                  actions: type === "group" ? ["view"] : previous.actions,
                }));
              }}
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="page">Page</option>
              <option value="group">Dropdown Group</option>
            </select>
          </div>

          {form.type === "page" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Page URL *
              </label>
              <input
                required
                value={form.path}
                onChange={(e) => updateField("path", e.target.value)}
                placeholder="/dashboard/inventory"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          )}

          {form.type === "page" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Parent Menu
              </label>
              <select
                value={form.parent}
                onChange={(e) => updateField("parent", e.target.value)}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">No Parent (Root Menu)</option>

                {parentMenus.map((menu) => (
                  <option key={menu._id} value={menu._id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Icon Name</label>
            <input
              value={form.icon}
              onChange={(e) => updateField("icon", e.target.value)}
              placeholder="printer"
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          New menus are added at the end of their level. Use the up/down arrows
          in the list below to change the display order.
        </p>

        {form.type === "page" && (
          <div>
            <p className="mb-2 text-sm font-medium">Page Permissions</p>

            <div className="flex flex-wrap gap-4">
              {availableActions.map((action) => (
                <label
                  key={action.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.actions.includes(action.value)}
                    onChange={() => toggleAction(action.value)}
                    className="accent-orange-500"
                  />
                  {action.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            className="accent-orange-500"
          />
          Active Menu
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={17} />
            {saving ? "Saving..." : editingId ? "Update Menu" : "Create Menu"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="cursor-pointer rounded-lg border px-5 py-2.5 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="font-semibold">Existing Menus</h2>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-gray-500">Loading menus...</p>
        ) : menus.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No menus found.</p>
        ) : (
          <MenuTree
            menus={menus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMove}
            movingId={movingId}
          />
        )}
      </div>
    </div>
  );
}
