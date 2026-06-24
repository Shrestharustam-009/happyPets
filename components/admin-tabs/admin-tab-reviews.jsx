"use client"

import { useState, useEffect } from "react"
import { Star, Edit, Trash2, Plus } from "lucide-react"

export default function AdminTabReviews() {
  const [reviews, setReviews] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    user_id: "",
    rating: 5,
    review_text: ""
  })

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchReviews()
    fetchDropdownData()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) {}
    }
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews")
      if (response.ok) {
        const data = await response.json()
        setReviews(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      const cliRes = await fetch("/api/admin/clients")
      if (cliRes.ok) {
        setClients(await cliRes.json())
      }
    } catch (e) {
      console.error("Error fetching dropdowns:", e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingId ? `/api/reviews/${editingId}` : "/api/reviews"
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
        fetchReviews()
        setShowForm(false)
        setEditingId(null)
        setFormData({ user_id: "", rating: 5, review_text: "" })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error("[v0] Error saving review:", error)
      alert("Failed to save review")
    }
  }

  const handleEdit = (review) => {
    setFormData({
      user_id: review.user_id || "",
      rating: review.rating || 5,
      review_text: review.review_text || ""
    })
    setEditingId(review.id)
    setShowForm(true)
  }

  const deleteReview = async (reviewId) => {
    if (confirm("Are you sure you want to delete this review?")) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (response.ok) {
          fetchReviews()
        } else {
          const err = await response.json()
          alert(err.message || "Failed to delete review")
        }
      } catch (error) {
        console.error("[v0] Error deleting review:", error)
      }
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`}
      />
    ))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Reviews</h2>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({ user_id: "", rating: 5, review_text: "" })
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            + Add Review
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-background p-6 rounded-lg border border-border mb-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">{editingId ? "Edit Review" : "Add New Review"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Client (Author)</label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Review Comments</label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                placeholder="Write the review text content here..."
                required
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm shadow-md"
              >
                {editingId ? "Save Changes" : "Create Review"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
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
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-background border border-border rounded-lg p-6">
          No reviews found.
        </div>
      ) : (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{review.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={review.review_text}>
                      {review.review_text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(review)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => deleteReview(review.id)}
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
