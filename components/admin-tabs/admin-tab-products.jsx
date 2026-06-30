"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"


export default function AdminTabProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const getImageUrl = (url) => {
    if (!url) return "/placeholder.svg";
    if (url.startsWith("http") || url.startsWith("/") || url.startsWith("blob:")) return url;
    if (url.startsWith("uploads/")) return "/" + url;
    return "/uploads/products/" + url;
  };
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(12)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    category: "",
    stock: "",
    image_url: "",
    is_visible: false,
  })

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchProducts()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [currentPage])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
      })

      const response = await fetchWithAuth(`/api/products?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        const list = data.products || data
        setProducts(list)
        if (data.pagination && typeof data.pagination.total_pages === "number") {
          setTotalPages(data.pagination.total_pages)
        } else {
          setTotalPages(1)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetchWithAuth("/api/upload/product-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formDataUpload,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData({ ...formData, image_url: data.image_path })
        setImagePreview(data.image_path)
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.message}`)
      }
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products"
      const method = editingId ? "PUT" : "POST"

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // After save, refresh list from first page
        setCurrentPage(1)
        fetchProducts()
        setShowForm(false)
        setEditingId(null)
        setFormData({
          name: "",
          description: "",
          price: "",
          discount_price: "",
          category: "",
          stock: "",
          image_url: "",
          is_visible: false,
        })
        setImagePreview(null)
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      alert("Failed to save product")
    }
  }

  const handleDelete = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetchWithAuth(`/api/products/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (response.ok) {
          fetchProducts()
        } else {
          alert("Failed to delete product")
        }
      } catch (error) {
        console.error("[v0] Error deleting product:", error)
        alert("Failed to delete product")
      }
    }
  }

  const handleEdit = (product) => {
    document.getElementById("editableform")?.scrollIntoView({
      behavior: "smooth"
    });
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price || "",
      category: product.category,
      stock: product.stock,
      image_url: product.image_url || "",
      is_visible: !!product.is_visible,
    })
    setImagePreview(product.image_url || null)
    setEditingId(product.id)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold">Manage Products</h2>
        <button
          onClick={() => {
            setShowForm(true)
            setEditingId(null)
            setFormData({
              name: "",
              description: "",
              price: "",
              discount_price: "",
              category: "",
              stock: "",
              image_url: "",
              is_visible: false,
            })
            setImagePreview(null)
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 font-medium"
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-muted p-6 rounded-lg border border-border" id="editableform">
          <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 bg-card p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                id="is_visible"
                checked={formData.is_visible || false}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary cursor-pointer"
              />
              <label htmlFor="is_visible" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                Show on Website (Publish to Store)
              </label>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <label className="block">
                <span className="text-sm font-medium mb-2 block">Product Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm border border-border rounded-lg p-2 cursor-pointer"
                />
              </label>
              {imagePreview && (
                <div className="mt-3 flex items-center gap-4">
                  <img
                    src={getImageUrl(imagePreview)}
                    alt="Preview"
                    className="h-20 w-20 object-contain rounded"
                  />
                  <div className="text-sm">
                    <p className="font-medium">Image Preview</p>
                    <p className="text-muted-foreground text-xs">{formData.image_url}</p>
                  </div>
                </div>
              )}
              {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background"
                required
              />
              <input
                type="number"
                placeholder="Discount Price (optional)"
                value={formData.discount_price}
                onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background"
                required
              />
              <input
                type="number"
                placeholder="Stock"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="px-4 py-2 border border-border rounded-lg bg-background"
                required
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              rows="4"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50"
                disabled={uploading}
              >
                {editingId ? "Update Product" : "Add Product"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 font-medium"
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
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No products found</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-lg p-4 overflow-hidden">
                {product.image_url && (
                  <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-40 object-contain rounded-lg mb-3"
                  />
                )}
                <h3 className="font-bold mb-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{product.description?.substring(0, 100)}...</p>
                <p className="text-sm mb-2">
                  {product.discount_price && product.price > product.discount_price ? (
                    <>
                      <span className="font-semibold">NPR {product.discount_price}</span>
                      <span className="ml-2 line-through text-muted-foreground">NPR {product.price}</span>
                    </>
                  ) : (
                    <span className="font-semibold">NPR {product.price}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Category: {product.category} | Stock: {product.stock}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm hover:bg-blue-200"
                  >
                    Edit
                  </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 px-3 py-1 bg-red-100 text-red-800 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 text-sm"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                    currentPage === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:border-accent"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-border rounded-lg hover:border-accent disabled:opacity-50 text-sm"
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
