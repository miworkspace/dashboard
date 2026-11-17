"use client";

import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024; // must match dashboard-server/middleware/upload.js
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// imageUrl: what to preview (new file preview or the saved Cloudinary URL)
// onSelect({ file, preview }), onRemove(), onError(message)
export default function CoverImageField({ imageUrl, onSelect, onRemove, onError }) {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow choosing the same file again

    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      onError("Only JPEG, PNG and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_SIZE) {
      onError("Image must be 5MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onSelect({ file, preview: reader.result });
    reader.onerror = () => onError("Could not read the selected image.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload cover image"
      />

      {imageUrl ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          {/* Local data-URL preview or Cloudinary URL */}
          <img
            src={imageUrl}
            alt="Cover preview"
            className="aspect-video w-full bg-slate-100 object-cover"
          />
          <div className="flex gap-2 border-t border-slate-200 p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Change
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 transition hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600"
        >
          <ImagePlus className="h-7 w-7" />
          <span className="text-sm font-medium">Upload cover image</span>
          <span className="text-xs text-slate-400">JPEG, PNG or WebP · max 5MB</span>
        </button>
      )}
    </div>
  );
}
