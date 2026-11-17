"use client";

import Modal from "./Modal";
import { LoaderCircle, Trash2 } from "lucide-react";

export default function DeleteModal({ user, busy, onClose, onConfirm }) {
  if (!user) return null;
  return (
    <Modal
      title="Delete user?"
      subtitle="This action cannot be undone."
      onClose={onClose}
    >
      <div className="px-5 py-5 sm:px-6">
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="text-sm">
            <p className="font-semibold text-red-900">Delete {user.name}?</p>
            <p className="mt-1 text-red-800">
              Their account will be permanently removed. Make sure this is
              allowed by your organization's retention policy.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete user
          </button>
        </div>
      </div>
    </Modal>
  );
}
