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
  
  const [formData, setFormData] = useState({
    pet_id: "", vet_id: "", visit_date: "", chief_complaint: "", temperature: "", pulse: "", respiration: "", weight: "", clinical_findings: "", primary_diagnosis: "", differential_diagnoses: "", treatment_interventions: "", prescribed_medicines: "", attachments_url: "", history: ""
  })

  const [weightUnitMR, setWeightUnitMR] = useState("kg")

  // Registration Wizard State
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false)
  const [regStep, setRegStep] = useState(1) // 1: Client, 2: Pet
  const [regMode, setRegMode] = useState("create") // "create" or "select" client
  const [selectedClientId, setSelectedClientId] = useState("")
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

  // Consent form & image uploads
  const [consentFile, setConsentFile] = useState(null)
  const [uploadingConsent, setUploadingConsent] = useState(false)
  const consentInputRef = useRef(null)

  const IMAGE_SLOTS = 5
  const [imageFiles, setImageFiles] = useState(Array(IMAGE_SLOTS).fill(null))
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (petSearchRef.current && !petSearchRef.current.contains(event.target)) {
        setIsPetDropdownOpen(false)
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
        fetchWithAuth("/api/admin/medical-records"),
        fetchWithAuth("/api/admin/patients"),
        fetchWithAuth("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }),
        fetchWithAuth("/api/admin/clients")
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

  const uploadFile = async (file) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetchWithAuth("/api/admin/medical-records/upload", { method: "POST", body: fd })
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

  const openRegistrationWizard = () => {
    setIsRegistrationModalOpen(true)
    setRegStep(1)
    setRegMode("create")
    setSelectedClientId("")
    setNewClientData({ full_name: "", email: "", phone_number: "", address: "" })
    setNewPetData({ name: "", species: "", breed: "", dob: "", sex: "", color: "", weight: "", identifying_marks: "", medical_history: "", photo_url: "" })
    setRegWeightUnit("kg")
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
    setPetSearchText("")
    setIsPetDropdownOpen(false)
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
    const petObj = patients.find(p => Number(p.id) === Number(record.pet_id));
    setPetSearchText(petObj ? `${petObj.name} (${petObj.owner_name || ""})` : "");
    setIsPetDropdownOpen(false);
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

      <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm">
        {clients.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No clients found. Click "Register Client & Pet" to start.</div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map(client => {
              const clientPets = patients.filter(p => Number(p.user_id) === Number(client.id));
              const isExpanded = expandedClients[client.id];
              return (
                <div key={client.id} className="bg-white">
                  <div 
                    onClick={() => toggleClient(client.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-slate-800">{client.full_name}</span>
                      <span className="text-xs text-slate-500">{client.email || 'No email'} | {client.phone_number || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">{clientPets.length} Pets</span>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50 border-t border-border p-4 pl-8 space-y-4">
                      {clientPets.length === 0 ? (
                        <div className="text-sm text-slate-500 italic">No pets registered for this client.</div>
                      ) : (
                        clientPets.map(pet => {
                          const petRecords = records.filter(r => Number(r.pet_id) === Number(pet.id));
                          const isPetExpanded = expandedPets[pet.id];
                          return (
                            <div key={pet.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                              <div 
                                onClick={() => togglePet(pet.id)}
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100"
                              >
                                <div className="flex items-center gap-3">
                                  {pet.photo_url ? (
                                    <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">{pet.name.charAt(0)}</div>
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-800">{pet.name}</span>
                                    <div className="text-xs text-slate-500">{pet.species} - {pet.breed || 'Unknown'} | {pet.sex || 'Unknown Sex'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">{petRecords.length} Visits</span>
                                  <svg className={`w-4 h-4 text-slate-400 transition-transform ${isPetExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>

                              {isPetExpanded && (
                                <div className="bg-slate-50 p-3">
                                  {petRecords.length === 0 ? (
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-500 italic">No medical records found for this pet.</span>
                                      <button onClick={() => { openAddModal(); setPetSearchText(`${pet.name} (${client.full_name})`); setFormData(prev => ({ ...prev, pet_id: pet.id })) }} className="text-xs text-primary font-semibold hover:underline">Log Initial Visit</button>
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-sm">
                                      <thead>
                                        <tr className="text-xs text-slate-500 border-b border-slate-200">
                                          <th className="pb-2 font-medium">Date & Vet</th>
                                          <th className="pb-2 font-medium">Diagnosis / CC</th>
                                          <th className="pb-2 font-medium text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {petRecords.map(record => (
                                          <tr key={record.id} className="hover:bg-slate-100/50">
                                            <td className="py-2">
                                              <div className="font-semibold text-slate-700">{new Date(record.visit_date).toLocaleDateString()}</div>
                                              <div className="text-[10px] text-slate-500">Dr. {record.vet_name}</div>
                                            </td>
                                            <td className="py-2">
                                              <div className="font-medium text-slate-800">{record.primary_diagnosis || "No formal diagnosis"}</div>
                                              <div className="text-xs text-slate-500 truncate max-w-[200px]">{record.chief_complaint || "-"}</div>
                                            </td>
                                            <td className="py-2 text-right">
                                              <button onClick={() => openEditModal(record)} className="text-xs font-semibold text-primary hover:text-primary/80 mr-3">View/Edit</button>
                                              {isAdmin && (
                                                <button onClick={() => handleDelete(record.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                  <div className="mt-3 text-right">
                                    <button onClick={() => { openAddModal(); setPetSearchText(`${pet.name} (${client.full_name})`); setFormData(prev => ({ ...prev, pet_id: pet.id })) }} className="text-xs font-semibold bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-100">
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
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

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
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Select Existing Client *</label>
                      <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background">
                        <option value="">-- Choose a Client --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.full_name} {c.email ? `(${c.email})` : ''}</option>
                        ))}
                      </select>
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
                      <label className="block text-xs font-semibold mb-1 text-slate-600">Date of Birth</label>
                      <input type="date" value={newPetData.dob} onChange={e => setNewPetData(prev => ({...prev, dob: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-background" />
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
