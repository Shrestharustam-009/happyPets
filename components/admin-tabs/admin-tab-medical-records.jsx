"use client"

import { useState, useEffect, useRef } from "react"

export default function AdminTabMedicalRecords() {
  const [records, setRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [vets, setVets] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  
  const [formData, setFormData] = useState({
    pet_id: "",
    vet_id: "",
    visit_date: "",
    chief_complaint: "",
    temperature: "",
    pulse: "",
    respiration: "",
    weight: "",
    clinical_findings: "",
    primary_diagnosis: "",
    differential_diagnoses: "",
    treatment_interventions: "",
    prescribed_medicines: "",
    attachments_url: "",
    history: ""
  })

  const [weightUnitMR, setWeightUnitMR] = useState("kg")

  // Consent form & image uploads
  const [consentFile, setConsentFile] = useState(null) // { name, url }
  const [uploadingConsent, setUploadingConsent] = useState(false)
  const consentInputRef = useRef(null)

  const IMAGE_SLOTS = 5
  const [imageFiles, setImageFiles] = useState(Array(IMAGE_SLOTS).fill(null)) // [{ name, url } | null]
  const [uploadingImage, setUploadingImage] = useState(Array(IMAGE_SLOTS).fill(false))
  const imageInputRefs = useRef([])

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
      const [recordsRes, patientsRes, usersRes] = await Promise.all([
        fetch("/api/admin/medical-records"),
        fetch("/api/admin/patients"),
        fetch("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } })
      ])
      
      if (recordsRes.ok) {
        const rData = await recordsRes.json()
        setRecords(rData)
      }
      
      if (patientsRes.ok) {
        const pData = await patientsRes.json()
        setPatients(pData)
      }
      
      if (usersRes.ok) {
        const uData = await usersRes.json()
        // Filter users to only show those who can be vets (admin, veterinarian, vet_assistant)
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

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/medical-records/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.url
  }

  const handleConsentUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingConsent(true)
    try {
      const url = await uploadFile(file)
      setConsentFile({ name: file.name, url })
    } catch {
      alert("Failed to upload consent form")
    } finally {
      setUploadingConsent(false)
    }
  }

  const handleImageUpload = async (index, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(prev => { const n = [...prev]; n[index] = true; return n })
    try {
      const url = await uploadFile(file)
      setImageFiles(prev => { const n = [...prev]; n[index] = { name: file.name, url }; return n })
    } catch {
      alert("Failed to upload image")
    } finally {
      setUploadingImage(prev => { const n = [...prev]; n[index] = false; return n })
    }
  }

  const removeConsentFile = () => {
    setConsentFile(null)
    if (consentInputRef.current) consentInputRef.current.value = ""
  }

  const removeImage = (index) => {
    setImageFiles(prev => { const n = [...prev]; n[index] = null; return n })
    if (imageInputRefs.current[index]) imageInputRefs.current[index].value = ""
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setFormData({
      pet_id: "",
      vet_id: "",
      visit_date: new Date().toISOString().slice(0, 16),
      chief_complaint: "",
      temperature: "",
      pulse: "",
      respiration: "",
      weight: "",
      clinical_findings: "",
      primary_diagnosis: "",
      differential_diagnoses: "",
      treatment_interventions: "",
      prescribed_medicines: "",
      attachments_url: "",
      history: ""
    })
    setWeightUnitMR("kg")
    setConsentFile(null)
    setImageFiles(Array(IMAGE_SLOTS).fill(null))
    setCurrentRecord(null)
    setIsModalOpen(true)
  }

  const openEditModal = (record) => {
    setIsEditMode(true)
    setFormData({
      pet_id: record.pet_id || "",
      vet_id: record.vet_id || "",
      visit_date: record.visit_date ? new Date(record.visit_date).toISOString().slice(0, 16) : "",
      chief_complaint: record.chief_complaint || "",
      temperature: record.temperature || "",
      pulse: record.pulse || "",
      respiration: record.respiration || "",
      weight: record.weight || "",
      clinical_findings: record.clinical_findings || "",
      primary_diagnosis: record.primary_diagnosis || "",
      differential_diagnoses: record.differential_diagnoses || "",
      treatment_interventions: record.treatment_interventions || "",
      prescribed_medicines: record.prescribed_medicines || "",
      attachments_url: record.attachments_url || "",
      history: record.history || ""
    })
    setWeightUnitMR("kg")
    // Restore previously uploaded files from attachments_url JSON
    let parsed = null
    try { parsed = record.attachments_url ? JSON.parse(record.attachments_url) : null } catch {}
    if (parsed) {
      setConsentFile(parsed.consent || null)
      const imgs = Array(IMAGE_SLOTS).fill(null)
      if (parsed.images) {
        parsed.images.forEach((img, i) => { if (i < IMAGE_SLOTS) imgs[i] = img })
      }
      setImageFiles(imgs)
    } else {
      setConsentFile(null)
      setImageFiles(Array(IMAGE_SLOTS).fill(null))
    }
    setCurrentRecord(record)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Build the attachments JSON
    const attachmentsData = {
      consent: consentFile || null,
      images: imageFiles.filter(Boolean)
    }

    let normalizedWeight = formData.weight;
    if (normalizedWeight && weightUnitMR === "gram") {
      normalizedWeight = (parseFloat(normalizedWeight) / 1000).toFixed(4);
    }

    const payload = { 
      ...formData,
      weight: normalizedWeight ? parseFloat(normalizedWeight) : null,
      attachments_url: JSON.stringify(attachmentsData)
    }
    if (payload.visit_date) {
      payload.visit_date = payload.visit_date.replace('T', ' ') + ':00'
    }

    try {
      const url = isEditMode ? `/api/admin/medical-records/${currentRecord.id}` : "/api/admin/medical-records"
      const method = isEditMode ? "PUT" : "POST"
      
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
      console.error("Failed to save medical record:", error)
      alert("Failed to save medical record")
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this medical record? This cannot be undone.")) {
      try {
        const res = await fetch(`/api/admin/medical-records/${id}`, {
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

  if (loading) {
    return <div className="p-8 text-center">Loading medical records...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Medical Case Records (EHR)</h2>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Add New Visit Record
        </button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date & Vet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Patient Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Diagnosis / Complaint
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {new Date(record.visit_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(record.visit_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xs text-primary mt-1">Dr. {record.vet_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{record.pet_name}</div>
                    <div className="text-xs text-muted-foreground">{record.species} ({record.breed || 'Unknown'})</div>
                    <div className="text-xs text-muted-foreground mt-1">Owner: {record.owner_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {record.primary_diagnosis || "No formal diagnosis"}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      <span className="font-semibold">CC:</span> {record.chief_complaint || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(record)}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      View / Edit
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
              {records.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-muted-foreground">
                    No medical records found. Click "Add New Visit Record" to create one.
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
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold">{isEditMode ? "Edit Medical Record" : "New Visit Record"}</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                &times;
              </button>
            </div>
            
            <div className="max-h-[75vh] overflow-y-auto p-6">
              <form id="medical-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* General Info Section */}
                  <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3 text-primary">Visit Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Patient (Pet) *</label>
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
                      <div>
                        <label className="block text-xs font-medium mb-1">Attending Veterinarian *</label>
                        <select
                          name="vet_id"
                          value={formData.vet_id}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        >
                          <option value="">Select Vet...</option>
                          {vets.map(v => (
                            <option key={v.id} value={v.id}>
                              Dr. {v.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Visit Date & Time</label>
                        <input
                          type="datetime-local"
                          name="visit_date"
                          value={formData.visit_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vitals Section */}
                  <div className="md:col-span-2 border border-border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-sm">Vitals (TPR & Weight)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Temp (°C)</label>
                        <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Pulse (bpm)</label>
                        <input type="number" name="pulse" value={formData.pulse} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Resp (br/m)</label>
                        <input type="number" name="respiration" value={formData.respiration} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Weight</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            step="0.001"
                            name="weight"
                            value={formData.weight}
                            onChange={handleInputChange}
                            className="flex-1 min-w-0 px-2 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                            placeholder={weightUnitMR === "gram" ? "g" : "kg"}
                          />
                          <select
                            value={weightUnitMR}
                            onChange={(e) => {
                              const newUnit = e.target.value
                              setWeightUnitMR(newUnit)
                              if (formData.weight) {
                                const val = parseFloat(formData.weight)
                                if (!isNaN(val)) {
                                  if (newUnit === "gram" && weightUnitMR === "kg") {
                                    setFormData(prev => ({ ...prev, weight: (val * 1000).toFixed(0) }))
                                  } else if (newUnit === "kg" && weightUnitMR === "gram") {
                                    setFormData(prev => ({ ...prev, weight: (val / 1000).toFixed(3) }))
                                  }
                                }
                              }
                            }}
                            className="px-1.5 py-2 border border-border rounded-md text-xs bg-background text-foreground"
                          >
                            <option value="kg">kg</option>
                            <option value="gram">g</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Section */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Chief Complaint (Reason for Visit)</label>
                    <textarea
                      name="chief_complaint"
                      value={formData.chief_complaint}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Patient History</label>
                    <textarea
                      name="history"
                      value={formData.history || ""}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="e.g. Previous conditions, chronic issues, family history..."
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Clinical Findings (Exam Notes)</label>
                    <textarea
                      name="clinical_findings"
                      value={formData.clinical_findings}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    ></textarea>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-red-500">Primary Diagnosis</label>
                    <input
                      type="text"
                      name="primary_diagnosis"
                      value={formData.primary_diagnosis}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-orange-500">Differential Diagnoses</label>
                    <input
                      type="text"
                      name="differential_diagnoses"
                      value={formData.differential_diagnoses}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Treatment Interventions (Procedures/Surgery)</label>
                    <textarea
                      name="treatment_interventions"
                      value={formData.treatment_interventions}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Prescribed Medicines</label>
                    <textarea
                      name="prescribed_medicines"
                      value={formData.prescribed_medicines}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="e.g. Amoxicillin 250mg BID for 7 days"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    ></textarea>
                  </div>

                  {/* ====== Consent Form Upload ====== */}
                  <div className="md:col-span-2 border border-border rounded-lg p-4 bg-amber-50/30">
                    <h4 className="font-semibold mb-3 text-sm text-amber-700">Consent Form</h4>
                    {consentFile ? (
                      <div className="flex items-center gap-3 bg-white border border-border rounded-md px-4 py-2">
                        <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <a href={consentFile.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate flex-1">{consentFile.name}</a>
                        <button type="button" onClick={removeConsentFile} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                      </div>
                    ) : (
                      <div>
                        <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" ref={consentInputRef} onChange={handleConsentUpload} className="hidden" />
                        <button
                          type="button"
                          onClick={() => consentInputRef.current?.click()}
                          disabled={uploadingConsent}
                          className="px-4 py-2 text-sm bg-amber-100 text-amber-800 border border-amber-300 rounded-md hover:bg-amber-200 transition-colors disabled:opacity-50"
                        >
                          {uploadingConsent ? "Uploading..." : "Upload Consent Form"}
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
                      </div>
                    )}
                  </div>

                  {/* ====== Clinical Images Upload (5 Slots) ====== */}
                  <div className="md:col-span-2 border border-border rounded-lg p-4 bg-sky-50/30">
                    <h4 className="font-semibold mb-3 text-sm text-sky-700">Clinical Images / X-Rays / Lab Reports</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Array.from({ length: IMAGE_SLOTS }).map((_, idx) => (
                        <div key={idx} className="relative">
                          {imageFiles[idx] ? (
                            <div className="relative group border border-border rounded-lg overflow-hidden bg-white">
                              <img src={imageFiles[idx].url} alt={`Clinical image ${idx + 1}`} className="w-full h-28 object-cover" />
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >&times;</button>
                              <p className="text-[10px] text-muted-foreground p-1 truncate">{imageFiles[idx].name}</p>
                            </div>
                          ) : (
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                ref={el => imageInputRefs.current[idx] = el}
                                onChange={(e) => handleImageUpload(idx, e)}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => imageInputRefs.current[idx]?.click()}
                                disabled={uploadingImage[idx]}
                                className="w-full h-28 border-2 border-dashed border-sky-300 rounded-lg flex flex-col items-center justify-center text-sky-400 hover:bg-sky-50 hover:border-sky-400 transition-colors disabled:opacity-50"
                              >
                                {uploadingImage[idx] ? (
                                  <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <>
                                    <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span className="text-[10px] font-semibold">Image {idx + 1}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Upload up to 5 clinical images, X-rays, or lab report photos.</p>
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
                form="medical-form"
                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Save Record"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
