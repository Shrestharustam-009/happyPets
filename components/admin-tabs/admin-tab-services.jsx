"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"


export default function AdminTabServices() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
  })

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchServices()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetchWithAuth("/api/services")
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching services:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/services/${editingId}` : "/api/services"
      const method = editingId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchServices()
        setShowForm(false)
        setEditingId(null)
        setFormData({ name: "", description: "", price: "", duration_minutes: "" })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("[v0] Error saving service:", error)
      alert("Failed to save service")
    }
  }

  const handleDelete = async (serviceId) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
      const response = await fetchWithAuth(`/api/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
        if (response.ok) {
          fetchServices()
        } else {
          const error = await response.json()
          alert(`Error: ${error.message}`)
        }
      } catch (error) {
        console.error("[v0] Error deleting service:", error)
        alert("Failed to delete service")
      }
    }
  }

  const handleEdit = (service) => {
    setFormData({
      name: service.name || "",
      description: service.description || "",
      price: service.price ?? "",
      duration_minutes: service.duration_minutes ?? "",
    })
    setEditingId(service.id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Services</h2>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({ name: "", description: "", price: "", duration_minutes: "" })
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            + Add Service
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-background p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">{editingId ? "Edit Service" : "Add New Service"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Name</label>
              <input
                type="text"
                placeholder="Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price (NPR) - Optional</label>
                <input
                  type="text"
                  placeholder="Price (e.g. '1500')"
                  value={formData.price ?? ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration (minutes) - Optional</label>
                <input
                  type="number"
                  placeholder="Duration"
                  value={formData.duration_minutes ?? ""}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                rows="3"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm shadow-md"
              >
                {editingId ? "Update Service" : "Add Service"}
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
      ) : services.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
          No services found.
        </div>
      ) : (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{service.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{service.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-sm">
                      {service.price ? `NPR ${service.price}` : "Price on request"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {service.duration_minutes ? `${service.duration_minutes} mins` : "Varies"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(service.id)}
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
      )}
    </div>
  )
}
