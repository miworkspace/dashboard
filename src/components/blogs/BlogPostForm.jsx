"use client";

import { useEffect, useEffectEvent, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send } from "lucide-react";
import ArticleSeoPanel from "./ArticleSeoPanel";
import CoverImageField from "./CoverImageField";
import { cardClass, inputClass, labelClass } from "./formStyles";
import { createBlog, updateBlog } from "@/lib/api/blogs";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/lib/toastContext";

// CKEditor needs the browser, so it is loaded on the client only
const BlogEditor = dynamic(() => import("./BlogEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-115 items-center justify-center rounded-xl border border-slate-200 text-sm text-slate-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading editor...
    </div>
  ),
});

const CATEGORIES = [
  "Development",
  "Technology",
  "Career",
  "Mindset",
  "SEO",
  "Digital Marketing",
  "Entrepreneurship",
  "Tutorial",
  "Other",
];

const hasText = (html = "") =>
  Boolean(html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim());

function toFormState(blog) {
  return {
    title: blog?.title || "",
    slug: blog?.slug || "",
    content: blog?.content || "",
    category: blog?.category || "",
    tags: Array.isArray(blog?.tags) ? blog.tags.join(", ") : "",
    excerpt: blog?.excerpt || "",
    seoTitle: blog?.seoTitle || "",
    seoDescription: blog?.seoDescription || "",
    focusKeyword: blog?.focusKeyword || "",
    faqs: Array.isArray(blog?.faqs) ? blog.faqs : [],
  };
}

