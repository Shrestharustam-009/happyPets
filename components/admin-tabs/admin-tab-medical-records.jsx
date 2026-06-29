"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect, useRef } from "react"


export default function AdminTabMedicalRecords() {
  const [records, setRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [vets, setVets] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  // Inline Client & Pet Edit State
  const [editClientData, setEditClientData] = useState(null)
  const [editPetData, setEditPetData] = useState(null)
  const [isClientPetExpanded, setIsClientPetExpanded] = useState(false)

  // Search & Selected Client State
  const [clientSearchText, setClientSearchText] = useState("")
  const [activeClientId, setActiveClientId] = useState(null)

  // Profile view modal state
  const [profileModal, setProfileModal] = useState(null) // null | { client, pet, petRecords }

  const handleDeleteAllClientRecords = async (clientId) => {
    if (confirm("Are you sure you want to delete ALL medical records (visits) for this client? This action cannot be undone.")) {
      try {
        const res = await fetchWithAuth(`/api/admin/medical-records?client_id=${clientId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        })
        if (res.ok) {
          fetchData()
          alert("All medical records for this client's pets have been deleted.")
        } else {
          const errorData = await res.json()
          alert(errorData.error || "Failed to delete medical records")
        }
      } catch (error) {
        console.error("Failed to delete client medical records:", error)
      }
    }
  }
  
  const [formData, setFormData] = useState({
    pet_id: "", vet_id: "", visit_date: "", chief_complaint: "", temperature: "", heart_rate: "", blood_pressure: "", pulse: "", respiration: "", weight: "", clinical_findings: "", primary_diagnosis: "", differential_diagnoses: "", treatment_interventions: "", prescribed_medicines: "", attachments_url: "", history: "", advice: "", reminder_date: "", reminder_vaccine_name: ""
  })

  const [weightUnitMR, setWeightUnitMR] = useState("kg")

  // Registration Wizard State
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [regStep, setRegStep] = useState(1) // 1: Client, 2: Pet
  const [regMode, setRegMode] = useState("create") // "create" or "select" client
  const [selectedClientId, setSelectedClientId] = useState("")
  const [regClientSearchText, setRegClientSearchText] = useState("")
  const [isRegClientDropdownOpen, setIsRegClientDropdownOpen] = useState(false)
  const regClientSearchRef = useRef(null)

  const [petAgeType, setPetAgeType] = useState("dob") // "dob" | "age"
  const [petAgeYears, setPetAgeYears] = useState("")
  const [petAgeMonths, setPetAgeMonths] = useState("")
  const [newClientData, setNewClientData] = useState({
    full_name: "", email: "", phone_number: "", address: ""
  })
  const [newPetData, setNewPetData] = useState({
    name: "", species: "", breed: "", dob: "", sex: "", color: "", weight: "", identifying_marks: "", medical_history: "", photo_url: ""
  })
  const [regWeightUnit, setRegWeightUnit] = useState("kg")
  const [uploadingPetPhoto, setUploadingPetPhoto] = useState(false)
  const petPhotoInputRef = useRef(null)

  // Expandable list state
  const [expandedClients, setExpandedClients] = useState({})
  const [expandedPets, setExpandedPets] = useState({})

  const toggleClient = (id) => setExpandedClients(prev => ({ ...prev, [id]: !prev[id] }))
  const togglePet = (id) => setExpandedPets(prev => ({ ...prev, [id]: !prev[id] }))

  // Searchable patient state for medical record modal
  const [petSearchText, setPetSearchText] = useState("")
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false)
  const petSearchRef = useRef(null)

  // Unified attachments
  const [attachments, setAttachments] = useState([]) // [{name, url, type}]
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const attachmentInputRef = useRef(null)

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

  useEffect(() => {
    function handleClickOutside(event) {
      if (petSearchRef.current && !petSearchRef.current.contains(event.target)) {
        setIsPetDropdownOpen(false)
      }
      if (regClientSearchRef.current && !regClientSearchRef.current.contains(event.target)) {
        setIsRegClientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [recordsRes, patientsRes, usersRes, clientsRes] = await Promise.all([
        fetchWithAuth("/api/admin/medical-records", { cache: "no-store" }),
        fetchWithAuth("/api/admin/patients", { cache: "no-store" }),
        fetchWithAuth("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }, cache: "no-store" }),
        fetchWithAuth("/api/admin/clients", { cache: "no-store" })
      ])
      
      if (recordsRes.ok) setRecords(await recordsRes.json())
      if (patientsRes.ok) setPatients(await patientsRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (usersRes.ok) {
        const uData = await usersRes.json()
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

  const handleEditClientChange = (e) => {
    const { name, value } = e.target
    setEditClientData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditPetChange = (e) => {
    const { name, value } = e.target
    setEditPetData((prev) => ({ ...prev, [name]: value }))
  }

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetchWithAuth("/api/admin/medical-records/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.url
  }

  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingAttachment(true)
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const url = await uploadFile(file)
          return { name: file.name, url, type: file.type }
        })
      )
      setAttachments(prev => [...prev, ...uploaded])
    } catch {
      alert("Failed to upload one or more files")
    } finally {
      setUploadingAttachment(false)
      if (attachmentInputRef.current) attachmentInputRef.current.value = ""
    }
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const openRegistrationWizard = () => {
    setIsRegistrationModalOpen(true)
    setRegStep(1)
    setRegMode("create")
    setSelectedClientId("")
    setRegClientSearchText("")
    setIsRegClientDropdownOpen(false)
    setPetAgeType("dob")
    setPetAgeYears("")
    setPetAgeMonths("")
    setNewClientData({ full_name: "", email: "", phone_number: "", address: "" })
    setNewPetData({ name: "", species: "", breed: "", dob: "", sex: "", color: "", weight: "", identifying_marks: "", medical_history: "", photo_url: "" })
    setRegWeightUnit("kg")
  }

  const calculateAgeFromDob = (dobStr) => {
    if (!dobStr) return { years: "", months: "" }
    const dob = new Date(dobStr)
    if (isNaN(dob.getTime())) return { years: "", months: "" }
    const now = new Date()
    let years = now.getFullYear() - dob.getFullYear()
    let months = now.getMonth() - dob.getMonth()
    if (months < 0) {
      years--
      months += 12
    }
    return { years: String(years >= 0 ? years : 0), months: String(months >= 0 ? months : 0) }
  }

  const handleAgeChange = (years, months) => {
    setPetAgeYears(years)
    setPetAgeMonths(months)
    
    const y = parseInt(years) || 0
    const m = parseInt(months) || 0
    
    if (y === 0 && m === 0) {
      setNewPetData(prev => ({ ...prev, dob: "" }))
      return
    }
    
    const targetDate = new Date()
    targetDate.setFullYear(targetDate.getFullYear() - y)
    targetDate.setMonth(targetDate.getMonth() - m)
    
    const yyyy = targetDate.getFullYear()
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0')
    const dd = String(targetDate.getDate()).padStart(2, '0')
    
    setNewPetData(prev => ({ ...prev, dob: `${yyyy}-${mm}-${dd}` }))
  }

  const handleRegClientSubmit = async (e) => {
    e.preventDefault()
    if (regMode === "create") {
      try {
        const res = await fetchWithAuth("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newClientData),
        })
        if (!res.ok) {
          const err = await res.json()
          alert(err.error || "Failed to create client")
          return
        }
        const data = await res.json()
        setSelectedClientId(data.id)
        await fetchData()
        setRegStep(2)
      } catch (error) {
        alert("Error creating client")
      }
    } else {
      if (!selectedClientId) return alert("Please select a client")
      setRegStep(2)
    }
  }

  const handlePetPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPetPhoto(true)
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetchWithAuth("/api/admin/patients/upload", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        setNewPetData(prev => ({ ...prev, photo_url: data.photo_url }))
      }
    } catch {
      alert("Error uploading file")
    } finally {
      setUploadingPetPhoto(false)
    }
  }

  const handleRegPetSubmit = async (e) => {
    e.preventDefault()
    try {
      let normalizedWeight = newPetData.weight;
      if (normalizedWeight && regWeightUnit === "gram") {
        normalizedWeight = (parseFloat(normalizedWeight) / 1000).toFixed(4);
      }
      const payload = {
        ...newPetData,
        weight: normalizedWeight ? parseFloat(normalizedWeight) : null,
        user_id: selectedClientId
      }
      const res = await fetchWithAuth("/api/admin/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to register pet")
        return
      }
      const data = await res.json()
      await fetchData()
      if (confirm("Pet registered successfully! Do you want to log an initial visit now?")) {
        setIsRegistrationModalOpen(false)
        openAddModal()
        const clientName = regMode === "create" ? newClientData.full_name : clients.find(c => c.id == selectedClientId)?.full_name || "";
        setPetSearchText(`${newPetData.name} (${clientName})`);
        setFormData(prev => ({ ...prev, pet_id: data.id }))
      } else {
        setIsRegistrationModalOpen(false)
      }
    } catch (error) {
      alert("Error registering pet")
    }
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setFormData({
      pet_id: "",
      vet_id: "",
      visit_date: new Date().toISOString().slice(0, 16),
      chief_complaint: "",
      temperature: "",
      heart_rate: "",
      blood_pressure: "",
      pulse: "",
      respiration: "",
      weight: "",
      clinical_findings: "",
      primary_diagnosis: "",
      differential_diagnoses: "",
      treatment_interventions: "",
      prescribed_medicines: "",
      attachments_url: "",
      history: "",
      advice: "",
      reminder_date: "",
      reminder_vaccine_name: ""
    })
    setWeightUnitMR("kg")
    setAttachments([])
    setCurrentRecord(null)
    setPetSearchText("")
    setIsPetDropdownOpen(false)
    setEditClientData(null)
    setEditPetData(null)
    setIsClientPetExpanded(false)
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
      heart_rate: record.heart_rate || "",
      blood_pressure: record.blood_pressure || "",
      pulse: record.pulse || "",
      respiration: record.respiration || "",
      weight: record.weight || "",
      clinical_findings: record.clinical_findings || "",
      primary_diagnosis: record.primary_diagnosis || "",
      differential_diagnoses: record.differential_diagnoses || "",
      treatment_interventions: record.treatment_interventions || "",
      prescribed_medicines: record.prescribed_medicines || "",
      attachments_url: record.attachments_url || "",
      history: record.history || "",
      advice: record.advice || "",
      reminder_date: "",
      reminder_vaccine_name: ""
    })
    setWeightUnitMR("kg")
    // Restore previously uploaded attachments
    let parsedAttachments = []
    try {
      const raw = record.attachments_url ? JSON.parse(record.attachments_url) : null
      if (Array.isArray(raw)) {
        parsedAttachments = raw
      } else if (raw) {
        // Legacy format migration: consent + images
        if (raw.consent) parsedAttachments.push({ ...raw.consent, type: 'application/pdf' })
        if (raw.images) parsedAttachments.push(...raw.images.map(img => ({ ...img, type: 'image/*' })))
      }
    } catch {}
    setAttachments(parsedAttachments)
    const petObj = patients.find(p => Number(p.id) === Number(record.pet_id));
    setPetSearchText(petObj ? `${petObj.name} (${petObj.owner_name || ""})` : "");
    setIsPetDropdownOpen(false);
    
    // Populate client & pet edit states
    setEditPetData(petObj ? { ...petObj } : null);
    const clientObj = petObj ? clients.find(c => Number(c.id) === Number(petObj.user_id)) : null;
    setEditClientData(clientObj ? { ...clientObj } : null);
    setIsClientPetExpanded(false);

    setCurrentRecord(record)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.pet_id) {
      alert("Please select a valid patient (pet) from the list.")
      return
    }

    let normalizedWeight = formData.weight;
    if (normalizedWeight && weightUnitMR === "gram") {
      normalizedWeight = (parseFloat(normalizedWeight) / 1000).toFixed(4);
    }

    const payload = { 
      ...formData,
      weight: normalizedWeight ? parseFloat(normalizedWeight) : null,
      attachments_url: JSON.stringify(attachments)
    }
    if (payload.visit_date) {
      payload.visit_date = payload.visit_date.replace('T', ' ') + ':00'
    }

    try {
      const url = isEditMode ? `/api/admin/medical-records/${currentRecord.id}` : "/api/admin/medical-records"
      const method = isEditMode ? "PUT" : "POST"
      
      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      if (res.ok) {
        // Save Client and Pet if in edit mode
        if (isEditMode) {
          const promises = []
          if (editClientData && editClientData.id) {
            promises.push(
              fetchWithAuth(`/api/admin/clients/${editClientData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editClientData)
              })
            )
          }
          if (editPetData && editPetData.id) {
            const petPayload = { ...editPetData }
            if (petPayload.dob && petPayload.dob.includes('T')) {
                petPayload.dob = petPayload.dob.split('T')[0]
            }
            promises.push(
              fetchWithAuth(`/api/admin/patients/${editPetData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(petPayload)
              })
            )
          }
          if (promises.length > 0) {
            try { await Promise.all(promises) } catch (err) { console.error("Error saving client/pet details:", err) }
          }
        }

        if (formData.reminder_date) {
          try {
            await fetchWithAuth("/api/admin/vaccinations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pet_id: formData.pet_id,
                vaccine_name: formData.reminder_vaccine_name || "Next Scheduled Vaccination",
                given_date: formData.visit_date.slice(0, 10),
                next_due_date: formData.reminder_date,
                administered_by: formData.vet_id,
                notes: "Reminder created from Medical Record"
              })
            })
          } catch (e) {
            console.error("Failed to create reminder", e)
          }
        }
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
        const res = await fetchWithAuth(`/api/admin/medical-records/${id}`, {
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
        <div className="flex gap-3">
          <button
            onClick={openRegistrationWizard}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            Register Client & Pet
          </button>
          <button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Add New Visit Record
          </button>
        </div>
      </div>

      {/* Client Search Bar */}
      {!activeClientId ? (
        <div className="space-y-4">
          <div className="bg-white p-6 border border-border rounded-xl shadow-sm space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients by name, email, or phone number..."
                value={clientSearchText}
                onChange={(e) => setClientSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-slate-50/50 text-foreground text-sm font-medium transition-all"
              />
              <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {clientSearchText.trim() === "" ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700">Search Client EHR</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Type an owner's name, phone, or email to pull up their complete medical records and pet details.
                </p>
              </div>
            ) : null}
          </div>

          {clientSearchText.trim() !== "" && (
            <div className="bg-white border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
              {clients.filter(client => 
                client.full_name?.toLowerCase().includes(clientSearchText.toLowerCase()) ||
                client.email?.toLowerCase().includes(clientSearchText.toLowerCase()) ||
                client.phone_number?.includes(clientSearchText)
              ).length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 italic">No matching clients found.</div>
              ) : (
                clients.filter(client => 
                  client.full_name?.toLowerCase().includes(clientSearchText.toLowerCase()) ||
                  client.email?.toLowerCase().includes(clientSearchText.toLowerCase()) ||
                  client.phone_number?.includes(clientSearchText)
                ).map(client => {
                  const clientPets = patients.filter(p => Number(p.user_id) === Number(client.id));
                  return (
                    <div
                      key={client.id}
                      onClick={() => {
                        setActiveClientId(client.id)
                        setClientSearchText("")
                      }}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-slate-800">{client.full_name}</span>
                        <span className="text-xs text-slate-500">
                          {client.email || 'No email'} | {client.phone_number || 'No phone'}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        {clientPets.length} {clientPets.length === 1 ? 'Pet' : 'Pets'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      ) : (
        /* Selected Client Detail Panel */
        (() => {
          const client = clients.find(c => c.id === activeClientId)
          if (!client) return null
          const clientPets = patients.filter(p => Number(p.user_id) === Number(client.id));
          return (
            <div className="space-y-6">
              {/* Back Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                <button
                  onClick={() => setActiveClientId(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Search
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteAllClientRecords(client.id)}
                    className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Delete All Client Medical Records
                  </button>
                )}
              </div>

              {/* Client Profile Header */}
              <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{client.full_name}</h3>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span><strong>Email:</strong> {client.email || 'No email'}</span>
                    <span><strong>Phone:</strong> {client.phone_number || 'No phone'}</span>
                    {client.address && <span><strong>Address:</strong> {client.address}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setProfileModal({ client, pet: null, petRecords: [] })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    View Owner Profile
                  </button>
                  <div className="bg-blue-50 text-blue-800 border border-blue-100 rounded-xl px-4 py-2 text-center">
                    <div className="text-xl font-black">{clientPets.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider">Registered Pets</div>
                  </div>
                </div>
              </div>

              {/* Pets & Visits list */}
              <div className="space-y-4">
                {clientPets.length === 0 ? (
                  <div className="bg-white border border-border p-8 rounded-xl text-center text-slate-500 italic">
                    No pets registered for this client.
                  </div>
                ) : (
                  clientPets.map(pet => {
                    const petRecords = records.filter(r => Number(r.pet_id) === Number(pet.id));
                    // Keep pet expanded by default in search view for convenience
                    const isPetExpanded = expandedPets[pet.id] !== false;
                    return (
                      <div key={pet.id} className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                        <div 
                          onClick={() => togglePet(pet.id)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 border-b border-border bg-slate-50/20"
                        >
                          <div className="flex items-center gap-3">
                            {pet.photo_url ? (
                              <img src={pet.photo_url} alt={pet.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                                {pet.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800 text-base">{pet.name}</span>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {pet.species} - {pet.breed || 'Unknown'} | {pet.sex || 'Unknown Sex'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setProfileModal({ client, pet, petRecords }) }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              View Profile
                            </button>
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                              {petRecords.length} {petRecords.length === 1 ? 'Visit' : 'Visits'}
                            </span>
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${isPetExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {isPetExpanded && (
                          <div className="p-4 bg-white space-y-4">
                            {petRecords.length === 0 ? (
                              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-xs text-slate-500 italic">No medical records found for this pet.</span>
                                <button
                                  onClick={() => {
                                    openAddModal()
                                    setPetSearchText(`${pet.name} (${client.full_name})`)
                                    setFormData(prev => ({ ...prev, pet_id: pet.id }))
                                  }}
                                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                                >
                                  Log Initial Visit
                                </button>
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                  <thead>
                                    <tr className="text-xs text-slate-500 border-b border-border">
                                      <th className="pb-3 font-semibold">Date & Vet</th>
                                      <th className="pb-3 font-semibold">Diagnosis / Chief Complaint</th>
                                      <th className="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {petRecords.map(record => (
                                      <tr key={record.id} className="hover:bg-slate-50/50">
                                        <td className="py-3">
                                          <div className="font-semibold text-slate-700">{new Date(record.visit_date).toLocaleDateString()}</div>
                                          <div className="text-[10px] text-slate-500 mt-0.5">Dr. {record.vet_name}</div>
                                        </td>
                                        <td className="py-3">
                                          <div className="font-medium text-slate-800">{record.primary_diagnosis || "No formal diagnosis"}</div>
                                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[300px]" title={record.chief_complaint}>
                                            {record.chief_complaint || "-"}
                                          </div>
                                        </td>
                                        <td className="py-3 text-right">
                                          <button
                                            onClick={() => openEditModal(record)}
                                            className="text-xs font-semibold text-primary hover:text-primary/80 mr-3 cursor-pointer"
                                          >
                                            View/Edit
                                          </button>
                                          {isAdmin && (
                                            <button
                                              onClick={() => handleDelete(record.id)}
                                              className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer"
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
                            )}
                            <div className="text-right">
                              <button
                                onClick={() => {
                                  openAddModal()
                                  setPetSearchText(`${pet.name} (${client.full_name})`)
                                  setFormData(prev => ({ ...prev, pet_id: pet.id }))
                                }}
                                className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                + Log New Visit
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })()
      )}

      {/* ====== Profile View & Print Modal ====== */}
      {profileModal && (() => {
        const { client: pc, pet: pp, petRecords: ppr } = profileModal
        const isOwnerOnly = !pp
        const allClientPets = patients.filter(p => Number(p.user_id) === Number(pc?.id))
        return (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div id="profile-print-area" className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">

              {/* Modal Header (hidden on print) */}
              <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50 print:hidden">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <h3 className="font-bold text-slate-800 text-base">
                    {isOwnerOnly ? `Owner Profile — ${pc?.full_name}` : `Patient Profile — ${pp?.name}`}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / Save as PDF
                  </button>
                  <button onClick={() => setProfileModal(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold leading-none">&times;</button>
                </div>
              </div>

              {/* Print-only header */}
              <div className="hidden print:flex items-center justify-between p-6 border-b-2 border-slate-300">
                <div>
                  <h1 className="text-xl font-black text-slate-900">HappyPets Animal Clinic</h1>
                  <p className="text-xs text-slate-500">Medical Profile Report</p>
                </div>
                <p className="text-xs text-slate-500">Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <div className="p-6 space-y-6">

                {/* Owner/Client Section */}
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Owner / Client</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Full Name</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{pc?.full_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Phone</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{pc?.phone_number || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Email</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{pc?.email || '—'}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Address</p>
                      <p className="text-sm text-slate-700 mt-0.5">{pc?.address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Registered Pets</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">{allClientPets.length}</p>
                    </div>
                  </div>
                </section>

                {/* If owner-only: list all pets as cards */}
                {isOwnerOnly && (
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Registered Pets</h4>
                    {allClientPets.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No pets registered.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allClientPets.map(p => (
                          <div key={p.id} className="flex items-center gap-3 border border-slate-200 rounded-xl p-3 bg-white">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.name} className="w-14 h-14 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">{p.name?.charAt(0)}</div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800">{p.name}</p>
                              <p className="text-xs text-slate-500">{p.species} · {p.breed || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{p.sex || 'Unknown sex'}{p.weight ? ` · ${p.weight} kg` : ''}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* If pet profile: full pet detail */}
                {!isOwnerOnly && pp && (
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Patient / Pet Details</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-4 p-4 bg-emerald-50/40">
                        {pp.photo_url ? (
                          <img src={pp.photo_url} alt={pp.name} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-black text-3xl">{pp.name?.charAt(0)}</div>
                        )}
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{pp.name}</h3>
                          <p className="text-sm text-slate-500">{pp.species} · {pp.breed || 'Unknown breed'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border-t border-slate-200">
                        {[['Sex', pp.sex], ['Date of Birth', pp.dob ? new Date(pp.dob).toLocaleDateString() : null], ['Weight', pp.weight ? `${pp.weight} kg` : null], ['Color', pp.color], ['Species', pp.species], ['Breed', pp.breed]].map(([label, val]) => (
                          <div key={label}>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">{label}</p>
                            <p className="text-sm font-semibold text-slate-700 mt-0.5">{val || '—'}</p>
                          </div>
                        ))}
                        {pp.identifying_marks && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Identifying Marks</p>
                            <p className="text-sm text-slate-700 mt-0.5">{pp.identifying_marks}</p>
                          </div>
                        )}
                        {pp.medical_history && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Background Medical History</p>
                            <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{pp.medical_history}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Visit History (only when viewing pet profile) */}
                {!isOwnerOnly && (
                  <section>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Visit History ({ppr.length} Visits)</h4>
                    {ppr.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No visits recorded yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {ppr.map((r, idx) => (
                          <div key={r.id} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-700">Visit #{ppr.length - idx} — {new Date(r.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              <span className="text-xs text-slate-500">Dr. {r.vet_name || '—'}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                              {[['Chief Complaint', r.chief_complaint, 'col-span-2 sm:col-span-4'], ['Temp (°C)', r.temperature], ['Heart Rate', r.heart_rate], ['Pulse', r.pulse], ['Resp', r.respiration], ['BP', r.blood_pressure], ['Weight', r.weight ? `${r.weight} kg` : null]].map(([label, val, span]) => val ? (
                                <div key={label} className={span || ''}>
                                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{label}</p>
                                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{val}</p>
                                </div>
                              ) : null)}
                              {r.clinical_findings && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Clinical Findings</p><p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{r.clinical_findings}</p></div>}
                              {r.primary_diagnosis && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Tentative Diagnosis</p><p className="text-sm font-bold text-red-600 mt-0.5">{r.primary_diagnosis}</p></div>}
                              {r.differential_diagnoses && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Diagnosis</p><p className="text-sm text-orange-600 mt-0.5">{r.differential_diagnoses}</p></div>}
                              {r.treatment_interventions && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Treatment / Procedures</p><p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{r.treatment_interventions}</p></div>}
                              {r.prescribed_medicines && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Prescribed Medicines</p><p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{r.prescribed_medicines}</p></div>}
                              {r.advice && <div className="col-span-2 sm:col-span-4"><p className="text-[10px] text-slate-400 font-semibold uppercase">Advice</p><p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{r.advice}</p></div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* Print footer */}
                <div className="hidden print:block border-t border-slate-200 pt-4 text-center">
                  <p className="text-xs text-slate-400">This document is confidential and intended for authorized personnel only.</p>
                  <p className="text-xs text-slate-400">HappyPets Animal Clinic — Medical Records System</p>
                </div>

              </div>
            </div>
          </div>
        )
      })()}

      {/* Registration Wizard Modal */}
      {isRegistrationModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                Register New Client & Patient
              </h3>
              <button onClick={() => setIsRegistrationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Stepper Header */}
              <div className="flex items-center justify-center mb-8">
                <div className={`flex flex-col items-center ${regStep >= 1 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${regStep >= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Client Details</span>
                </div>
                <div className={`w-16 h-1 mx-4 rounded ${regStep >= 2 ? 'bg-primary' : 'bg-slate-200'}`}></div>
                <div className={`flex flex-col items-center ${regStep >= 2 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${regStep >= 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                  <span className="text-xs font-bold uppercase tracking-wider">Patient (Pet)</span>
                </div>
              </div>

              {/* Step 1: Client */}
              {regStep === 1 && (
                <form onSubmit={handleRegClientSubmit} className="space-y-6">
                  <div className="flex gap-6 py-2 border-b border-slate-100">
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-slate-700">
                      <input type="radio" name="regMode" value="create" checked={regMode === "create"} onChange={() => setRegMode("create")} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" />
                      + Register New Client
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-slate-700">
                      <input type="radio" name="regMode" value="select" checked={regMode === "select"} onChange={() => setRegMode("select")} className="h-4 w-4 text-primary focus:ring-primary border-slate-300" />
                      Select Existing Client
                    </label>
                  </div>

                  {regMode === "create" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-600">Client Full Name *</label>
                        <input type="text" value={newClientData.full_name} onChange={e => setNewClientData(prev => ({...prev, full_name: e.target.value}))} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-600">Email Address</label>
                        <input type="email" value={newClientData.email} onChange={e => setNewClientData(prev => ({...prev, email: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-600">Phone Number</label>
                        <input type="tel" value={newClientData.phone_number} onChange={e => setNewClientData(prev => ({...prev, phone_number: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-600">Physical Address</label>
                        <input type="text" value={newClientData.address} onChange={e => setNewClientData(prev => ({...prev, address: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative" ref={regClientSearchRef}>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Select Existing Client *</label>
                      <input
                        type="text"
                        value={regClientSearchText}
                        onFocus={() => setIsRegClientDropdownOpen(true)}
                        onChange={(e) => {
                          setRegClientSearchText(e.target.value)
                          setIsRegClientDropdownOpen(true)
                          const matched = clients.find(c => c.full_name?.toLowerCase() === e.target.value.toLowerCase())
                          if (matched) {
                            setSelectedClientId(matched.id)
                          } else {
                            setSelectedClientId("")
                          }
                        }}
                        placeholder="Search existing client..."
                        required={!selectedClientId}
                        className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                      />
                      {isRegClientDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {clients.filter(c => c.full_name?.toLowerCase().includes(regClientSearchText.toLowerCase())).length > 0 ? (
                            clients
                              .filter(c => c.full_name?.toLowerCase().includes(regClientSearchText.toLowerCase()))
                              .map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    setRegClientSearchText(`${c.full_name} (${c.email || c.phone_number || "N/A"})`)
                                    setSelectedClientId(c.id)
                                    setIsRegClientDropdownOpen(false)
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/80 focus:bg-muted/80 focus:outline-none text-foreground font-normal border-b border-border last:border-b-0"
                                >
                                  <div className="font-semibold">{c.full_name}</div>
                                  <div className="text-xs text-muted-foreground">{c.email ? c.email : ""} {c.phone_number ? `• ${c.phone_number}` : ""}</div>
                                </button>
                              ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-muted-foreground">No clients found matching "{regClientSearchText}"</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                      Continue to Pet Details →
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Patient/Pet */}
              {regStep === 2 && (
                <form onSubmit={handleRegPetSubmit} className="space-y-4">
                  <div className="flex items-center gap-4 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold">
                      {regMode === "create" ? newClientData.full_name.charAt(0) : clients.find(c => c.id == selectedClientId)?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">Owner Verified</div>
                      <div className="font-semibold text-slate-800">
                        {regMode === "create" ? newClientData.full_name : clients.find(c => c.id == selectedClientId)?.full_name}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Photo Upload */}
                    <div className="md:col-span-2 flex items-center gap-4">
                      {newPetData.photo_url ? (
                        <img src={newPetData.photo_url} alt="Pet Preview" className="w-16 h-16 rounded-full object-cover border shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-medium border border-slate-200">No Photo</div>
                      )}
                      <div>
                        <input type="file" accept="image/*" ref={petPhotoInputRef} onChange={handlePetPhotoUpload} className="hidden" />
                        <button type="button" onClick={() => petPhotoInputRef.current?.click()} disabled={uploadingPetPhoto} className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors">
                          {uploadingPetPhoto ? "Uploading..." : "Upload Pet Photo"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Pet Name *</label>
                      <input type="text" value={newPetData.name} onChange={e => setNewPetData(prev => ({...prev, name: e.target.value}))} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Species *</label>
                      <select value={newPetData.species} onChange={e => setNewPetData(prev => ({...prev, species: e.target.value}))} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background">
                        <option value="">Select...</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Rabbit">Rabbit</option>
                        <option value="Bird">Bird</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Breed</label>
                      <input type="text" value={newPetData.breed} onChange={e => setNewPetData(prev => ({...prev, breed: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-600">Date of Birth / Age *</label>
                        <div className="flex gap-1 bg-slate-100 p-0.5 rounded text-[10px]">
                          <button
                            type="button"
                            onClick={() => setPetAgeType("dob")}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${petAgeType === "dob" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          >
                            DOB
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPetAgeType("age")
                              const { years, months } = calculateAgeFromDob(newPetData.dob)
                              setPetAgeYears(years)
                              setPetAgeMonths(months)
                            }}
                            className={`px-2 py-0.5 rounded font-bold transition-all ${petAgeType === "age" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                          >
                            Age
                          </button>
                        </div>
                      </div>

                      {petAgeType === "dob" ? (
                        <input
                          type="date"
                          value={newPetData.dob}
                          onChange={e => setNewPetData(prev => ({...prev, dob: e.target.value}))}
                          className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground"
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="Years"
                              value={petAgeYears}
                              onChange={e => handleAgeChange(e.target.value, petAgeMonths)}
                              className="w-full px-3 py-2 pr-8 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground text-sm"
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground font-medium pointer-events-none">Yrs</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="11"
                              placeholder="Months"
                              value={petAgeMonths}
                              onChange={e => handleAgeChange(petAgeYears, e.target.value)}
                              className="w-full px-3 py-2 pr-8 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background text-foreground text-sm"
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] text-muted-foreground font-medium pointer-events-none">Mos</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Sex</label>
                      <select value={newPetData.sex} onChange={e => setNewPetData(prev => ({...prev, sex: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background">
                        <option value="">Select...</option>
                        <option value="Male (Intact)">Male (Intact)</option>
                        <option value="Male (Neutered)">Male (Neutered)</option>
                        <option value="Female (Intact)">Female (Intact)</option>
                        <option value="Female (Spayed)">Female (Spayed)</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Weight</label>
                      <div className="flex gap-2">
                        <input type="number" step="0.001" value={newPetData.weight} onChange={e => setNewPetData(prev => ({...prev, weight: e.target.value}))} className="flex-1 w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
                        <select value={regWeightUnit} onChange={e => setRegWeightUnit(e.target.value)} className="w-20 px-2 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 outline-none bg-slate-50">
                          <option value="kg">kg</option>
                          <option value="gram">g</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                    <button type="button" onClick={() => setRegStep(1)} className="text-slate-500 font-semibold text-sm hover:text-slate-800">
                      ← Back to Client
                    </button>
                    <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20">
                      Register Pet & Finish
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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

                  {/* Inline Client & Patient Editor */}
                  {isEditMode && editClientData && editPetData && (
                    <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsClientPetExpanded(!isClientPetExpanded)}
                        className="w-full flex items-center justify-between p-4 bg-slate-100/50 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-slate-700 font-semibold">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Owner & Patient Details
                        </div>
                        <svg className={`w-4 h-4 text-slate-500 transition-transform ${isClientPetExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isClientPetExpanded && (
                        <div className="p-5 border-t border-slate-200 space-y-6">
                          {/* Client Edit Section */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Owner Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium mb-1">Full Name *</label>
                                <input type="text" name="full_name" value={editClientData.full_name || ""} onChange={handleEditClientChange} required className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Email</label>
                                <input type="email" name="email" value={editClientData.email || ""} onChange={handleEditClientChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Phone Number</label>
                                <input type="text" name="phone_number" value={editClientData.phone_number || ""} onChange={handleEditClientChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Address</label>
                                <input type="text" name="address" value={editClientData.address || ""} onChange={handleEditClientChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Pet Edit Section */}
                          <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Patient Details</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium mb-1">Name *</label>
                                <input type="text" name="name" value={editPetData.name || ""} onChange={handleEditPetChange} required className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Species *</label>
                                <select name="species" value={editPetData.species || ""} onChange={handleEditPetChange} required className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none">
                                  <option value="Dog">Dog</option>
                                  <option value="Cat">Cat</option>
                                  <option value="Rabbit">Rabbit</option>
                                  <option value="Bird">Bird</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Breed</label>
                                <input type="text" name="breed" value={editPetData.breed || ""} onChange={handleEditPetChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Sex</label>
                                <select name="sex" value={editPetData.sex || ""} onChange={handleEditPetChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none">
                                  <option value="">Select...</option>
                                  <option value="Male (Intact)">Male (Intact)</option>
                                  <option value="Male (Neutered)">Male (Neutered)</option>
                                  <option value="Female (Intact)">Female (Intact)</option>
                                  <option value="Female (Spayed)">Female (Spayed)</option>
                                  <option value="Unknown">Unknown</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Date of Birth</label>
                                <input type="date" name="dob" value={(editPetData.dob && editPetData.dob.includes('T')) ? editPetData.dob.split('T')[0] : (editPetData.dob || "")} onChange={handleEditPetChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1">Base Weight (kg)</label>
                                <input type="number" step="0.01" name="weight" value={editPetData.weight || ""} onChange={handleEditPetChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-white focus:ring-1 focus:ring-primary outline-none" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* General Info Section */}
                  <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                    <h4 className="font-semibold mb-3 text-primary">Visit Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative" ref={petSearchRef}>
                        <label className="block text-xs font-medium mb-1">Patient (Pet) *</label>
                        <input
                          type="text"
                          value={petSearchText}
                          onFocus={() => setIsPetDropdownOpen(true)}
                          onChange={(e) => {
                            setPetSearchText(e.target.value)
                            setIsPetDropdownOpen(true)
                            const matched = patients.find(p => p.name?.toLowerCase() === e.target.value.toLowerCase())
                            if (matched) {
                              setFormData(prev => ({ ...prev, pet_id: matched.id }))
                            } else {
                              setFormData(prev => ({ ...prev, pet_id: "" }))
                            }
                          }}
                          placeholder="Type patient name..."
                          required
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                        />
                        {isPetDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {patients.filter(p => p.name?.toLowerCase().startsWith(petSearchText.toLowerCase())).length > 0 ? (
                              patients
                                .filter(p => p.name?.toLowerCase().startsWith(petSearchText.toLowerCase()))
                                .map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setPetSearchText(`${p.name} (${p.owner_name || ""})`)
                                      setFormData(prev => ({ ...prev, pet_id: p.id }))
                                      setIsPetDropdownOpen(false)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted/80 focus:bg-muted/80 focus:outline-none text-foreground font-normal"
                                  >
                                    {p.name} ({p.owner_name})
                                  </button>
                                ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-muted-foreground">No patients starting with "{petSearchText}"</div>
                            )}
                          </div>
                        )}
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
                    <h4 className="font-semibold mb-3 text-sm">Vitals (TPR, BP & Weight)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Temp (°C)</label>
                        <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Heart Rate (bpm)</label>
                        <input type="number" name="heart_rate" value={formData.heart_rate} onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
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
                        <label className="block text-xs font-medium mb-1">BP (mmHg)</label>
                        <input type="text" name="blood_pressure" value={formData.blood_pressure} placeholder="120/80" onChange={handleInputChange} className="w-full px-3 py-2 text-sm border border-border rounded-md" />
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
                    <label className="block text-sm font-medium mb-1">Advice</label>
                    <textarea
                      name="advice"
                      value={formData.advice || ""}
                      onChange={handleInputChange}
                      rows="2"
                      placeholder="e.g. Home care instructions, dietary changes..."
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Clinical Findings</label>
                    <textarea
                      name="clinical_findings"
                      value={formData.clinical_findings}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    ></textarea>
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-red-500">Tentative Diagnosis</label>
                    <input
                      type="text"
                      name="primary_diagnosis"
                      value={formData.primary_diagnosis}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-1 text-orange-500">Diagnosis</label>
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

                  {/* ====== Follow-up / Reminder ====== */}
                  <div className="md:col-span-2 border border-blue-100 bg-blue-50/40 rounded-lg p-4 mt-2">
                    <h4 className="font-semibold mb-3 text-sm text-blue-800 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Next Vaccination / Follow-up Reminder
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700">Next Vaccination Due Date</label>
                        <input
                          type="date"
                          name="reminder_date"
                          value={formData.reminder_date || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700">Vaccine Name (Optional)</label>
                        <input
                          type="text"
                          name="reminder_vaccine_name"
                          value={formData.reminder_vaccine_name || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. Annual Booster, Rabies..."
                          className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====== Unified Attachments Upload ====== */}
                  <div className="md:col-span-2 border border-border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 text-sm text-slate-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      Attachments
                    </h4>

                    {/* Uploaded files list */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {attachments.map((file, idx) => {
                          const isImage = file.type?.startsWith('image') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)
                          return (
                            <div key={idx} className="group relative flex flex-col items-center border border-border rounded-lg overflow-hidden bg-muted/20 w-28">
                              {isImage ? (
                                <img src={file.url} alt={file.name} className="w-full h-20 object-cover" />
                              ) : (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="w-full h-20 flex flex-col items-center justify-center gap-1 hover:bg-muted/40 transition-colors">
                                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  <span className="text-[9px] text-primary font-semibold uppercase">{file.name.split('.').pop()}</span>
                                </a>
                              )}
                              <p className="text-[10px] text-muted-foreground px-1 py-0.5 truncate w-full text-center">{file.name}</p>
                              <button
                                type="button"
                                onClick={() => removeAttachment(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >&times;</button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Upload drop zone */}
                    <div>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        multiple
                        ref={attachmentInputRef}
                        onChange={handleAttachmentUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => attachmentInputRef.current?.click()}
                        disabled={uploadingAttachment}
                        className="w-full border-2 border-dashed border-border rounded-lg py-5 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {uploadingAttachment ? (
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        )}
                        <span className="text-sm font-medium">{uploadingAttachment ? "Uploading..." : "Click to upload files"}</span>
                        <span className="text-xs">Images, PDF, DOC, XLS, TXT — multiple files supported</span>
                      </button>
                    </div>
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
