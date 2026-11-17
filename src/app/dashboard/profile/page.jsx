"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
  Camera,
  Save,
  LockKeyhole,
  Eye,
  EyeOff,
  Loader2,
  UserRound,
} from "lucide-react";

import { apiRequest, getAuthUser } from "@/lib/api";
import { startTokenExpiryTimer } from "@/lib/auth/session";

const INITIAL_FORM = {
  id: "",
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  image: "",
  department: "",
  designation: "",
  role: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(INITIAL_FORM);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // Fetch logged-in user
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  async function fetchProfile() {
    try {
      setLoading(true);

      const response = await apiRequest("/auth/me");

      const user =
        response.user || response.data?.user || response.data || response;

      setProfile({
        id: user.id || user._id || "",
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        employeeId: user.employeeId || "",
        image: user.image || "",
        department: user.department || "",
        designation: user.designation || "",
        role: user.role || "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to load profile.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Profile image preview
  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({
        type: "error",
        text: "Please select a JPG, PNG, or WebP image.",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Image size must be less than 5MB.",
      });
      e.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  }

  // Update profile
  async function handleProfileUpdate(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      setSaving(true);

      const authUser = getAuthUser();
      const userId = profile.id || authUser?.id || authUser?._id;
      if (!userId) {
        throw new Error("Could not identify your account. Please sign in again.");
      }

      let image = profile.image;
      if (selectedImage) {
        const formData = new FormData();
        formData.append("image", selectedImage);

        const uploaded = await apiRequest("/images", {
          method: "POST",
          body: formData,
        });
        image =
          uploaded.image?.imageUrl || uploaded.imageUrl || uploaded.url || "";

        if (!image) {
          throw new Error("Image upload succeeded but no image URL was returned.");
        }
      }

      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        department: profile.department.trim(),
        designation: profile.designation.trim(),
        image,
      };

      const result = await apiRequest("/auth/me", {
        method: "PATCH",
        body: payload,
      });

      const updatedProfile = {
        ...profile,
        ...(result.user || {}),
        ...payload,
        id: userId,
      };
      setProfile(updatedProfile);
      setSelectedImage(null);
      setImagePreview("");

      if (authUser) {
        sessionStorage.setItem(
          "authUser",
          JSON.stringify({ ...authUser, ...payload, id: userId }),
        );
      }

      setMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handlePasswordChange(e) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (password.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      setMessage({
        type: "error",
        text: "New password and confirm password do not match.",
      });
      return;
    }

    try {
      setSaving(true);

      const result = await apiRequest("/auth/change-password", {
        method: "PATCH",
        body: {
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        },
      });

      if (!result.token || !Number.isFinite(result.expiresAt)) {
        throw new Error(
          "Password changed, but the session could not be refreshed. Please sign in again.",
        );
      }

      sessionStorage.setItem("accessToken", result.token);
      startTokenExpiryTimer(result.expiresAt);

      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to change password.",
      });
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <form onSubmit={handleProfileUpdate}>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update your profile details.
            </p>
          </div>

          <div className="p-5">
            {/* Profile Image */}
            <div className="mb-7 flex items-center gap-5">
              <div className="relative">
                {imagePreview || profile.image ? (
                  <img
                    src={imagePreview || profile.image}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full border-4 border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <UserRound size={40} />
                  </div>
                )}

                <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-orange-500 text-white">
                  <Camera size={15} />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {profile.designation}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG or WebP. Maximum 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                    className={`${inputClass} pl-10`}
                    placeholder="Your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Employee ID */}
              <div>
                <label className={labelClass}>Employee ID</label>
                <input
                  value={profile.employeeId}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                />
              </div>

              {/* Department */}
              <div>
                <label className={labelClass}>Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="department"
                    value={profile.department}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                    placeholder="Department"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className={labelClass}>Designation</label>
                <div className="relative">
                  <BriefcaseBusiness className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    name="designation"
                    value={profile.designation}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                    placeholder="Designation"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className={labelClass}>Account Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    value={profile.role}
                    readOnly
                    className={`${inputClass} cursor-not-allowed bg-gray-50 pl-10 capitalize text-gray-500`}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Role can only be changed by an administrator.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange}>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Change Password</h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep your account secure with a strong password.
            </p>
          </div>

          <div className="max-w-2xl space-y-5 p-5">
            {[
              {
                name: "currentPassword",
                label: "Current Password",
                placeholder: "Enter current password",
              },
              {
                name: "newPassword",
                label: "New Password",
                placeholder: "Enter new password",
              },
              {
                name: "confirmPassword",
                label: "Confirm New Password",
                placeholder: "Confirm new password",
              },
            ].map((field) => (
              <div key={field.name}>
                <label className={labelClass}>{field.label}</label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password[field.name]}
                    onChange={(e) =>
                      setPassword((prev) => ({
                        ...prev,
                        [field.name]: e.target.value,
                      }))
                    }
                    required
                    className={`${inputClass} pl-10 pr-11`}
                    placeholder={field.placeholder}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <LockKeyhole size={17} />
                )}
                Change Password
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
