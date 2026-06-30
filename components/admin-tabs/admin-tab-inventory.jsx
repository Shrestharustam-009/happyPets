"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"
import Image from "next/image"


export default function AdminTabInventory() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentProduct, setCurrentProduct] = useState(null)
  const [filterCategory, setFilterCategory] = useState("all")
  const [uploadingFile, setUploadingFile] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Medicine",
    stock: "",
    image_url: "",
    is_visible: false
  })

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchData()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [filterCategory])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth(`/api/admin/inventory?category=${filterCategory}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const uploadData = new FormData()
    uploadData.append("file", file)

    try {
      setUploadingFile(true)
      const res = await fetchWithAuth("/api/admin/inventory/upload", {
        method: "POST",
        body: uploadData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, image_url: data.image_url }))
      } else {
        alert("Failed to upload image")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error uploading image")
    } finally {
      setUploadingFile(false)
    }
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Medicine",
      stock: "0",
      image_url: "",
      is_visible: false
    })
    setCurrentProduct(null)
    setIsModalOpen(true)
  }

  const openEditModal = (product) => {
    setIsEditMode(true)
    setFormData({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "Medicine",
      stock: product.stock !== null ? String(product.stock) : "0",
      image_url: product.image_url || "",
      is_visible: !!product.is_visible
    })
    setCurrentProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = isEditMode ? `/api/admin/inventory/${currentProduct.id}` : "/api/admin/inventory"
      const method = isEditMode ? "PUT" : "POST"
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10)
      }
      
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        fetchData()
        closeModal()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Failed to save product:", error)
      alert("Failed to save product")
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item? If it has been billed in the past, you should set stock to 0 instead of deleting it.")) {
      try {
        const res = await fetchWithAuth(`/api/admin/inventory/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (res.ok) {
          fetchData()
        } else {
          const errorData = await res.json()
          alert(errorData.error || "Failed to delete item")
        }
      } catch (error) {
        console.error("Failed to delete item:", error)
      }
    }
  }

  const getStockBadge = (stock) => {
    if (stock <= 0) return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">Out of Stock</span>
    if (stock <= 5) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Low Stock ({stock})</span>
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">In Stock ({stock})</span>
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory & Pharmacy</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage physical products, medicines, and shop supplies.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
          >
            <option value="all">All Categories</option>
            <option value="Medicine">Medicine</option>
            <option value="Food">Food & Nutrition</option>
            <option value="Accessories">Accessories</option>
            <option value="Equipment">Clinic Equipment</option>
          </select>
          <button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap font-medium shadow-sm"
          >
            + Add New Item
          </button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Inventory Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">Loading inventory...</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <div className="w-10 h-10 rounded overflow-hidden border border-border bg-muted flex-shrink-0 relative">
                          <Image src={getImageUrl(product.image_url)} alt={product.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border border-border bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                          No Img
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-foreground">{product.name}</div>
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">{product.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-muted rounded-full text-xs font-medium border border-border">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-bold">NPR {Number(product.price).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {getStockBadge(product.stock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-primary hover:text-primary/80 mr-4 font-semibold"
                    >
                      Restock / Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 font-semibold"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <div className="text-lg font-medium mb-1">No items found</div>
                    <p className="text-sm">Click "+ Add New Item" to stock your pharmacy and shop.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8 border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
              <h3 className="text-xl font-bold">{isEditMode ? "Edit Inventory Item" : "Add New Item"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground text-2xl leading-none">
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <form id="inventory-form" onSubmit={handleSubmit}>
                <div className="flex items-center gap-2.5 bg-muted/40 p-3 rounded-lg border border-border mb-5">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">Product / Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    >
                      <option value="Medicine">Medicine & Pharmacy</option>
                      <option value="Food">Food & Nutrition</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Equipment">Clinic Equipment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1 text-primary">Unit Price (NPR) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                    <label className="block text-sm font-bold mb-1">Current Stock Level *</label>
                    <p className="text-xs text-muted-foreground mb-2">Update this number to restock items. It will automatically decrease when billed.</p>
                    <input
                      type="number"
                      min="0"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full md:w-1/3 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-lg"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-1">Product Image</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          name="image_url"
                          value={formData.image_url}
                          onChange={handleInputChange}
                          placeholder="Image URL (e.g., https://...)"
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">OR</span>
                        <label className={`cursor-pointer px-4 py-2 bg-muted text-foreground border border-border rounded-md text-sm font-medium hover:bg-muted/80 transition-colors whitespace-nowrap ${uploadingFile ? "opacity-50 cursor-not-allowed" : ""}`}>
                          {uploadingFile ? "Uploading..." : "Upload File"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                        </label>
                      </div>
                    </div>
                    {formData.image_url && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                        <div className="w-20 h-20 rounded border border-border overflow-hidden relative bg-muted">
                          <Image src={getImageUrl(formData.image_url)} alt="Preview" fill className="object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </form>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="inventory-form"
                className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 shadow-sm transition-colors"
              >
                {isEditMode ? "Save Changes" : "Add to Inventory"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
