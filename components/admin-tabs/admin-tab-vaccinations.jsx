"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"


export default function AdminTabVaccinations() {
  const [vaccinations, setVaccinations] = useState([])
  const [patients, setPatients] = useState([])
  const [vets, setVets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  
  const [formData, setFormData] = useState({
    pet_id: "",
    vaccine_name: "",
    batch_number: "",
    given_date: "",
    next_due_date: "",
    administered_by: "",
    notes: ""
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
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [vaccineRes, patientsRes, usersRes] = await Promise.all([
        fetchWithAuth("/api/admin/vaccinations"),
        fetchWithAuth("/api/admin/patients"),
        fetchWithAuth("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } })
      ])
      
      if (vaccineRes.ok) {
        const vData = await vaccineRes.json()
        setVaccinations(vData)
      }
      
      if (patientsRes.ok) {
        const pData = await patientsRes.json()
        setPatients(pData)
      }
      
      if (usersRes.ok) {
        const uData = await usersRes.json()
        // Filter users to only show those who can administer vaccines
        const staff = uData.filter(u => ['admin', 'veterinarian', 'vet_assistant'].includes(u.role))
        setVets(staff)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setFormData({
      pet_id: "",
      vaccine_name: "",
      batch_number: "",
      given_date: new Date().toISOString().split('T')[0],
      next_due_date: "",
      administered_by: "",
      notes: ""
    })
    setCurrentRecord(null)
    setIsModalOpen(true)
  }

  const openEditModal = (record) => {
    setIsEditMode(true)
    setFormData({
      pet_id: record.pet_id || "",
      vaccine_name: record.vaccine_name || "",
      batch_number: record.batch_number || "",
      given_date: record.given_date ? new Date(record.given_date).toISOString().split('T')[0] : "",
      next_due_date: record.next_due_date ? new Date(record.next_due_date).toISOString().split('T')[0] : "",
      administered_by: record.administered_by || "",
      notes: record.notes || ""
    })
    setCurrentRecord(record)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = isEditMode ? `/api/admin/vaccinations/${currentRecord.id}` : "/api/admin/vaccinations"
      const method = isEditMode ? "PUT" : "POST"
      
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        fetchData()
        closeModal()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Failed to save vaccination record:", error)
      alert("Failed to save vaccination record")
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this vaccination record?")) {
      try {
        const res = await fetchWithAuth(`/api/admin/vaccinations/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (res.ok) {
          fetchData()
        } else {
          const errorData = await res.json()
          alert(errorData.error || "Failed to delete record")
        }
      } catch (error) {
        console.error("Failed to delete record:", error)
      }
    }
  }

  // Calculate days until due or overdue
  const getStatusBadge = (dueDateString) => {
    if (!dueDateString) return null;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    // Reset time to compare just dates
    dueDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Overdue by {Math.abs(diffDays)} days</span>
    } else if (diffDays <= 30) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Due in {diffDays} days</span>
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Up to Date</span>
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading vaccinations...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Vaccinations & Preventative Care</h2>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Log New Vaccination
        </button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vaccine Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Given Date & Administered By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Next Due Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vaccinations.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{record.pet_name}</div>
                    <div className="text-xs text-muted-foreground">{record.species} ({record.breed || 'Unknown'})</div>
                    <div className="text-xs text-muted-foreground mt-1">Owner: {record.owner_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{record.vaccine_name}</div>
                    <div className="text-xs text-muted-foreground">Batch: {record.batch_number || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {new Date(record.given_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">By: {record.vet_name || "Unknown"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.next_due_date ? (
                      <div>
                        <div className="text-sm text-foreground mb-1">
                          {new Date(record.next_due_date).toLocaleDateString()}
                        </div>
                        {getStatusBadge(record.next_due_date)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not Scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(record)}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {vaccinations.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No vaccinations logged yet. Click "Log New Vaccination" to create one.
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
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold">{isEditMode ? "Edit Vaccination Record" : "Log New Vaccination"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <form id="vaccine-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Patient (Pet) *</label>
                    <select
                      name="pet_id"
                      value={formData.pet_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Select Patient...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.owner_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Vaccine Name / Product *</label>
                    <input
                      type="text"
                      name="vaccine_name"
                      value={formData.vaccine_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Rabies, DHPP, FVRCP"
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Batch / Serial Number</label>
                    <input
                      type="text"
                      name="batch_number"
                      value={formData.batch_number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Administered By</label>
                    <select
                      name="administered_by"
                      value={formData.administered_by}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Staff...</option>
                      {vets.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.fullName} ({v.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date Given *</label>
                    <input
                      type="date"
                      name="given_date"
                      value={formData.given_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-primary">Next Due Date (For Reminders)</label>
                    <input
                      type="date"
                      name="next_due_date"
                      value={formData.next_due_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="Injection site, reaction, etc."
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    ></textarea>
                  </div>

                </div>
              </form>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/10">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="vaccine-form"
                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Log Vaccination"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
