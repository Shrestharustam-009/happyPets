"use client"
import { fetchWithAuth } from "@/lib/api"

import { useEffect, useState } from "react"


export default function AdminTabTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    image_url: "",
    experience_years: "",
    specialties: "",
    sort_order: "",
    is_active: 1,
  })
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState("")

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchTeam()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [])

  const fetchTeam = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth("/api/team")
      if (res.ok) {
        const data = await res.json()
        console.log("data",data)
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching team members:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/team/${editingId}` : "/api/team"
      const method = editingId ? "PUT" : "POST"

      // Full sanitization for all SQL-bound fields
      const sanitizedData = {
        name: formData.name || null,
        role: formData.role || null,
        bio: formData.bio === undefined || formData.bio === '' ? null : formData.bio,
        image_url: formData.image_url === undefined || formData.image_url === '' ? null : formData.image_url,
        experience_years: formData.experience_years === undefined || formData.experience_years === '' ? 0 : Number(formData.experience_years),
        specialties: formData.specialties === undefined || formData.specialties === '' ? null : formData.specialties,
        sort_order: formData.sort_order === undefined || formData.sort_order === '' ? 0 : Number(formData.sort_order),
        is_active: formData.is_active === undefined ? 1 : (formData.is_active === true || formData.is_active === 1 || formData.is_active === '1' ? 1 : 0),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(sanitizedData),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to save member")
        return
      }

      setShowForm(false)
      setEditingId(null)
      setFormData({
        name: "",
        role: "",
        bio: "",
        image_url: "",
        experience_years: "",
        specialties: "",
        sort_order: "",
        is_active: 1,
      })
      fetchTeam()
    } catch (error) {
      console.error("[v0] Error saving team member:", error)
      alert("Failed to save team member")
    }
  }

  const handleEdit = (member) => {
    setEditingId(member.id)
    setFormData({
      name: member.name || "",
      role: member.role || "",
      bio: member.bio || "",
      image_url: member.image_url || "",
      experience_years: member.experience_years ?? "",
      specialties: member.specialties || "",
      sort_order: member.sort_order ?? "",
      is_active: member.is_active ?? 1,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!id) {
      alert("Could not determine team member ID.")
      return
    }
    if (!confirm("Are you sure you want to remove this team member?")) return
    try {
      const res = await fetchWithAuth(`/api/team/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to delete member")
        return
      }
      fetchTeam()
    } catch (error) {
      console.error("[v0] Error deleting team member:", error)
      alert("Failed to delete team member")
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      const res = await fetchWithAuth("/api/upload/team-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: formDataUpload,
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.message || "Failed to upload image")
        return
      }
      const data = await res.json()
      setFormData((prev) => ({ ...prev, image_url: data.image_path }))
      setImagePreview(data.image_path)
    } catch (error) {
      console.error("[v0] Error uploading team image:", error)
      alert("Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Team</h2>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                name: "",
                role: "",
                bio: "",
                image_url: "",
                experience_years: "",
                specialties: "",
                sort_order: "",
                is_active: 1,
              })
              setImagePreview(null)
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            + Add Team Member
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-background p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">{editingId ? "Edit Team Member" : "Add New Team Member"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                <input
                  type="text"
                  placeholder="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="md:col-span-2 border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
                <label className="block mb-2">
                  <span className="text-sm font-medium text-foreground">Profile Picture</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm border border-border rounded-lg p-2 cursor-pointer bg-background"
                  />
                </label>
                {imagePreview || formData.image_url ? (
                  <div className="mt-3 flex items-center gap-4">
                    <img
                      src={imagePreview || formData.image_url}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded border border-border"
                    />
                    <div className="text-xs text-muted-foreground break-all">{formData.image_url}</div>
                  </div>
                ) : null}
                {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Experience (years)</label>
                <input
                  type="number"
                  placeholder="Experience (years)"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Specialties (comma separated)</label>
                <input
                  type="text"
                  placeholder="Specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sort Order</label>
                <input
                  type="number"
                  placeholder="Sort Order"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Short bio</label>
              <textarea
                placeholder="Short bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                rows="4"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm shadow-md"
              >
                {editingId ? "Update Member" : "Add Member"}
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
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
          No team members found.
        </div>
      ) : (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Specialties</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={member.image_url || "/placeholder-user.jpg"}
                        alt={member.name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-foreground">{member.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {member.experience_years ? `${member.experience_years} years` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {member.specialties || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(member.id)}
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


