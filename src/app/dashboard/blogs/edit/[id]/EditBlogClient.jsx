"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import BlogPostForm from "@/components/blogs/BlogPostForm";
import { getBlog } from "@/lib/api/blogs";

// The API token lives in sessionStorage, so the blog is fetched on the client.
export default function EditBlogClient({ id }) {
  const [state, setState] = useState({ loading: true, error: "", blog: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    getBlog(id)
      .then((data) => {
        if (active) setState({ loading: false, error: "", blog: data.blog });
      })
      .catch((error) => {
        if (active) {
          setState({
            loading: false,
            error: error.message || "Failed to load blog.",
            blog: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  const retry = () => {
    setState({ loading: true, error: "", blog: null });
    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/blogs"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to blogs
      </Link>

      <PageHeader
        title="Edit Blog Post"
        description="Update the article and save your changes."
      />

      {state.loading && (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
          Loading blog...
        </div>
      )}

      {!state.loading && state.error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-900">Failed to load blog</p>
            <p className="mt-1 text-sm text-rose-700">{state.error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 cursor-pointer rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {state.blog && <BlogPostForm blogId={id} initialData={state.blog} />}
    </div>
  );
}
