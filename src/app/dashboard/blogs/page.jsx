"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteBlog, getBlogs } from "@/lib/api/blogs";
import { hasPermission } from "@/lib/api";
import { useToast } from "@/lib/toastContext";

const PAGE_SIZE = 12;

const subscribeNoop = () => () => {};

const FILTERS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

function formatDate(date) {
  if (!date) return "No date";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }) {
  const published = status === "published";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
        published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function AllBlogsPage() {
  const toast = useToast();

  const [blogs, setBlogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getBlogs({ page, limit: PAGE_SIZE, status });
      setBlogs(data.blogs || []);
      setStats(data.stats || { total: 0, published: 0, draft: 0 });
      setPagination(data.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // Permissions come from sessionStorage, which only exists in the browser.
  // isClient is false during server render/hydration → no mismatch.
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const canCreate = isClient && hasPermission("blogs", "create");
  const canEdit = isClient && hasPermission("blogs", "edit");
  const canDelete = isClient && hasPermission("blogs", "delete");

  const changeFilter = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(
      `Delete "${blog.title}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(blog._id);

    try {
      await deleteBlog(blog._id);
      toast.success("Blog deleted.");

      // Go back a page if the last item on this page was deleted
      if (blogs.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchBlogs();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete blog.");
    } finally {
      setDeletingId(null);
    }
  };

  const createButton = canCreate && (
    <Link
      href="/dashboard/blogs/post"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-200"
    >
      <Plus className="h-4 w-4" />
      Create Blog
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blogs"
        description="Manage blog posts, edit content and publish new articles."
        actions={createButton}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Blogs", value: stats.total, color: "text-slate-900" },
          { label: "Published", value: stats.published, color: "text-emerald-600" },
          { label: "Drafts", value: stats.draft, color: "text-amber-600" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold ${item.color}`}>
              {loading ? "–" : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2" role="tablist" aria-label="Filter blogs by status">
        {FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            role="tab"
            aria-selected={status === filter.value}
            onClick={() => changeFilter(filter.value)}
            className={`cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              status === filter.value
                ? "bg-orange-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
          Loading blogs...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-900">Failed to load blogs</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={fetchBlogs}
              className="mt-4 cursor-pointer rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && blogs.length === 0 && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
            <FileText className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No blogs found
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {status
              ? "No blog posts with this status."
              : "Create your first blog post to get started."}
          </p>
          {!status && <div className="mt-5">{createButton}</div>}
        </div>
      )}

      {!loading && !error && blogs.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => {
              const isDeleting = deletingId === blog._id;
              const coverUrl = blog.coverImage?.url;

              return (
                <article
                  key={blog._id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={blog.title || "Blog cover"}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <FileText className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <StatusBadge status={blog.status} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    {blog.category && (
                      <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-600">
                        {blog.category}
                      </span>
                    )}

                    <h2 className="line-clamp-2 text-lg font-bold leading-7 text-slate-900">
                      {blog.title || "Untitled Blog"}
                    </h2>

                    {blog.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {blog.excerpt}
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-slate-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(blog.updatedAt || blog.createdAt)}
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                        {canEdit && (
                          <Link
                            href={`/dashboard/blogs/edit/${blog._id}`}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(blog)}
                            aria-label={`Delete ${blog.title}`}
                            title="Delete blog"
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
