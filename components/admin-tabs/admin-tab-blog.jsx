"use client"

import { useState, useEffect } from "react"
import RichTextEditor from "@/components/rich-text-editor"

export default function AdminTabBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    featuredImage: "",
    authorName: "",
    slug: "",
    seo_title: "",
    seo_slug: "",
    seo_description: "",
    focus_keyphrase: "",
  })

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)

  const generateSlug = (val) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
  }

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchBlogPosts()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [currentPage])

  const fetchBlogPosts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      })

      const response = await fetch(`/api/blog?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        if (data.pagination && typeof data.pagination.total_pages === "number") {
          setTotalPages(data.pagination.total_pages)
        } else {
          setTotalPages(1)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching blog posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/blog/${formData.slug}` : "/api/blog"
      const method = editingId ? "PUT" : "POST"

      const { title, excerpt, content, category, tags, featuredImage, authorName, seo_title, seo_slug, seo_description, focus_keyphrase } = formData

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ title, excerpt, content, category, tags, featuredImage, authorName, seo_title, seo_slug, seo_description, focus_keyphrase }),
      })

      if (response.ok) {
        // After save, refresh list from first page
        setCurrentPage(1)
        fetchBlogPosts()
        setShowForm(false)
        setEditingId(null)
        setFormData({
          title: "",
          excerpt: "",
          content: "",
          category: "",
          tags: "",
          featuredImage: "",
          authorName: "",
          slug: "",
          seo_title: "",
          seo_slug: "",
          seo_description: "",
          focus_keyphrase: "",
        })
        setIsSlugManuallyEdited(false)
        setImagePreview(null)
      } else {
        const err = await response.json()
        alert(err.message || "Failed to save blog post")
      }
    } catch (error) {
      console.error("[v0] Error saving blog post:", error)
    }
  }

  const handleDelete = async (slug) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      try {
        const response = await fetch(`/api/blog/${slug}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (response.ok) {
          // If deletion makes current page empty, go back a page if possible
          fetchBlogPosts()
        }
      } catch (error) {
        console.error("[v0] Error deleting blog post:", error)
      }
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)

      const res = await fetch("/api/upload/blog-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: uploadData,
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to upload image")
        return
      }

      const data = await res.json()
      setFormData((prev) => ({ ...prev, featuredImage: data.image_path }))
      setImagePreview(data.image_path)
    } catch (error) {
      console.error("[v0] Error uploading blog image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (post) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      featuredImage: post.featuredImage || post.featured_image || "",
      authorName: post.author_name || "",
      slug: post.slug,
      seo_title: post.seo_title || "",
      seo_slug: post.seo_slug || "",
      seo_description: post.seo_description || "",
      focus_keyphrase: post.focus_keyphrase || "",
    })
    setIsSlugManuallyEdited(!!post.seo_slug)
    setEditingId(post.id)
    setImagePreview(post.featuredImage || post.featured_image || "")
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Blog Posts</h2>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                title: "",
                excerpt: "",
                content: "",
                category: "",
                tags: "",
                featuredImage: "",
                authorName: "",
                slug: "",
                seo_title: "",
                seo_slug: "",
                seo_description: "",
                focus_keyphrase: "",
              })
              setIsSlugManuallyEdited(false)
              setImagePreview(null)
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            + New Blog Post
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-background p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">{editingId ? "Edit Blog Post" : "Create New Blog Post"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
              <label className="block">
                <span className="text-sm font-medium mb-2 block text-foreground">Featured Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm border border-border rounded-lg p-2 cursor-pointer bg-background"
                />
              </label>
              {imagePreview && (
                <div className="mt-3 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded border border-border" />
                  <div className="text-xs text-muted-foreground break-all">{formData.featuredImage}</div>
                </div>
              )}
              {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Blog Title</label>
              <input
                type="text"
                placeholder="Blog Title"
                value={formData.title}
                onChange={(e) => {
                  const val = e.target.value
                  setFormData((prev) => {
                    const next = { ...prev, title: val }
                    if (!isSlugManuallyEdited) {
                      next.seo_slug = generateSlug(val)
                    }
                    return next
                  })
                }}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Author Name</label>
              <input
                type="text"
                placeholder="Author Name"
                value={formData.authorName}
                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
                <input
                  type="text"
                  placeholder="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Excerpt</label>
              <textarea
                placeholder="Excerpt"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                rows="2"
              />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Content</span>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>

            {/* SEO Settings Panel */}
            <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-4">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                🌐 SEO Settings
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Focus Keyphrase */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Focus Keyphrase</label>
                  <input
                    type="text"
                    placeholder="e.g. happy pets clinic"
                    value={formData.focus_keyphrase || ""}
                    onChange={(e) => setFormData({ ...formData, focus_keyphrase: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>

                {/* SEO Slug */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SEO Slug</label>
                  <input
                    type="text"
                    placeholder="slug-url"
                    value={formData.seo_slug || ""}
                    onChange={(e) => {
                      setIsSlugManuallyEdited(true)
                      setFormData({ ...formData, seo_slug: generateSlug(e.target.value) })
                    }}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              {/* SEO Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">SEO Title</label>
                <input
                  type="text"
                  placeholder="SEO Title"
                  value={formData.seo_title || ""}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <div className="mt-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mb-0.5">
                    <span>Length: {(formData.seo_title || "").length} chars</span>
                    <span>Optimal: ~60 chars</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (formData.seo_title || "").length >= 50 && (formData.seo_title || "").length <= 70
                          ? "bg-green-500"
                          : (formData.seo_title || "").length > 0 && (formData.seo_title || "").length < 50
                          ? "bg-amber-500"
                          : (formData.seo_title || "").length > 70
                          ? "bg-rose-500"
                          : "bg-stone-300"
                      }`}
                      style={{ width: `${Math.min(100, (((formData.seo_title || "").length) / 80) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meta Description</label>
                <textarea
                  placeholder="Meta Description"
                  value={formData.seo_description || ""}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                />
                <div className="mt-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground font-semibold mb-0.5">
                    <span>Length: {(formData.seo_description || "").length} chars</span>
                    <span>Optimal: ~150-160 chars</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        (formData.seo_description || "").length >= 130 && (formData.seo_description || "").length <= 170
                          ? "bg-green-500"
                          : (formData.seo_description || "").length > 0 && (formData.seo_description || "").length < 130
                          ? "bg-amber-500"
                          : (formData.seo_description || "").length > 170
                          ? "bg-rose-500"
                          : "bg-stone-300"
                      }`}
                      style={{ width: `${Math.min(100, (((formData.seo_description || "").length) / 185) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm shadow-md"
              >
                {editingId ? "Update Post" : "Create Post"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-border font-medium rounded-lg hover:bg-muted text-sm transition-colors text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
          No blog posts found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-background border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Image</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {post.featuredImage || post.featured_image ? (
                          <img
                            src={post.featuredImage || post.featured_image}
                            alt={post.title}
                            className="h-10 w-10 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-muted rounded flex items-center justify-center border border-border text-xs text-muted-foreground">
                            No Img
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground text-sm max-w-xs truncate" title={post.title}>
                          {post.title}
                        </div>
                        <div className="text-xs text-muted-foreground max-w-xs truncate">
                          {post.excerpt}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {post.authorName || post.author_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                          {post.category || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {post.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-primary hover:text-primary/80 mr-4"
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(post.slug)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 text-sm bg-background text-foreground"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground font-bold"
                      : "border border-border hover:border-accent bg-background text-foreground"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 text-sm bg-background text-foreground"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
