import { apiRequest } from "../api";

// All blog endpoints live on the Express API: NEXT_PUBLIC_API_URL + /blogs

export function getBlogs({ page = 1, limit = 12, status = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);

  return apiRequest(`/blogs?${params}`);
}

export function getBlog(id) {
  return apiRequest(`/blogs/${encodeURIComponent(id)}`);
}

// formData: FormData (multipart, so the cover image file can be included)
export function createBlog(formData) {
  return apiRequest("/blogs", { method: "POST", body: formData });
}

export function updateBlog(id, formData) {
  return apiRequest(`/blogs/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: formData,
  });
}

// Image inserted inside the editor content → returns { url }
export function uploadBlogImage(file, signal) {
  const formData = new FormData();
  formData.append("image", file);

  return apiRequest("/blogs/images", { method: "POST", body: formData, signal });
}

export function deleteBlog(id) {
  return apiRequest(`/blogs/${encodeURIComponent(id)}`, { method: "DELETE" });
}