// blogId + initialData → edit mode, otherwise create mode
export default function BlogPostForm({ blogId = null, initialData = null }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(blogId);

  const [form, setForm] = useState(() => toFormState(initialData));
  // Last saved version (updated after a Ctrl+S save in edit mode)
  const [savedBlog, setSavedBlog] = useState(initialData);
  // Slug follows the title until the user edits the slug by hand
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [cover, setCover] = useState({ file: null, preview: "", removed: false });
  // "published" | "draft" while saving, otherwise null
  const [saving, setSaving] = useState(null);
  const [dirty, setDirty] = useState(false);

  const savedCoverUrl = cover.removed ? "" : savedBlog?.coverImage?.url || "";
  const coverUrl = cover.preview || savedCoverUrl;
  const wasPublished = savedBlog?.status === "published";

  const categories =
    form.category && !CATEGORIES.includes(form.category)
      ? [form.category, ...CATEGORIES]
      : CATEGORIES;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const updateCover = (next) => {
    setCover(next);
    setDirty(true);
  };

  const handleTitleChange = (value) => {
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleSlugChange = (value) => {
    setSlugTouched(true);
    updateField("slug", slugify(value, { final: false }));
  };

  const generateSlug = () => {
    setSlugTouched(false);
    updateField("slug", slugify(form.title));
  };

  const validate = () => {
    if (!form.title.trim()) return "Please enter a blog title.";
    if (!slugify(form.slug)) return "Please enter a valid slug.";
    if (!hasText(form.content)) return "Please write your blog content.";
    return "";
  };

  const buildFormData = (status) => {
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const faqs = form.faqs.filter(
      (faq) => faq.question?.trim() && faq.answer?.trim(),
    );

    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("slug", slugify(form.slug));
    data.append("content", form.content);
    data.append("category", form.category);
    data.append("tags", JSON.stringify(tags));
    data.append("excerpt", form.excerpt.trim());
    data.append("seoTitle", form.seoTitle.trim());
    data.append("seoDescription", form.seoDescription.trim());
    data.append("focusKeyword", form.focusKeyword.trim());
    data.append("faqs", JSON.stringify(faqs));
    data.append("status", status);

    if (cover.file) {
      data.append("coverImage", cover.file);
    } else if (isEdit && cover.removed) {
      data.append("removeCoverImage", "true");
    }

    return data;
  };

  // stay=true (Ctrl+S): keep editing instead of going back to the list
  const submit = async (status, { stay = false } = {}) => {
    const error = validate();
    if (error) {
      toast.error(error, "Missing information");
      return;
    }

    setSaving(status);

    try {
      const formData = buildFormData(status);
      const result = isEdit
        ? await updateBlog(blogId, formData)
        : await createBlog(formData);

      toast.success(
        result.message ||
          (status === "draft" ? "Draft saved." : "Blog published."),
      );
      setDirty(false);

      if (!stay) {
        router.push("/dashboard/blogs");
      } else if (!isEdit) {
        // New blog now exists → continue in edit mode
        router.replace(`/dashboard/blogs/edit/${result.blog._id}`);
      } else {
        setSavedBlog(result.blog);
        setCover({ file: null, preview: "", removed: false });
        setSaving(null);
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
      setSaving(null);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit("published");
  };

  // Ctrl+S / Cmd+S: save without changing the status (new blogs → draft)
  const onSaveShortcut = useEffectEvent((event) => {
    if (!(event.ctrlKey || event.metaKey) || event.key?.toLowerCase() !== "s") {
      return;
    }
    event.preventDefault();
    if (!saving) submit(wasPublished ? "published" : "draft", { stay: true });
  });

  useEffect(() => {
    // window (not the form) so it also works in editor fullscreen mode
    window.addEventListener("keydown", onSaveShortcut);
    return () => window.removeEventListener("keydown", onSaveShortcut);
  }, []);

  // Warn before closing/reloading the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return;

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const confirmLeave = (event) => {
    if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) {
      event.preventDefault();
    }
  };

  const primaryLabel = isEdit && wasPublished ? "Update" : "Publish";

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      {/* ===== Main column ===== */}
      <div className="min-w-0 space-y-6">
        <section className={`${cardClass} space-y-5`}>
          <div>
            <label htmlFor="title" className={labelClass}>
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              maxLength={200}
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter your blog title"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="slug" className={labelClass}>
                Slug <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateSlug}
                className="mb-1.5 cursor-pointer text-xs font-medium text-orange-600 hover:text-orange-700"
              >
                Generate from title
              </button>
            </div>
            <input
              id="slug"
              type="text"
              maxLength={200}
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={() => {
                const clean = slugify(form.slug);
                if (clean !== form.slug) updateField("slug", clean);
              }}
              placeholder="your-blog-slug"
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="excerpt" className={labelClass}>
                Excerpt
              </label>
              <span className="text-xs text-slate-400">
                {form.excerpt.length}/300
              </span>
            </div>
            <textarea
              id="excerpt"
              rows={3}
              maxLength={300}
              value={form.excerpt}
              onChange={(e) => updateField("excerpt", e.target.value)}
              placeholder="Short summary for blog cards and social previews"
              className={`${inputClass} resize-none`}
            />
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Content <span className="text-rose-500">*</span>
          </h2>
          <BlogEditor
            initialData={initialData?.content || ""}
            onChange={(value) => updateField("content", value)}
          />
        </section>

        <ArticleSeoPanel
          values={form}
          onChange={updateField}
          hasCoverImage={Boolean(coverUrl)}
        />
      </div>

      {/* ===== Sidebar ===== */}
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <section className={cardClass}>
          <h2 className="text-base font-semibold text-slate-900">Publish</h2>
          {isEdit && (
            <p className="mt-1 text-sm text-slate-500">
              Current status:{" "}
              <span
                className={
                  wasPublished
                    ? "font-medium text-emerald-600"
                    : "font-medium text-amber-600"
                }
              >
                {wasPublished ? "Published" : "Draft"}
              </span>
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={Boolean(saving)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === "published" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {saving === "published" ? "Saving..." : primaryLabel}
            </button>

            <button
              type="button"
              onClick={() => submit("draft")}
              disabled={Boolean(saving)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving === "draft" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving === "draft"
                ? "Saving..."
                : isEdit && wasPublished
                  ? "Unpublish (save as draft)"
                  : "Save as draft"}
            </button>

            <Link
              href="/dashboard/blogs"
              onClick={confirmLeave}
              className="rounded-xl px-4 py-2 text-center text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              Cancel
            </Link>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            {dirty ? (
              <span className="text-amber-600">Unsaved changes · </span>
            ) : null}
            Press{" "}
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono">
              S
            </kbd>{" "}
            to quick save
          </p>
        </section>

        <section className={cardClass}>
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Cover Image
          </h2>
          <CoverImageField
            imageUrl={coverUrl}
            onSelect={({ file, preview }) =>
              updateCover({ ...cover, file, preview })
            }
            onRemove={() =>
              updateCover({ file: null, preview: "", removed: true })
            }
            onError={(message) => toast.error(message, "Invalid image")}
          />
        </section>

        <section className={`${cardClass} space-y-5`}>
          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tags" className={labelClass}>
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="Career, Engineering"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Separate tags with commas.
            </p>
          </div>
        </section>
      </aside>
    </form>
  );
}
