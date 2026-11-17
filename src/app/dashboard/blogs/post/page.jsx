import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import BlogPostForm from "@/components/blogs/BlogPostForm";

export const metadata = {
  title: "Create Blog Post",
};

export default function CreateBlogPage() {
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
        title="Create Blog Post"
        description="Write, optimize and publish a new article."
      />

      <BlogPostForm />
    </div>
  );
}
