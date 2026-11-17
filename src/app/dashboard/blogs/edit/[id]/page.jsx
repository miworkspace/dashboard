import EditBlogClient from "./EditBlogClient";

export const metadata = {
  title: "Edit Blog Post",
};

export default async function EditBlogPage({ params }) {
  const { id } = await params;

  return <EditBlogClient id={id} />;
}
