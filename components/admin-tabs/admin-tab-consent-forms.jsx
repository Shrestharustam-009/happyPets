"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect, useRef } from "react"
import { ClipboardCheck, Plus, Trash2, Eye, Paperclip, Printer, CheckCircle2 } from "lucide-react"


export default function AdminTabConsentForms() {
  const [consentForms, setConsentForms] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Pets data
  const [allPets, setAllPets] = useState([])

  // Searchable client state
  const [clientSearchText, setClientSearchText] = useState("")
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const clientSearchRef = useRef(null)

  // Form Fields
  const [clientId, setClientId] = useState("")
  const [petId, setPetId] = useState("")
  const [formType, setFormType] = useState("surgery") // default to surgery as requested
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  // Drawing signature states
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  const [signingMode, setSigningMode] = useState("digital") // "digital" or "scanned"

  // Interactive sheet fields (fill in the blanks)
  const [ownerName, setOwnerName] = useState("")
  const [ownerAddress, setOwnerAddress] = useState("")
  const [ownerContact, setOwnerContact] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")

  const [petName, setPetName] = useState("")
  const [petBreed, setPetBreed] = useState("")
  const [petAge, setPetAge] = useState("")
  const [petColor, setPetColor] = useState("")
  const [petSpecies, setPetSpecies] = useState("")
  const [petMicrochip, setPetMicrochip] = useState("0")
  const [petSex, setPetSex] = useState("Male Intact")
  const [petWeight, setPetWeight] = useState("")

  const [printedDate, setPrintedDate] = useState("")

  // Today, the animal need (Sedation/Anesthesia checkboxes)
  const [needLightSedation, setNeedLightSedation] = useState(false)
  const [needDeepSedation, setNeedDeepSedation] = useState(false)
  const [needAnesthesia, setNeedAnesthesia] = useState(false)

  // Reason for anesthesia
  const [reasonSpay, setReasonSpay] = useState(false)
  const [reasonNeuter, setReasonNeuter] = useState(false)
  const [reasonMicrochip, setReasonMicrochip] = useState(false)
  const [reasonScaling, setReasonScaling] = useState(false)
  const [reasonEarCleaning, setReasonEarCleaning] = useState(false)
  const [reasonNailTrimming, setReasonNailTrimming] = useState(false)
  const [reasonDewClaw, setReasonDewClaw] = useState(false)
  const [reasonVaccinations, setReasonVaccinations] = useState(false)
  const [reasonExploratory, setReasonExploratory] = useState(false)
  const [reasonExploratoryText, setReasonExploratoryText] = useState("")

  // Requests under anesthesia
  const [underAnesthesiaRequest, setUnderAnesthesiaRequest] = useState("")

  // Declarations
  const [declarationSalutation, setDeclarationSalutation] = useState("Miss.")
  const [declarationOwnerType, setDeclarationOwnerType] = useState("owner") // "owner" or "authorized"

  // Non-surgery specific fields
  const [treatmentDesc, setTreatmentDesc] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [euthanasiaReason, setEuthanasiaReason] = useState("")
  const [aftercare, setAftercare] = useState("Communal Cremation")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")

  useEffect(() => {
    fetchConsentForms()
    fetchClients()
    fetchPets()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        setIsAdmin(parsed.role === "admin")
      } catch (e) { }
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (isCreateModalOpen) {
      const date = new Date()
      const formatted = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) + " " + date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      })
      setPrintedDate(formatted)
    }
  }, [isCreateModalOpen])

  const fetchConsentForms = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth("/api/admin/consent-forms")
      if (res.ok) {
        const data = await res.json()
        setConsentForms(data)
      }
    } catch (error) {
      console.error("Failed to fetch consent forms:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/clients")
      if (res.ok) {
        const data = await res.json()
        setClients(data)
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const fetchPets = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/patients")
      if (res.ok) {
        const data = await res.json()
        setAllPets(data)
      }
    } catch (error) {
      console.error("Failed to fetch pets:", error)
    }
  }

  const calculateDetailedAge = (dobString) => {
    if (!dobString) return ""
    const dob = new Date(dobString)
    const today = new Date()

    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()

    if (days < 0) {
      months -= 1
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years -= 1
      months += 12
    }

    return `${years} Years ${months} Months ${days} Days`
  }

  const prepopulatePetInfo = (pet) => {
    setPetName(pet.name || "")
    setPetBreed(pet.breed || "")
    setPetAge(calculateDetailedAge(pet.dob) || pet.age || "")
    setPetColor(pet.color || "")
    setPetSpecies(pet.species || "")
    setPetSex(pet.sex || "Male Intact")
    setPetWeight(pet.weight || "")
    setPetMicrochip(pet.identifying_marks || "0")
  }

  const handleClientChange = (val) => {
    setClientId(val)
    if (val) {
      const selectedClient = clients.find(c => Number(c.id) === Number(val))
      if (selectedClient) {
        setOwnerName(selectedClient.full_name || "")
        setOwnerContact(selectedClient.phone_number || "")
        setOwnerEmail(selectedClient.email || "")
        setOwnerAddress(selectedClient.address || "")
      }

      const clientPets = allPets.filter(p => Number(p.user_id) === Number(val))
      if (clientPets.length > 0) {
        setPetId(clientPets[0].id)
        prepopulatePetInfo(clientPets[0])
      } else {
        setPetId("")
        resetPetFields()
      }
    } else {
      setPetId("")
      resetPetFields()
    }
  }

  const handlePetChange = (val) => {
    setPetId(val)
    if (val) {
      const selectedPet = allPets.find(p => Number(p.id) === Number(val))
      if (selectedPet) {
        prepopulatePetInfo(selectedPet)
      }
    } else {
      resetPetFields()
    }
  }

  const resetPetFields = () => {
    setPetName("")
    setPetBreed("")
    setPetAge("")
    setPetColor("")
    setPetSpecies("")
    setPetSex("Male Intact")
    setPetWeight("")
    setPetMicrochip("0")
  }

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingAttachment(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetchWithAuth("/api/upload/consent-attachment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        setAttachmentUrl(data.file_path)
      } else {
        const err = await res.json()
        alert(err.message || "Failed to upload file")
      }
    } catch (err) {
      console.error("Error uploading attachment:", err)
      alert("Error uploading attachment")
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this consent form? This action is permanent.")) return

    try {
      const token = localStorage.getItem("adminToken")
      const res = await fetchWithAuth(`/api/admin/consent-forms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        fetchConsentForms()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to delete consent form")
      }
    } catch (error) {
      console.error("Failed to delete consent form:", error)
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()

    if (!clientId) return alert("Please select a client")
    if (!petId) return alert("Please select a pet")
    if (!attachmentUrl) return alert("Please upload the signed consent form image/PDF")

    const formDataPayload = {
      ownerName,
      ownerAddress,
      ownerContact,
      ownerEmail,
      petName,
      petBreed,
      petAge,
      petColor,
      petSpecies,
      petMicrochip,
      petSex,
      petWeight,
      printedDate,
      needLightSedation,
      needDeepSedation,
      needAnesthesia,
      reasonSpay,
      reasonNeuter,
      reasonMicrochip,
      reasonScaling,
      reasonEarCleaning,
      reasonNailTrimming,
      reasonDewClaw,
      reasonVaccinations,
      reasonExploratory,
      reasonExploratoryText,
      underAnesthesiaRequest,
      declarationSalutation,
      declarationOwnerType,
      treatmentDesc,
      estimatedCost,
      euthanasiaReason,
      aftercare,
      checkIn,
      checkOut,
      signingMode
    }

    try {
      const res = await fetchWithAuth("/api/admin/consent-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          pet_id: petId,
          form_type: formType,
          status: "Signed",
          content_data: formDataPayload,
          attachment_url: attachmentUrl
        })
      })

      if (res.ok) {
        fetchConsentForms()
        setIsCreateModalOpen(false)
        resetFormStates()
      } else {
        const errorData = await res.json()
        alert(errorData.error || "Failed to create consent form")
      }
    } catch (error) {
      console.error("Error creating consent form:", error)
    }
  }

  const resetFormStates = () => {
    setClientId("")
    setClientSearchText("")
    setPetId("")
    setFormType("surgery")
    setAttachmentUrl("")
    setOwnerName("")
    setOwnerAddress("")
    setOwnerContact("")
    setOwnerEmail("")
    resetPetFields()
    setNeedLightSedation(false)
    setNeedDeepSedation(false)
    setNeedAnesthesia(false)
    setReasonSpay(false)
    setReasonNeuter(false)
    setReasonMicrochip(false)
    setReasonScaling(false)
    setReasonEarCleaning(false)
    setReasonNailTrimming(false)
    setReasonDewClaw(false)
    setReasonVaccinations(false)
    setReasonExploratory(false)
    setReasonExploratoryText("")
    setUnderAnesthesiaRequest("")
    setDeclarationSalutation("Miss.")
    setDeclarationOwnerType("owner")
    setTreatmentDesc("")
    setEstimatedCost("")
    setEuthanasiaReason("")
    setAftercare("Communal Cremation")
    setCheckIn("")
    setCheckOut("")
    setIsDrawingActive(false)
    setSigningMode("digital")
  }

  // Signature canvas interaction logic
  const getCoordinates = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // For touch devices
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    
    // For desktop mouse
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = "#0f172a" // Slate-900 color for high-contrast digital signature
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveCanvasSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Check if canvas is empty before uploading
    const blank = document.createElement('canvas')
    blank.width = canvas.width
    blank.height = canvas.height
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert("Please sign before saving.")
      return
    }

    setUploadingAttachment(true)
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to capture signature image.")
          setUploadingAttachment(false)
          return
        }

        const file = new File([blob], "digital_signature.png", { type: "image/png" })
        const formData = new FormData()
        formData.append("file", file)

        const token = localStorage.getItem("adminToken")
        const res = await fetchWithAuth("/api/upload/consent-attachment", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setAttachmentUrl(data.file_path)
          setIsDrawingActive(false)
        } else {
          const err = await res.json()
          alert(err.message || "Failed to upload digital signature")
        }
        setUploadingAttachment(false)
      }, "image/png")
    } catch (err) {
      console.error("Error saving signature:", err)
      alert("Error saving signature")
      setUploadingAttachment(false)
    }
  }

  const openViewModal = (form) => {
    let parsedContent = {}
    try {
      parsedContent = typeof form.content_data === "string" ? JSON.parse(form.content_data) : form.content_data
    } catch (e) {
      parsedContent = form.content_data || {}
    }
    setSelectedForm({ ...form, parsedContent })
    setIsViewModalOpen(true)
  }

  const getFormTypeName = (type) => {
    switch (type) {
      case "general": return "General Treatment Consent"
      case "surgery": return "Surgical Consent Form"
      case "euthanasia": return "Euthanasia Consent Form"
      case "boarding": return "Boarding/Kennel Consent"
      default: return type
    }
  }

  const clientPets = allPets.filter(p => Number(p.user_id) === Number(clientId))

  // Filter clients whose full name starts with the typed prefix
  const filteredClients = clients.filter(c =>
    c.full_name?.toLowerCase().startsWith(clientSearchText.toLowerCase())
  )

  const filteredForms = consentForms.filter(f => {
    const clientName = f.client_name?.toLowerCase() || ""
    const clientEmail = f.client_email?.toLowerCase() || ""
    const pet = f.pet_name?.toLowerCase() || ""
    const matchesSearch = clientName.includes(searchTerm.toLowerCase()) ||
      clientEmail.includes(searchTerm.toLowerCase()) ||
      pet.includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "" || f.form_type === typeFilter
    return matchesSearch && matchesType
  })

  // Print helper
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consent & Release Forms</h2>
          <p className="text-sm text-slate-500">Manage client waivers, surgical consents, and treatment agreements.</p>
        </div>
        <button
          onClick={() => { resetFormStates(); setIsCreateModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Consent Form
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row gap-4 print:hidden">
        <input
          type="text"
          placeholder="Search by client, pet name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground text-sm"
        >
          <option value="">All Form Types</option>
          <option value="general">General Treatment</option>
          <option value="surgery">Surgical Consent</option>
          <option value="euthanasia">Euthanasia</option>
          <option value="boarding">Boarding/Kennel</option>
        </select>
      </div>

      {/* CONSENT FORMS TABLE */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 print:hidden">Loading forms...</div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border border-dashed border-border rounded-2xl print:hidden">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-slate-400 opacity-60" />
          <p className="font-semibold">No consent forms found</p>
          <p className="text-xs text-slate-400 mt-1">Create a new consent form to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-sm print:hidden">
          <table className="w-full border-collapse text-left">
            <thead className="bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Client Info</th>
                <th className="px-6 py-3.5">Pet Name</th>
                <th className="px-6 py-3.5">Form Type</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date Signed</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredForms.map((form) => (
                <tr key={form.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{form.client_name}</div>
                    <div className="text-xs text-muted-foreground">{form.client_email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{form.pet_name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {form.form_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(form.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {form.attachment_url && (
                        <a
                          href={form.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors inline-block"
                          title="View Signed Attachment"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Paperclip className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openViewModal(form)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="View & Re-print Waiver"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete Form"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE CONSENT FORM MODAL (WORKSPACE) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[95vh] border border-border isolate print:static print:max-h-none print:shadow-none print:border-none print:my-0">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-primary text-primary-foreground shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                <h3 className="font-bold text-lg">Generate Consent Form Waiver</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-primary-foreground/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Quick selectors row */}
            <div className="bg-slate-50 p-4 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 print:hidden">
              <div className="relative" ref={clientSearchRef}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Client</label>
                <input
                  type="text"
                  value={clientSearchText}
                  onFocus={() => setIsClientDropdownOpen(true)}
                  onChange={(e) => {
                    setClientSearchText(e.target.value)
                    setIsClientDropdownOpen(true)
                    const matched = clients.find(c => c.full_name?.toLowerCase() === e.target.value.toLowerCase())
                    if (matched) {
                      handleClientChange(matched.id)
                    } else {
                      handleClientChange("")
                    }
                  }}
                  placeholder="Type client name..."
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {isClientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setClientSearchText(c.full_name)
                            handleClientChange(c.id)
                            setIsClientDropdownOpen(false)
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted/80 focus:bg-muted/80 focus:outline-none text-foreground"
                        >
                          {c.full_name} ({c.email || 'No email'})
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No clients starting with "{clientSearchText}"</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Pet</label>
                {clientId ? (
                  clientPets.length > 0 ? (
                    <select
                      value={petId}
                      onChange={(e) => handlePetChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">-- Choose Pet --</option>
                      {clientPets.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.breed || 'Unknown'})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-red-600 font-bold py-2.5">
                      This client has no registered pets.
                    </div>
                  )
                ) : (
                  <select
                    disabled
                    className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground text-sm cursor-not-allowed"
                  >
                    <option>-- Select Client First --</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Consent Form Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="surgery">Surgical Consent Form</option>
                  <option value="general">General Treatment Consent</option>
                  <option value="euthanasia">Euthanasia Consent</option>
                  <option value="boarding">Boarding/Kennel Consent</option>
                </select>
              </div>
            </div>

            {/* Form Editor & Sheet Preview */}
            <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col items-center print:bg-white print:p-0">
              <div className="bg-white w-full max-w-[850px] p-10 pb-16 text-slate-800 print:p-0 print:w-full print-area">
                <div>
                  {/* Clinic Letterhead */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <img src="https://happypets.com.np/logo.png" alt="HappyPets" className="w-16 h-16 object-contain" />
                        <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Happy Pets Animal Clinic</h1>
                          <p className="text-xs text-slate-500 font-semibold">Imadol, Lalitpur, NEPAL</p>
                          <p className="text-xs text-slate-500">9860872125, 9860872125 | happypetsnepal@gmail.com</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold self-start mt-2">
                        Date: <input
                          type="text"
                          value={printedDate}
                          onChange={(e) => setPrintedDate(e.target.value)}
                          className="bg-transparent border-b border-slate-300 focus:border-primary focus:outline-none text-slate-700 w-32 font-semibold text-right"
                        />
                      </div>
                    </div>

                    {/* Owner & Pet Details Grid */}
                    <table className="w-full border border-slate-900 border-collapse mb-4 text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-50">
                          <th className="w-1/2 border-r border-slate-900 p-2 text-center font-bold uppercase tracking-wider text-slate-700">Owner's Details</th>
                          <th className="w-1/2 p-2 text-center font-bold uppercase tracking-wider text-slate-700">Pet's Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {/* Owner Columns */}
                          <td className="border-r border-slate-900 p-3 vertical-align-top">
                            <table className="w-full border-collapse">
                              <tbody>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="w-20 py-2 font-bold text-slate-600">Name</td>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      value={ownerName}
                                      onChange={(e) => setOwnerName(e.target.value)}
                                      placeholder="Click to type Name..."
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-900 font-bold border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-2 font-bold text-slate-600">Address</td>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      value={ownerAddress}
                                      onChange={(e) => setOwnerAddress(e.target.value)}
                                      placeholder="Click to type Address..."
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-2 font-bold text-slate-600">Contact</td>
                                  <td className="py-2">
                                    <input
                                      type="text"
                                      value={ownerContact}
                                      onChange={(e) => setOwnerContact(e.target.value)}
                                      placeholder="Click to type Contact..."
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-bold text-slate-600">Email</td>
                                  <td className="py-2">
                                    <input
                                      type="email"
                                      value={ownerEmail}
                                      onChange={(e) => setOwnerEmail(e.target.value)}
                                      placeholder="Click to type Email..."
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>

                          {/* Pet Columns */}
                          <td className="p-3 vertical-align-top">
                            <table className="w-full border-collapse">
                              <tbody>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="w-20 py-1.5 font-bold text-slate-600">Name</td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      type="text"
                                      value={petName}
                                      onChange={(e) => setPetName(e.target.value)}
                                      placeholder="Name"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-900 font-bold border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                  <td className="w-16 py-1.5 font-bold text-slate-600">Breed</td>
                                  <td className="py-1.5">
                                    <input
                                      type="text"
                                      value={petBreed}
                                      onChange={(e) => setPetBreed(e.target.value)}
                                      placeholder="Breed"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-1.5 font-bold text-slate-600">DOB/Age</td>
                                  <td className="py-1.5" colSpan="3">
                                    <input
                                      type="text"
                                      value={petAge}
                                      onChange={(e) => setPetAge(e.target.value)}
                                      placeholder="Age / Date of birth"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-1.5 font-bold text-slate-600">Species</td>
                                  <td className="py-1.5 pr-2">
                                    <input
                                      type="text"
                                      value={petSpecies}
                                      onChange={(e) => setPetSpecies(e.target.value)}
                                      placeholder="Species"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                  <td className="py-1.5 font-bold text-slate-600">Color</td>
                                  <td className="py-1.5">
                                    <input
                                      type="text"
                                      value={petColor}
                                      onChange={(e) => setPetColor(e.target.value)}
                                      placeholder="Color"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1.5 font-bold text-slate-600">Sex</td>
                                  <td className="py-1.5 pr-2">
                                    <select
                                      value={petSex}
                                      onChange={(e) => setPetSex(e.target.value)}
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-0.5 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    >
                                      <option value="Male Intact">Male Intact</option>
                                      <option value="Female Intact">Female Intact</option>
                                      <option value="Neutered Male">Neutered Male</option>
                                      <option value="Spayed Female">Spayed Female</option>
                                    </select>
                                  </td>
                                  <td className="py-1.5 font-bold text-slate-600">Weight</td>
                                  <td className="py-1.5">
                                    <input
                                      type="text"
                                      value={petWeight}
                                      onChange={(e) => setPetWeight(e.target.value)}
                                      placeholder="Weight (Kg)"
                                      className="w-full bg-transparent focus:bg-slate-50 focus:outline-none px-1 text-slate-800 border-b border-slate-300 focus:border-primary print:border-none"
                                    />
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>



                    {/* Title */}
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase underline decoration-1 underline-offset-4">{getFormTypeName(formType)}</h2>
                      {formType === "surgery" && <h3 className="text-xs font-bold text-slate-700 uppercase mt-0.5">General Information Regarding Anesthesia</h3>}
                    </div>

                    {/* FORM CONTENTS DYNAMIC BY TYPE */}
                    {formType === "surgery" && (
                      <div className="space-y-4">
                        {/* Surgical / Anesthesia info text blocks */}
                        <div className="text-[10px] text-slate-600 leading-relaxed border border-slate-300 p-3 rounded-lg bg-slate-50/50 space-y-2">
                          <p>
                            <span className="font-bold text-slate-800 underline">Pre Anesthetic Blood Screen</span>: Lab tests let us screen for hidden problems before your pet's anesthetic procedure begins. These tests provide a baseline for monitoring your pet during anesthesia / surgery & can indicate underlying problems that could affect your pet under anesthesia.
                          </p>
                          <p>
                            <span className="font-bold text-slate-800 underline">Risks of anesthesia</span>: We use the safest and different anesthetic protocol for puppy, adult, and seniors. Light weight to heavy weight. However, the risks of general anesthesia are usually greater than that of the surgery itself. During general anesthesia, your dog/cat is in an unconscious state, so he/she is unable to move and doesn't feel any pain. There are always risks when any anesthetic agent is administered to a patient. Some animals will have some sort of reaction to an anesthetic agent. Reactions can be from mild to severe, which may lead to anaphylactic shock, coma, or sometimes even death. Feel free to discuss with our vet before signing this consent.
                          </p>
                        </div>

                        {/* Anesthesia / Need grid table */}
                        <table className="w-full border border-slate-950 border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-950 bg-slate-50">
                              <th className="w-[40%] border-r border-slate-950 p-2 text-left font-bold uppercase tracking-wider text-slate-700">TODAY, THE ANIMAL NEED</th>
                              <th className="w-[60%] p-2 text-left font-bold uppercase tracking-wider text-slate-700">Reason for anesthesia</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border-r border-slate-950 p-3 space-y-2.5">
                                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={needLightSedation}
                                    onChange={(e) => setNeedLightSedation(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                                  />
                                  <span>Light Sedation</span>
                                </label>
                                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={needDeepSedation}
                                    onChange={(e) => setNeedDeepSedation(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                                  />
                                  <span>Deep Sedation</span>
                                </label>
                                <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={needAnesthesia}
                                    onChange={(e) => setNeedAnesthesia(e.target.checked)}
                                    className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4"
                                  />
                                  <span>Anesthesia</span>
                                </label>
                              </td>
                              <td className="p-3">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonSpay} onChange={(e) => setReasonSpay(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Spay</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonNailTrimming} onChange={(e) => setReasonNailTrimming(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Nail Trimming</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonNeuter} onChange={(e) => setReasonNeuter(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Neuter</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonDewClaw} onChange={(e) => setReasonDewClaw(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Dew-Claw Removal</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonMicrochip} onChange={(e) => setReasonMicrochip(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>ISO Microchip</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonVaccinations} onChange={(e) => setReasonVaccinations(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Vaccinations</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                                    <input type="checkbox" checked={reasonScaling} onChange={(e) => setReasonScaling(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Dental Scaling</span>
                                  </label>
                                  <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer col-span-2">
                                    <input type="checkbox" checked={reasonEarCleaning} onChange={(e) => setReasonEarCleaning(e.target.checked)} className="rounded border-slate-300 text-primary w-3.5 h-3.5" />
                                    <span>Ear Cleaning</span>
                                  </label>
                                </div>

                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Request details waiver */}
                        <div className="text-xs space-y-1">
                          <label className="block font-bold text-slate-700">Under anesthesia, I would also like to request for:</label>
                          <textarea
                            rows="2"
                            value={underAnesthesiaRequest}
                            onChange={(e) => setUnderAnesthesiaRequest(e.target.value)}
                            placeholder="Type any additional requests (e.g. ear plucking, extra extractions, dental hygiene, etc.)"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    )}

                    {/* General Treatment Form fields */}
                    {formType === "general" && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Proposed Treatment / Diagnostics Description:</label>
                          <textarea
                            rows="4"
                            value={treatmentDesc}
                            onChange={(e) => setTreatmentDesc(e.target.value)}
                            placeholder="Type proposed medical treatment, tests, or diagnostic procedures..."
                            className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Estimated Cost (NPR):</label>
                          <input
                            type="text"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            placeholder="NPR 5,000"
                            className="w-48 p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    )}

                    {/* Euthanasia fields */}
                    {formType === "euthanasia" && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Reason for Euthanasia Request:</label>
                          <textarea
                            rows="3"
                            value={euthanasiaReason}
                            onChange={(e) => setEuthanasiaReason(e.target.value)}
                            placeholder="E.g., Chronic illness, severe trauma, quality of life deterioration..."
                            className="w-full p-3 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Aftercare Preference:</label>
                          <select
                            value={aftercare}
                            onChange={(e) => setAftercare(e.target.value)}
                            className="w-64 p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 bg-background"
                          >
                            <option value="Communal Cremation">Communal Cremation</option>
                            <option value="Private Cremation (with ashes returned)">Private Cremation (with ashes returned)</option>
                            <option value="Home Burial (Owner takes pet home)">Home Burial (Owner takes pet home)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Boarding Consent */}
                    {formType === "boarding" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Check-in Date:</label>
                          <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Check-out Date:</label>
                          <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                        </div>
                      </div>
                    )}

                  {/* Legal Owner Declaration paragraph */}
                  <div className="text-[11px] text-slate-800 leading-relaxed border-t border-slate-300 pt-5 mt-6 space-y-3 break-inside-avoid page-break-inside-avoid print:break-inside-avoid">
                    <p>
                      I&nbsp;
                      <select
                        value={declarationSalutation}
                        onChange={(e) => setDeclarationSalutation(e.target.value)}
                        className="bg-slate-50 focus:outline-none border-b border-slate-400 font-bold px-0.5 print:border-none"
                      >
                        <option value="Miss.">Miss.</option>
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </select>
                      &nbsp;
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Owner Full Name"
                        className="w-56 bg-transparent font-bold border-b border-slate-300 focus:border-primary focus:outline-none px-1 text-slate-900 inline-block print:border-none"
                      />
                      &nbsp;am the&nbsp;
                      <label className="inline-flex items-center gap-1 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={declarationOwnerType === "owner"}
                          onChange={() => setDeclarationOwnerType("owner")}
                          className="rounded border-slate-300 text-primary w-3.5 h-3.5"
                        />
                        <span>legal owner</span>
                      </label>
                      &nbsp;/&nbsp;
                      <label className="inline-flex items-center gap-1 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={declarationOwnerType === "authorized"}
                          onChange={() => setDeclarationOwnerType("authorized")}
                          className="rounded border-slate-300 text-primary w-3.5 h-3.5"
                        />
                        <span>authorized person for the owner</span>
                      </label>
                      &nbsp;of the animal described above. I understand that in performing the procedure/surgery my pet will receive anesthetic/treatments. All complications and risks involved in anesthesia/surgery have been fully explained to me. I hereby take full responsibility for the complication and risk involved during anesthesia/surgery/treatment.
                    </p>
                    <p>
                      I am willingly giving my consent for anesthesia / surgery / treatment to be performed on the animal and will not hold <strong>Happy Pets Animal Clinic</strong> veterinarian responsible for any untoward happening. Also, I will not claim any compensation for untoward happening.
                    </p>
                    <p>
                      Fees for these services have been explained to me and I am ready to pay it even if any untoward happening happens.
                    </p>

                    {/* Signatures inside same flow */}
                    <div className="mt-8 border-t border-slate-200 pt-4 print:hidden">
                      <span className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Signature Method</span>
                      <div className="flex gap-3 justify-center mb-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSigningMode("digital");
                            setAttachmentUrl("");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            signingMode === "digital"
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          ✍️ Direct Digital Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSigningMode("scanned");
                            setAttachmentUrl("");
                            setTimeout(() => {
                              const el = document.getElementById("scanned-upload-field");
                              if (el) el.click();
                            }, 50);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            signingMode === "scanned"
                              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          📄 Upload Full Scanned Document
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end mt-12 pr-8 print:mt-12">
                      <div className="w-[240px] text-center space-y-1.5 flex flex-col items-center">
                        {signingMode === "digital" && (
                          attachmentUrl && (attachmentUrl.endsWith('.png') || attachmentUrl.endsWith('.jpg') || attachmentUrl.endsWith('.jpeg') || attachmentUrl.startsWith('data:image')) ? (
                            <div className="relative group flex flex-col items-center justify-center w-full">
                              <img src={attachmentUrl} alt="Signature" className="h-14 object-contain mb-1" />
                              <button
                                type="button"
                                onClick={() => setAttachmentUrl("")}
                                className="absolute -top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-[9px] opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="print:hidden w-full mb-1 space-y-2">
                              {isDrawingActive ? (
                                <div className="bg-slate-50 border border-slate-350 rounded-xl p-2 shadow-inner w-full">
                                  <canvas
                                    ref={canvasRef}
                                    width={220}
                                    height={80}
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                    className="border border-dashed border-slate-300 bg-white rounded-lg cursor-crosshair touch-none w-full"
                                  />
                                  <div className="flex justify-between mt-2 text-[10px]">
                                    <button type="button" onClick={clearCanvas} className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 border border-slate-300 rounded bg-white">Clear</button>
                                    <button type="button" onClick={saveCanvasSignature} className="text-primary hover:text-primary/95 font-bold px-2 py-0.5 border border-primary rounded bg-white">Save Signature</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2 w-full">
                                  <button
                                    type="button"
                                    onClick={() => setIsDrawingActive(true)}
                                    className="flex-1 py-1.5 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all flex items-center justify-center gap-1"
                                  >
                                    ✍️ Draw
                                  </button>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAttachmentUpload}
                                    className="hidden"
                                    id="sig-upload-field"
                                  />
                                  <label
                                    htmlFor="sig-upload-field"
                                    className="flex-1 py-1.5 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 text-[11px] font-bold text-slate-600 cursor-pointer transition-all flex items-center justify-center gap-1 text-center"
                                  >
                                    📁 Upload
                                  </label>
                                </div>
                              )}
                            </div>
                          )
                        )}
                        <div className="border-b border-dashed border-slate-400 w-full mb-1"></div>
                        <span className="block text-xs font-bold text-slate-800">Owner/Authorised Person</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden scanned document input & confirmation widget (outside print area) */}
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={handleAttachmentUpload}
                className="hidden"
                id="scanned-upload-field"
                disabled={uploadingAttachment}
              />
              
              {signingMode === "scanned" && (
                <div className="mt-4 w-full max-w-[850px] print:hidden">
                  {attachmentUrl ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-green-800 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">📄</span>
                        <div>
                          <p className="font-bold">Scanned Signed Copy Linked Successfully!</p>
                          <p className="text-[10px] text-green-600 font-normal">This file will be stored as the signed record.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border border-green-300 hover:bg-green-150 px-3 py-1.5 rounded-lg text-[10px] font-bold text-green-700 transition-colors shadow-sm"
                        >
                          Preview File
                        </a>
                        <button
                          type="button"
                          onClick={() => setAttachmentUrl("")}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-250 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-amber-800 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <p className="font-bold">No scanned copy uploaded yet</p>
                          <p className="text-[10px] text-amber-600 font-normal">Please select and upload the physically signed waiver copy.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('scanned-upload-field').click()}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                      >
                        {uploadingAttachment ? "Uploading..." : "Select & Upload File"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sticky Action Footer (Always Visible) */}
            <div className="bg-white border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 print:hidden z-10">
              {/* Step 1: Print/Download */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-xs shadow shrink-0"
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF Form
              </button>



              {/* Step 3: Sign & Save */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-border font-medium rounded-xl hover:bg-muted text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubmit}
                  disabled={!attachmentUrl}
                  className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all shadow ${attachmentUrl
                    ? 'bg-primary text-primary-foreground hover:bg-primary/95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                >
                  Sign & Save Consent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CONSENT FORM DETAILS OVERLAY (READ ONLY PAPER VIEW) */}
      {isViewModalOpen && selectedForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static overflow-y-auto">
          {selectedForm.parsedContent?.signingMode === "scanned" || (selectedForm.attachment_url && !selectedForm.attachment_url.endsWith('.png') && !selectedForm.attachment_url.startsWith('data:image')) ? (
            /* SCANNED MODE: Show ONLY the document (No iframe) */
            <div className="relative w-full max-w-4xl flex flex-col items-center justify-center my-8">
              {/* Floating Close Button */}
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="absolute -top-12 right-0 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 transition-all shadow-lg print:hidden"
              >
                ✕ Close Preview
              </button>
              
              <div className="w-full bg-white rounded-2xl p-2 shadow-2xl flex justify-center items-center overflow-hidden">
                {selectedForm.attachment_url?.endsWith('.pdf') ? (
                  <object
                    data={selectedForm.attachment_url}
                    type="application/pdf"
                    className="w-full h-[85vh] rounded-xl"
                  >
                    <div className="text-center p-8 bg-slate-50 border rounded-xl w-full">
                      <p className="font-bold text-slate-800 text-sm mb-3">Unable to display PDF directly in your browser.</p>
                      <a
                        href={selectedForm.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary/95 shadow"
                      >
                        📥 Download & View PDF Document
                      </a>
                    </div>
                  </object>
                ) : (
                  <img
                    src={selectedForm.attachment_url}
                    alt="Scanned Waiver Document"
                    className="max-w-full object-contain max-h-[85vh] rounded-xl"
                  />
                )}
              </div>
            </div>
          ) : (
            /* DIGITAL SIGNATURE MODE: Show full letterhead waiver document structure */
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col max-h-[95vh] border border-border print:static print:max-h-none print:shadow-none print:border-none print:my-0">
              {/* Header */}
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-blue-950 text-white shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-base">Waiver Record Details</h3>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Document ID: CF-{String(selectedForm.id).padStart(4, '0')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Waiver
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Document Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col items-center print:bg-white print:p-0">
                <div className="bg-white w-full max-w-[850px] p-10 pb-16 text-slate-800 print:p-0 print:w-full print-area">
                  <div>
                  {/* Clinic Letterhead */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <img src="https://happypets.com.np/logo.png" alt="HappyPets" className="w-16 h-16 object-contain" />
                        <div>
                          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Happy Pets Animal Clinic</h1>
                          <p className="text-xs text-slate-500 font-semibold">Imadol, Lalitpur, NEPAL</p>
                          <p className="text-xs text-slate-500">9860872125, 9860872125 | happypetsnepal@gmail.com</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold self-start mt-2 text-right">
                        Printed Date: <span className="text-slate-800 font-bold">{selectedForm.parsedContent?.printedDate || new Date(selectedForm.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Owner & Pet Details Grid */}
                    <table className="w-full border border-slate-900 border-collapse mb-4 text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-50">
                          <th className="w-1/2 border-r border-slate-900 p-2 text-center font-bold uppercase tracking-wider text-slate-700">Owner's Details</th>
                          <th className="w-1/2 p-2 text-center font-bold uppercase tracking-wider text-slate-700">Pet's Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {/* Owner Columns */}
                          <td className="border-r border-slate-900 p-3 vertical-align-top">
                            <table className="w-full border-collapse text-[13px]">
                              <tbody>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="w-20 py-2 font-bold text-slate-500">Name</td>
                                  <td className="py-2 text-slate-900 font-bold">{selectedForm.parsedContent?.ownerName || selectedForm.client_name}</td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-2 font-bold text-slate-500">Address</td>
                                  <td className="py-2 text-slate-800">{selectedForm.parsedContent?.ownerAddress || "Imadol"}</td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-2 font-bold text-slate-500">Contact</td>
                                  <td className="py-2 text-slate-800">{selectedForm.parsedContent?.ownerContact || selectedForm.client_phone || ""}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-bold text-slate-500">Email</td>
                                  <td className="py-2 text-slate-800">{selectedForm.parsedContent?.ownerEmail || selectedForm.client_email}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>

                          {/* Pet Columns */}
                          <td className="p-3 vertical-align-top">
                            <table className="w-full border-collapse text-[13px]">
                              <tbody>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="w-20 py-1.5 font-bold text-slate-500">Name</td>
                                  <td className="py-1.5 pr-2 text-slate-900 font-bold">{selectedForm.parsedContent?.petName || selectedForm.pet_name}</td>
                                  <td className="w-16 py-1.5 font-bold text-slate-500">Breed</td>
                                  <td className="py-1.5 text-slate-855">{selectedForm.parsedContent?.petBreed || "Nepali Breed"}</td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-1.5 font-bold text-slate-500">DOB/Age</td>
                                  <td className="py-1.5 text-slate-800" colSpan="3">{selectedForm.parsedContent?.petAge || ""}</td>
                                </tr>
                                <tr className="border-b border-dashed border-slate-200">
                                  <td className="py-1.5 font-bold text-slate-500">Species</td>
                                  <td className="py-1.5 pr-2 text-slate-800">{selectedForm.parsedContent?.petSpecies || "Canine (Dog)"}</td>
                                  <td className="py-1.5 font-bold text-slate-500">Color</td>
                                  <td className="py-1.5 text-slate-800">{selectedForm.parsedContent?.petColor || ""}</td>
                                </tr>
                                <tr>
                                  <td className="py-1.5 font-bold text-slate-500">Sex</td>
                                  <td className="py-1.5 pr-2 text-slate-800">{selectedForm.parsedContent?.petSex || "Male Intact"}</td>
                                  <td className="py-1.5 font-bold text-slate-500">Weight</td>
                                  <td className="py-1.5 text-slate-800">{selectedForm.parsedContent?.petWeight ? `${selectedForm.parsedContent.petWeight} Kg` : ""}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>



                    {/* Title */}
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase underline decoration-1 underline-offset-4">{getFormTypeName(selectedForm.form_type)}</h2>
                      {selectedForm.form_type === "surgery" && <h3 className="text-xs font-bold text-slate-700 uppercase mt-0.5">General Information Regarding Anesthesia</h3>}
                    </div>

                    {/* FORM CONTENTS DYNAMIC BY TYPE */}
                    {selectedForm.form_type === "surgery" && (
                      <div className="space-y-4">
                        {/* Surgical / Anesthesia info text blocks */}
                        <div className="text-[10px] text-slate-600 leading-relaxed border border-slate-300 p-3 rounded-lg bg-slate-50/50 space-y-2">
                          <p>
                            <span className="font-bold text-slate-800 underline">Pre Anesthetic Blood Screen</span>: Lab tests let us screen for hidden problems before your pet's anesthetic procedure begins. These tests provide a baseline for monitoring your pet during anesthesia / surgery & can indicate underlying problems that could affect your pet under anesthesia.
                          </p>
                          <p>
                            <span className="font-bold text-slate-800 underline">Risks of anesthesia</span>: We use the safest and different anesthetic protocol for puppy, adult, and seniors. Light weight to heavy weight. However, the risks of general anesthesia are usually greater than that of the surgery itself. During general anesthesia, your dog/cat is in an unconscious state, so he/she is unable to move and doesn't feel any pain. There are always risks when any anesthetic agent is administered to a patient. Some animals will have some sort of reaction to an anesthetic agent. Reactions can be from mild to severe, which may lead to anaphylactic shock, coma, or sometimes even death. Feel free to discuss with our vet before signing this consent.
                          </p>
                        </div>

                        {/* Anesthesia / Need grid table */}
                        <table className="w-full border border-slate-950 border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-950 bg-slate-50">
                              <th className="w-[40%] border-r border-slate-950 p-2 text-left font-bold uppercase tracking-wider text-slate-700">TODAY, THE ANIMAL NEED</th>
                              <th className="w-[60%] p-2 text-left font-bold uppercase tracking-wider text-slate-700">Reason for anesthesia</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border-r border-slate-950 p-3 space-y-2.5">
                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                  <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-400 font-bold text-xs bg-slate-100">
                                    {selectedForm.parsedContent?.needLightSedation ? "✓" : ""}
                                  </span>
                                  <span>Light Sedation</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                  <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-400 font-bold text-xs bg-slate-100">
                                    {selectedForm.parsedContent?.needDeepSedation ? "✓" : ""}
                                  </span>
                                  <span>Deep Sedation</span>
                                </div>
                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                  <span className="inline-flex items-center justify-center w-4 h-4 border border-slate-400 font-bold text-xs bg-slate-100">
                                    {selectedForm.parsedContent?.needAnesthesia ? "✓" : ""}
                                  </span>
                                  <span>Anesthesia</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonSpay ? "✓" : ""}
                                    </span>
                                    <span>Spay</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonNailTrimming ? "✓" : ""}
                                    </span>
                                    <span>Nail Trimming</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonNeuter ? "✓" : ""}
                                    </span>
                                    <span>Neuter</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonDewClaw ? "✓" : ""}
                                    </span>
                                    <span>Dew-Claw Removal</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonMicrochip ? "✓" : ""}
                                    </span>
                                    <span>ISO Microchip</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonVaccinations ? "✓" : ""}
                                    </span>
                                    <span>Vaccinations</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonScaling ? "✓" : ""}
                                    </span>
                                    <span>Dental Scaling</span>
                                  </div>
                                  <div className="flex items-center gap-2 font-semibold text-slate-700 col-span-2">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-slate-400 font-bold text-[10px] bg-slate-100">
                                      {selectedForm.parsedContent?.reasonEarCleaning ? "✓" : ""}
                                    </span>
                                    <span>Ear Cleaning</span>
                                  </div>
                                </div>

                              </td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Request details waiver */}
                        {selectedForm.parsedContent?.underAnesthesiaRequest && (
                          <div className="text-xs space-y-1">
                            <span className="block font-bold text-slate-700">Under anesthesia request detail:</span>
                            <div className="p-3 border border-slate-250 rounded-lg bg-slate-50 leading-relaxed text-slate-800">
                              {selectedForm.parsedContent.underAnesthesiaRequest}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* General Treatment Form fields */}
                    {selectedForm.form_type === "general" && selectedForm.parsedContent?.treatmentDesc && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Proposed Treatment / Diagnostics Description:</span>
                          <div className="p-3 border border-slate-250 rounded-lg bg-slate-50 leading-relaxed text-slate-800">
                            {selectedForm.parsedContent.treatmentDesc}
                          </div>
                        </div>
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Estimated Cost:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">{selectedForm.parsedContent.estimatedCost}</span>
                        </div>
                      </div>
                    )}

                    {/* Euthanasia fields */}
                    {selectedForm.form_type === "euthanasia" && selectedForm.parsedContent?.euthanasiaReason && (
                      <div className="space-y-4 text-xs">
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Reason for Euthanasia Request:</span>
                          <div className="p-3 border border-slate-250 rounded-lg bg-slate-50 leading-relaxed text-slate-800">
                            {selectedForm.parsedContent.euthanasiaReason}
                          </div>
                        </div>
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Aftercare Preference:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">{selectedForm.parsedContent.aftercare}</span>
                        </div>
                      </div>
                    )}

                    {/* Boarding Consent */}
                    {selectedForm.form_type === "boarding" && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Check-in Date:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">{selectedForm.parsedContent?.checkIn}</span>
                        </div>
                        <div>
                          <span className="block font-bold text-slate-700 mb-1">Check-out Date:</span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">{selectedForm.parsedContent?.checkOut}</span>
                        </div>
                      </div>
                    )}

                  {/* Legal Owner Declaration paragraph */}
                  <div className="text-[11px] text-slate-800 leading-relaxed border-t border-slate-300 pt-5 mt-6 space-y-3 break-inside-avoid page-break-inside-avoid print:break-inside-avoid">
                    <p>
                      I&nbsp;
                      <span className="font-bold border-b border-slate-400 px-1">{selectedForm.parsedContent?.declarationSalutation || "Miss."}</span>
                      &nbsp;
                      <span className="font-bold border-b border-slate-400 px-1 text-slate-900">{selectedForm.parsedContent?.ownerName || selectedForm.client_name}</span>
                      &nbsp;am the&nbsp;
                      <span className="font-bold underline">
                        {selectedForm.parsedContent?.declarationOwnerType === "owner" ? "legal owner" : "authorized person for the owner"}
                      </span>
                      &nbsp;of the animal described above. I understand that in performing the procedure/surgery my pet will receive anesthetic/treatments. All complications and risks involved in anesthesia/surgery have been fully explained to me. I hereby take full responsibility for the complication and risk involved during anesthesia/surgery/treatment.
                    </p>
                    <p>
                      I am willingly giving my consent for anesthesia / surgery / treatment to be performed on the animal and will not hold <strong>Happy Pets Animal Clinic</strong> veterinarian responsible for any untoward happening. Also, I will not claim any compensation for untoward happening.
                    </p>
                    <p>
                      Fees for these services have been explained to me and I am ready to pay it even if any untoward happening happens.
                    </p>

                    {/* Signatures inside same flow */}
                    <div className="flex justify-end mt-16 pr-8 print:mt-12">
                      <div className="w-[240px] text-center space-y-1.5 flex flex-col items-center">
                        {selectedForm.attachment_url && (selectedForm.attachment_url.endsWith('.png') || selectedForm.attachment_url.endsWith('.jpg') || selectedForm.attachment_url.endsWith('.jpeg') || selectedForm.attachment_url.startsWith('data:image')) && (
                          <img src={selectedForm.attachment_url} alt="Signature" className="h-14 object-contain mb-1" />
                        )}
                        <div className="border-b border-dashed border-slate-400 w-full mb-1"></div>
                        <span className="block text-xs font-bold text-slate-800">Owner/Authorised Person</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky Action Footer (Always Visible) */}
              <div className="bg-white border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 print:hidden z-10">
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                    ✍️ Digitally Signed Form View Mode
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow"
                  >
                    Close Waiver
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
