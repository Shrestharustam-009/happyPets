"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

export default function AdminTabPatients() {
  // Patients (Pets) State
  const [patients, setPatients] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    species: "",
    breed: "",
    dob: "",
    sex: "",
    color: "",
    weight: "",
    identifying_marks: "",
    medical_history: "",
    photo_url: ""
  })

  // Inline Client Creation State (inside Register Pet Form)
  const [ownerMode, setOwnerMode] = useState("select") // "select" or "create"
  const [newOwnerData, setNewOwnerData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
  })

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
      const [patientsRes, clientsRes] = await Promise.all([
        fetch("/api/admin/patients"),
        fetch("/api/admin/clients")
      ])
      
      if (patientsRes.ok) {
        const pData = await patientsRes.json()
        setPatients(pData)
      }
      
      if (clientsRes.ok) {
        const cData = await clientsRes.json()
        setClients(cData)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- Patients Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const uploadData = new FormData()
    uploadData.append("file", file)

    try {
      const res = await fetch("/api/admin/patients/upload", {
        method: "POST",
        body: uploadData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, photo_url: data.photo_url }))
      } else {
        alert("Failed to upload image")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error uploading file")
    } finally {
      setUploading(false)
    }
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setOwnerMode("select")
    setNewOwnerData({
      full_name: "",
      email: "",
      phone_number: "",
      address: "",
    })
    setFormData({
      user_id: "",
      name: "",
      species: "",
      breed: "",
      dob: "",
      sex: "",
      color: "",
      weight: "",
      identifying_marks: "",
      medical_history: "",
      photo_url: ""
    })
    setCurrentPatient(null)
    setIsModalOpen(true)
  }

  const openEditModal = (patient) => {
    setIsEditMode(true)
    setOwnerMode("select")
    setFormData({
      user_id: patient.user_id || "",
      name: patient.name || "",
      species: patient.species || "",
      breed: patient.breed || "",
      dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : "",
      sex: patient.sex || "",
      color: patient.color || "",
      weight: patient.weight || "",
      identifying_marks: patient.identifying_marks || "",
      medical_history: patient.medical_history || "",
      photo_url: patient.photo_url || ""
    })
    setCurrentPatient(patient)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let finalUserId = formData.user_id

      // If register new owner is chosen inside the pet form
      if (!isEditMode && ownerMode === "create") {
        if (!newOwnerData.full_name) {
          alert("Owner name is required")
          return
        }
        
        const clientRes = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newOwnerData),
        })
        
        if (!clientRes.ok) {
          const errorData = await clientRes.json()
          alert(errorData.error || "Failed to create new owner")
          return
        }
        
        const clientResult = await clientRes.json()
        finalUserId = clientResult.id
      }

      if (!finalUserId) {
        alert("Please select or register an owner for this pet")
        return
      }

      const url = isEditMode ? `/api/admin/patients/${currentPatient.id}` : "/api/admin/patients"
      const method = isEditMode ? "PUT" : "POST"
      
      const payload = {
        ...formData,
        user_id: finalUserId
      }

      const res = await fetch(url, {
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
      console.error("Failed to save patient:", error)
      alert("Failed to save patient")
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this patient (pet)?")) {
      try {
        const res = await fetch(`/api/admin/patients/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (res.ok) {
          fetchData()
        } else {
          const errorData = await res.json()
          alert(errorData.error || "Failed to delete patient")
        }
      } catch (error) {
        console.error("Failed to delete patient:", error)
      }
    }
  }

  const calculateAge = (dobString) => {
    if (!dobString) return "Unknown"
    const dob = new Date(dobString)
    const diff = Date.now() - dob.getTime()
    const ageDate = new Date(diff)
    const years = Math.abs(ageDate.getUTCFullYear() - 1970)
    const months = ageDate.getUTCMonth()
    
    if (years === 0 && months === 0) return "Newborn"
    if (years === 0) return `${months} mo`
    if (months === 0) return `${years} y`
    return `${years}y ${months}m`
  }

  if (loading) {
    return <div className="p-8 text-center">Loading registry...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Patients (Pets)</h2>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Register New Pet
        </button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pet Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Species / Breed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Demographics
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    {patient.photo_url ? (
                      <img src={patient.photo_url} alt={patient.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border text-xs text-muted-foreground">
                        {patient.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-foreground">{patient.name}</div>
                      <div className="text-xs text-muted-foreground">ID: #{patient.id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">{patient.species}</div>
                    <div className="text-sm text-muted-foreground">{patient.breed || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">{patient.owner_name}</div>
                    <div className="text-xs text-muted-foreground">{patient.owner_email || "No email"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div>Age: {calculateAge(patient.dob)}</div>
                    <div>Sex: {patient.sex || "-"}</div>
                    <div>Wt: {patient.weight ? `${patient.weight} kg` : "-"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(patient)}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No patients found. Click "Register New Pet" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PATIENTS (PETS) MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold">{isEditMode ? "Edit Patient" : "Register New Pet"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Photo Upload */}
                <div className="md:col-span-2 flex items-center gap-4 border p-4 rounded-md">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Pet Preview" className="w-20 h-20 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border border-border text-xs text-muted-foreground">
                      No Photo
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Pet Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-muted text-foreground border border-border rounded hover:bg-muted/80 transition-colors"
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Choose Image"}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1">Files currently upload locally.</p>
                  </div>
                </div>

                {/* Owner Selection Mode (Only in Add Mode) */}
                {!isEditMode && (
                  <div className="md:col-span-2 flex gap-6 py-2 border-b border-border">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="ownerMode"
                        value="select"
                        checked={ownerMode === "select"}
                        onChange={() => setOwnerMode("select")}
                        className="h-4 w-4 text-primary border-border focus:ring-primary"
                      />
                      Select Existing Owner
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="ownerMode"
                        value="create"
                        checked={ownerMode === "create"}
                        onChange={() => setOwnerMode("create")}
                        className="h-4 w-4 text-primary border-border focus:ring-primary"
                      />
                      + Register New Owner
                    </label>
                  </div>
                )}

                {/* Select Owner Dropdown */}
                {(isEditMode || ownerMode === "select") && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Owner (Client) *</label>
                    <select
                      name="user_id"
                      value={formData.user_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                      required
                    >
                      <option value="">Select an Owner...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.full_name} {client.email ? `(${client.email})` : ""} {client.phone_number ? `[${client.phone_number}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Inline New Owner Fields */}
                {!isEditMode && ownerMode === "create" && (
                  <div className="md:col-span-2 border border-border bg-muted/20 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold text-primary">New Client (Owner) Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Owner Full Name *</label>
                        <input
                          type="text"
                          value={newOwnerData.full_name}
                          onChange={(e) => setNewOwnerData(prev => ({ ...prev, full_name: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required={ownerMode === "create"}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Owner Email (Optional)</label>
                        <input
                          type="email"
                          value={newOwnerData.email}
                          onChange={(e) => setNewOwnerData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Owner Phone Number</label>
                        <input
                          type="tel"
                          value={newOwnerData.phone_number}
                          onChange={(e) => setNewOwnerData(prev => ({ ...prev, phone_number: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-muted-foreground">Owner Physical Address</label>
                        <input
                          type="text"
                          value={newOwnerData.address}
                          onChange={(e) => setNewOwnerData(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Pet Name *</label>
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
                  <label className="block text-sm font-medium mb-1">Species *</label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    <option value="">Select Species...</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Bird">Bird</option>
                    <option value="Rodent">Rodent</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Breed</label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select...</option>
                    <option value="Male (Intact)">Male (Intact)</option>
                    <option value="Male (Neutered)">Male (Neutered)</option>
                    <option value="Female (Intact)">Female (Intact)</option>
                    <option value="Female (Spayed)">Female (Spayed)</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Identifying Marks</label>
                  <input
                    type="text"
                    name="identifying_marks"
                    value={formData.identifying_marks}
                    onChange={handleInputChange}
                    placeholder="e.g. White patch on left eye"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pre-existing Medical History</label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  {isEditMode ? "Save Changes" : "Register Pet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
