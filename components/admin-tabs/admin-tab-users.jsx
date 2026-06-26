"use client"
import { fetchWithAuth } from "@/lib/api"
import { useState, useEffect } from "react"
import { Plus, Shield, X, Check } from "lucide-react"

// Must match the tab IDs in layout.jsx
const ALL_TAB_OPTIONS = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Appointments" },
  { id: "reminders", label: "Reminders" },
  { id: "medical_records", label: "Medical Records" },
  { id: "vaccinations", label: "Vaccinations" },
  { id: "consent_forms", label: "Consent Forms" },
  { id: "test_reports", label: "Test Reports" },
  { id: "billing", label: "Billing" },
  { id: "inventory", label: "Inventory" },
  { id: "orders", label: "Orders" },
  { id: "blog", label: "Blog Posts" },
  { id: "services", label: "Services" },
  { id: "team", label: "Team" },
  { id: "images", label: "Images" },
  { id: "reviews", label: "Reviews" },
  { id: "reports", label: "Reports" },
  { id: "users", label: "Users (Staff)" },
]

export default function AdminTabUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingChange, setPendingChange] = useState(null)

  // Add Staff modal state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [addStaffEmail, setAddStaffEmail] = useState("")
  const [addStaffRole, setAddStaffRole] = useState("reception")
  const [addStaffLoading, setAddStaffLoading] = useState(false)
  const [addStaffError, setAddStaffError] = useState("")

  // Edit Access modal state
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [accessUser, setAccessUser] = useState(null)
  const [selectedTabs, setSelectedTabs] = useState([])
  const [accessSaving, setAccessSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        const staff = data.filter((user) => user.role !== "client")
        setUsers(staff)
      }
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("[v0] Error updating user:", error)
    }
  }

  const changeUserRole = async (userId, newRole) => {
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("[v0] Error updating user role:", error)
    }
  }

  // --- Add Staff ---
  const handleAddStaff = async () => {
    if (!addStaffEmail.trim()) {
      setAddStaffError("Please enter an email address.")
      return
    }
    setAddStaffLoading(true)
    setAddStaffError("")

    try {
      // Find the user by email first
      const res = await fetchWithAuth("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
      })
      if (!res.ok) throw new Error("Failed to fetch users")
      const allUsers = await res.json()
      const target = allUsers.find(u => u.email?.toLowerCase() === addStaffEmail.trim().toLowerCase())

      if (!target) {
        setAddStaffError("No registered user found with that email.")
        setAddStaffLoading(false)
        return
      }
      if (["admin", "vet", "reception"].includes(target.role)) {
        setAddStaffError("This user is already a staff member.")
        setAddStaffLoading(false)
        return
      }

      // Promote the user
      const updateRes = await fetchWithAuth(`/api/users/${target.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ role: addStaffRole }),
      })

      if (updateRes.ok) {
        setIsAddStaffOpen(false)
        setAddStaffEmail("")
        setAddStaffRole("reception")
        fetchUsers()
      } else {
        const err = await updateRes.json()
        setAddStaffError(err.error || err.message || "Failed to add staff")
      }
    } catch (e) {
      console.error(e)
      setAddStaffError("An unexpected error occurred.")
    } finally {
      setAddStaffLoading(false)
    }
  }

  // --- Edit Access ---
  const openAccessModal = (user) => {
    setAccessUser(user)
    // Parse existing allowed_tabs
    let existing = null
    try {
      existing = user.allowedTabs
        ? (typeof user.allowedTabs === "string" ? JSON.parse(user.allowedTabs) : user.allowedTabs)
        : null
    } catch (e) {
      existing = null
    }
    // If null (default), check all tabs
    setSelectedTabs(existing || ALL_TAB_OPTIONS.map(t => t.id))
    setIsAccessModalOpen(true)
  }

  const toggleTab = (tabId) => {
    // Always keep overview checked
    if (tabId === "overview") return
    setSelectedTabs(prev =>
      prev.includes(tabId) ? prev.filter(t => t !== tabId) : [...prev, tabId]
    )
  }

  const selectAll = () => {
    setSelectedTabs(ALL_TAB_OPTIONS.map(t => t.id))
  }

  const deselectAll = () => {
    setSelectedTabs(["overview"]) // Always keep overview
  }

  const saveAccess = async () => {
    if (!accessUser) return
    setAccessSaving(true)
    try {
      const res = await fetchWithAuth(`/api/users/${accessUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ allowed_tabs: selectedTabs }),
      })
      if (res.ok) {
        setIsAccessModalOpen(false)
        setAccessUser(null)
        fetchUsers()
      } else {
        alert("Failed to save access settings")
      }
    } catch (e) {
      console.error(e)
      alert("Failed to save access settings")
    } finally {
      setAccessSaving(false)
    }
  }

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "vet", label: "Veterinarian" },
    { value: "reception", label: "Receptionist" },
    { value: "client", label: "Client" },
  ]

  const getAccessSummary = (user) => {
    let tabs = null
    try {
      tabs = user.allowedTabs
        ? (typeof user.allowedTabs === "string" ? JSON.parse(user.allowedTabs) : user.allowedTabs)
        : null
    } catch (e) {
      tabs = null
    }
    if (user.role === "admin") return "Full Access"
    if (!tabs) return "Default (Role)"
    return `${tabs.length}/${ALL_TAB_OPTIONS.length} Tabs`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manage Users (Staff)</h2>
        <button
          onClick={() => { setIsAddStaffOpen(true); setAddStaffError(""); setAddStaffEmail(""); }}
          className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Access</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{user.id}</td>
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => setPendingChange({
                        userId: user.id,
                        userName: user.fullName,
                        oldRole: user.role,
                        newRole: e.target.value
                      })}
                      className="px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.isActive ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{getAccessSummary(user)}</span>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => openAccessModal(user)}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Shield className="w-3 h-3" />
                          Edit Access
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        user.isActive
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      }`}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Change Confirmation Modal */}
      {pendingChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Confirm Role Change</h3>
            <p className="text-sm text-slate-600">
              Are you sure you want to change <strong>{pendingChange.userName}</strong>&apos;s role from{" "}
              <span className="font-semibold text-slate-700 uppercase">{pendingChange.oldRole}</span> to{" "}
              <span className="font-semibold text-blue-600 uppercase">{pendingChange.newRole}</span>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPendingChange(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  changeUserRole(pendingChange.userId, pendingChange.newRole)
                  setPendingChange(null)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-colors"
              >
                Yes, Change Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-md w-full space-y-5 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              Enter the email of a registered user to promote them to staff. They must already have a client account.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-500">Email Address *</label>
                <input
                  type="email"
                  value={addStaffEmail}
                  onChange={(e) => { setAddStaffEmail(e.target.value); setAddStaffError(""); }}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-500">Role *</label>
                <select
                  value={addStaffRole}
                  onChange={(e) => setAddStaffRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="admin">Administrator</option>
                  <option value="vet">Veterinarian</option>
                  <option value="reception">Receptionist</option>
                </select>
              </div>
            </div>

            {addStaffError && (
              <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg">{addStaffError}</p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStaff}
                disabled={addStaffLoading}
                className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {addStaffLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Adding...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Add Staff</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Access Modal */}
      {isAccessModalOpen && accessUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border p-6 rounded-2xl max-w-lg w-full space-y-5 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Tab Access</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {accessUser.fullName} <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold">{accessUser.role}</span>
                </p>
              </div>
              <button onClick={() => setIsAccessModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 text-xs">
              <button onClick={selectAll} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-colors cursor-pointer">
                Select All
              </button>
              <button onClick={deselectAll} className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer">
                Deselect All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {ALL_TAB_OPTIONS.map(tab => {
                const isChecked = selectedTabs.includes(tab.id)
                const isOverview = tab.id === "overview"
                return (
                  <button
                    key={tab.id}
                    onClick={() => toggleTab(tab.id)}
                    disabled={isOverview}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm font-medium transition-all cursor-pointer ${
                      isChecked
                        ? "bg-blue-50 border-blue-300 text-blue-800"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    } ${isOverview ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className={`w-4.5 h-4.5 rounded flex items-center justify-center shrink-0 border ${
                      isChecked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                    }`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span>{tab.label}</span>
                    {isOverview && <span className="text-[10px] text-slate-400 ml-auto">(always)</span>}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {selectedTabs.length} of {ALL_TAB_OPTIONS.length} tabs selected
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAccess}
                  disabled={accessSaving}
                  className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-semibold text-sm shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {accessSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Save Access</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
