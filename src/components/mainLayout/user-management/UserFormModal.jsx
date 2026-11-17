"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
} from "lucide-react";

import Modal from "./Modal";
import { getAccessToken, getRoles } from "../../../lib/api";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  image: "",
  accessRole: "",
  department: "",
  designation: "",
  role: "manager",
  password: "",
  isActive: true,
};

const DEPARTMENTS = [
  "IT",
  "Editorial",
  "News",
  "Digital Media",
  "Marketing",
  "Administration",
  "Accounts",
  "Other",
];

function Field({ label, required, error, hint, children }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-start gap-1 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50";

export default function UserFormModal({
  mode,
  initialUser,
  users,
  busy,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialUser || {}),
    accessRole:
      typeof initialUser?.accessRole === "object"
        ? initialUser.accessRole?._id || ""
        : initialUser?.accessRole || "",
    password: "",
    isActive: initialUser?.isActive ?? true,
  }));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [roles, setRoles] = useState([]);
  const isEdit = mode === "edit";

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await getRoles();
        setRoles((data.roles || []).filter((role) => role.isActive));
      } catch (error) {
        console.error(error);
        setServerError(error.message || "Could not load roles.");
      }
    }

    fetchRoles();
  }, []);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setServerError("");
  }

  function validate() {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const employeeId = form.employeeId.trim().toUpperCase();

    if (name.length < 2 || name.length > 100) {
      next.name = "Name must be between 2 and 100 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      next.email = "Enter a valid email address.";
    }
    if (form.phone.trim().length > 20) {
      next.phone = "Phone number must be 20 characters or fewer.";
    }
    if (employeeId.length > 50) {
      next.employeeId = "Employee ID must be 50 characters or fewer.";
    }
    if (form.image.trim() && !/^https?:\/\/\S+$/i.test(form.image.trim())) {
      next.image = "Enter a valid image URL starting with http:// or https://.";
    }
    if (form.department.trim().length > 100) {
      next.department = "Department must be 100 characters or fewer.";
    }
    if (form.designation.trim().length > 100) {
      next.designation = "Designation must be 100 characters or fewer.";
    }
    if (!["admin", "manager"].includes(form.role)) {
      next.role = "Select a valid role.";
    }
    if (!form.accessRole) {
      next.accessRole = "Select an access role.";
    }
    if (!isEdit && form.password.length < 6) {
      next.password = "Password must be at least 6 characters.";
    } else if (form.password && form.password.length < 6) {
      next.password = "New password must be at least 6 characters.";
    } else if (form.password.length > 128) {
      next.password = "Password must be 128 characters or fewer.";
    }

    const duplicateEmail = users.find(
      (user) =>
        user.email?.toLowerCase() === email && user.id !== initialUser?.id,
    );
    if (duplicateEmail) {
      next.email = "This email is already assigned to another user.";
    }

    const duplicateEmployeeId = employeeId
      ? users.find(
          (user) =>
            user.employeeId?.toUpperCase() === employeeId &&
            user.id !== initialUser?.id,
        )
      : null;
    if (duplicateEmployeeId) {
      next.employeeId = "This Employee ID is already in use.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }
  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setServerError("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    setServerError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsUploading(true);

    try {
      // Keep the existing URL unless a new image is selected.
      let imageUrl = form.image?.trim() || "";

      if (selectedImage) {
        const token = getAccessToken();

        if (!token) {
          throw new Error("Session expired. Please log in again.");
        }

        const data = new FormData();
        data.append("image", selectedImage);

        const response = await fetch(`${API_BASE}/images`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Image upload failed.");
        }

        imageUrl = result.image?.imageUrl || result.imageUrl;

        if (!imageUrl) {
          throw new Error("No image URL returned by the server.");
        }

        setField("image", imageUrl);
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        employeeId: form.employeeId.trim().toUpperCase(),
        image: imageUrl,
        department: form.department.trim(),
        designation: form.designation.trim(),
        role: form.role,
        accessRole: form.accessRole,
        isActive: Boolean(form.isActive),
      };

      if (!isEdit || form.password) {
        payload.password = form.password;
      }

      // User save happens only after a successful image upload.
      await onSave(payload);
    } catch (error) {
      setServerError(error.message || "Could not save user.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Edit user" : "Create new user"}
      subtitle={
        isEdit
          ? "Update employee details and access settings."
          : "Only an authorized administrator can create user accounts."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="max-h-[68vh] space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
          {serverError && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <UserRound className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Personal information
                </h3>
                <p className="text-xs text-slate-500">
                  Basic identity and contact details
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                <input
                  className={inputClass}
                  value={form.name || ""}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="e.g. Rahim Ahmed"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email address" required error={errors.email}>
                <input
                  className={inputClass}
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="name@dailyamardesh.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone number" error={errors.phone}>
                <input
                  className={inputClass}
                  type="tel"
                  value={form.phone || ""}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  autoComplete="tel"
                />
              </Field>
              <Field
                label="Profile Image"
                error={errors.image}
                hint="JPG, PNG or WebP · Maximum 5 MB"
              >
                <div className="space-y-3">
                  {imagePreview || form.image ? (
                    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <img
                        src={imagePreview || form.image}
                        alt="Profile preview"
                        className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800">
                          {selectedImage
                            ? "Image ready to upload"
                            : "Profile image"}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {selectedImage ? selectedImage.name : "Saved image"}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview("");
                            setField("image", "");
                          }}
                          className="mt-2 cursor-pointer text-sm font-medium text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition hover:border-orange-400 hover:bg-orange-50/50">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Upload size={22} />
                      </span>

                      <span className="text-sm font-semibold text-gray-800">
                        Click to select profile image
                      </span>

                      <span className="mt-1 text-xs text-gray-500">
                        JPG, PNG or WebP · Max 5 MB
                      </span>

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Employee details
                </h3>
                <p className="text-xs text-slate-500">
                  Workplace identity and team
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Employee ID"
                error={errors.employeeId}
                hint="Must be unique when provided."
              >
                <input
                  className={inputClass}
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setField("employeeId", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. 514"
                />
              </Field>
              <Field label="Department" error={errors.department}>
                <select
                  className={inputClass}
                  value={form.department || ""}
                  onChange={(e) => setField("department", e.target.value)}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Designation" error={errors.designation}>
                <input
                  className={inputClass}
                  value={form.designation || ""}
                  onChange={(e) => setField("designation", e.target.value)}
                  placeholder="e.g. IT Executive"
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Role & access
                </h3>
                <p className="text-xs text-slate-500">
                  Controls which admin features the account can use
                </p>
              </div>
            </div>
            {/* <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Access role" required error={errors.role}>
                <select
                  className={inputClass}
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                >
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Admin has full user-management access. Assign carefully.
                </p>
              </Field>
              <Field label="Account status">
                <button
                  type="button"
                  onClick={() => setField("isActive", !form.isActive)}
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm hover:bg-slate-50"
                  aria-pressed={Boolean(form.isActive)}
                >
                  <span className="flex items-center gap-2 text-slate-700">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${form.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                    />
                    {form.isActive
                      ? "Active — can sign in"
                      : "Inactive — sign-in blocked"}
                  </span>
                  <span
                    className={`relative h-6 w-11 rounded-full transition ${form.isActive ? "bg-orange-500" : "bg-slate-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${form.isActive ? "left-[22px]" : "left-0.5"}`}
                    />
                  </span>
                </button>
              </Field>
            </div> */}
            <Field label="Assign role" required error={errors.accessRole}>
              <select
                className={inputClass}
                name="accessRole"
                value={form.accessRole}
                onChange={(e) => setField("accessRole", e.target.value)}
                required
              >
                <option value="">Select Role</option>

                {roles.map((role) => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Account password
                </h3>
                <p className="text-xs text-slate-500">
                  {isEdit
                    ? "Leave blank to keep the current password."
                    : "Set a password and share it securely."}
                </p>
              </div>
            </div>
            <Field
              label={isEdit ? "New password (optional)" : "Password"}
              required={!isEdit}
              error={errors.password}
              hint="Use at least 6 characters. Never reuse your own password."
            >
              <div className="relative">
                <input
                  className={`${inputClass} pr-20`}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={
                    isEdit
                      ? "Leave blank to keep current password"
                      : "At least 6 characters"
                  }
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 cursor-pointer text-xs font-medium text-slate-500 hover:text-orange-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || isUploading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy || isUploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}

            {isUploading
              ? "Uploading image & saving..."
              : busy
                ? isEdit
                  ? "Saving changes..."
                  : "Creating user..."
                : isEdit
                  ? "Save changes"
                  : "Create user"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
