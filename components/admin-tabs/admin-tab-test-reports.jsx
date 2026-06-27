"use client"

import React, { useState, useEffect, useRef } from "react"
import { fetchWithAuth } from "@/lib/api"
import { QRCodeSVG } from "qrcode.react"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Printer, 
  X, 
  FlaskConical, 
  ChevronRight, 
  AlertCircle,
  FileText
} from "lucide-react"

const labTestCategories = [
  {
    category: "HAEMATOLOGY",
    tests: [
      { key: "hemoglobin", name: "Hemoglobin", ref: "(13-20)" },
      { key: "pcv", name: "PCV (%)", ref: "(35-60)" },
      { key: "rbc", name: "RBC Count (M/ÂµL)", ref: "(5-7)" },
      { key: "mcv", name: "MCV (fL)", ref: "(60-73)" },
      { key: "mch", name: "MCH (pg)", ref: "(21-25)" },
      { key: "mchc", name: "MCHC (g/dl)", ref: "(32-38)" },
      { key: "wbc", name: "WBC Count", ref: "05-17" },
      { key: "platelets", name: "Platelet Count (K/ÂµL)", ref: "(148-484)" }
    ]
  },
  {
    category: "Differential Leucocyte Count (DLC)",
    tests: [
      { key: "neutrophils", name: "Neutrophils (%)", ref: "(60-77)" },
      { key: "lymphocytes", name: "Lymphocytes (%)", ref: "(12-30)" },
      { key: "monocytes", name: "Monocytes (%)", ref: "(3-10)" },
      { key: "eosinophils", name: "Eosinophils (%)", ref: "(02-10)" },
      { key: "basophils", name: "Basophils (%)", ref: "(0-1)" }
    ]
  },
  {
    category: "Absolute Leucocyte Count",
    tests: [
      { key: "esr", name: "ESR (mm/hr)", ref: "(5-10)" },
      { key: "blood_parasites", name: "Blood Parasites", ref: "" },
      { key: "rdw", name: "RDW (%)", ref: "(32-22)" },
      { key: "retic", name: "RETIC (K/ÂµL)", ref: "(10-110)" }
    ]
  },
  {
    category: "BIOCHEMISTRY - Liver Function Test (LFT)",
    tests: [
      { key: "alt_sgpt", name: "ALT-SGPT (U/L)", ref: "(17-50)" },
      { key: "ast_sgot", name: "AST-SGOT", ref: "(10-125)" },
      { key: "alp", name: "ALP (U/L)", ref: "(23-212)" },
      { key: "total_protein", name: "Total Protein (gm/dl)", ref: "(5.2-8.2)" },
      { key: "albumin", name: "Albumin (gm/dl)", ref: "(2.3-4)" },
      { key: "globulin", name: "Globulin (gm/dl)", ref: "(2.5-4.5)" },
      { key: "ag_ratio", name: "A/G Ratio", ref: "(0.7-1.5)" },
      { key: "total_bilirubin", name: "Total Bilirubin (mg/dl)", ref: "(0.0-0.9)" },
      { key: "direct_bilirubin", name: "Direct Bilirubin", ref: "(0-0.3)" }
    ]
  },
  {
    category: "BIOCHEMISTRY - Kidney Function Test (KFT)",
    tests: [
      { key: "bun", name: "BUN (mg/dl)", ref: "(7-30)" },
      { key: "creatinine", name: "Creatinine (mg/dl)", ref: "(0.5-1.8)" },
      { key: "sodium", name: "Sodium (mmol/L)", ref: "(142-152)" },
      { key: "potassium", name: "Potassium (mmol/L)", ref: "(3.9-5.1)" },
      { key: "nak_ratio", name: "NA/K Ratio", ref: "(28-37)" }
    ]
  },
  {
    category: "BIOCHEMISTRY - Others",
    tests: [
      { key: "glucose", name: "Glucose (mg/dl)", ref: "(70-130)" },
      { key: "amylase", name: "Amylase (U/L)", ref: "(500-1500)" },
      { key: "chloride", name: "Chloride (mmol/L)", ref: "(110-124)" },
      { key: "calcium", name: "Calcium (mg/dl)", ref: "(5.1-10.0)" },
      { key: "lipase", name: "Lipase (U/L)", ref: "(200-1800)" },
      { key: "nh3", name: "NH3 (Âµmol/L)", ref: "(0-98)" },
      { key: "ck", name: "CK (U/L)", ref: "(100-200)" },
      { key: "lac", name: "LAC (mmol/L)", ref: "(0.5-2.5)" },
      { key: "ldh", name: "LDH (U/L)", ref: "(40-400)" },
      { key: "mg", name: "Mg (mg/dl)", ref: "(1.4-2.4)" },
      { key: "phos", name: "PHOS (mg/dl)", ref: "(2.5-6.8)" },
      { key: "uric_acid", name: "Uric Acid", ref: ">1" }
    ]
  },
  {
    category: "URINE ANALYSIS - Dipstick Analysis",
    tests: [
      { key: "urine_color", name: "Urine Color", ref: "(Straw, Yellow or Light amber)" },
      { key: "transparency", name: "Transparency", ref: "(Clear)" },
      { key: "urine_albumin", name: "Urine Albumin", ref: "(Negative/Trace)" },
      { key: "urine_ph", name: "Urine PH", ref: "(6-7)" },
      { key: "urine_protein", name: "Protein", ref: "Trace" },
      { key: "urine_glucose", name: "Glucose", ref: "Negative" },
      { key: "ketones", name: "Ketones", ref: "Negative" },
      { key: "blood_hemo", name: "Blood/Hemoglobin", ref: "Negative" },
      { key: "nitrite", name: "Nitrite", ref: "70-130" },
      { key: "urobilinogen", name: "Urobilinogen", ref: "(Normal)" },
      { key: "leukocytes", name: "Leukocytes", ref: "Negative" },
      { key: "specific_gravity", name: "Specific Gravity (SG)", ref: "(1.015-1.035)" }
    ]
  },
  {
    category: "URINE ANALYSIS - Microscopic Examination",
    tests: [
      { key: "pus_cells", name: "Pus cells", ref: "(0-5/HPF)" },
      { key: "urine_rbc", name: "RBC", ref: "(0-5/HPF)" },
      { key: "epithelial", name: "Epithelial Cells", ref: "0-Few/HPF" },
      { key: "crystals", name: "Crystals", ref: "Variable" },
      { key: "casts", name: "Casts", ref: "0-Few/HPF" },
      { key: "bacteria", name: "Bacteria", ref: "0-Few/HPF" }
    ]
  }
]

function getAgeString(dobString) {
  if (!dobString) return ""
  try {
    const dob = new Date(dobString)
    const today = new Date()
    let years = today.getFullYear() - dob.getFullYear()
    let months = today.getMonth() - dob.getMonth()
    let days = today.getDate() - dob.getDate()
    
    if (days < 0) {
      months--
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      days += lastMonth.getDate()
    }
    
    if (months < 0) {
      years--
      months += 12
    }
    
    return `${years} Years ${months} Months ${days} Days`
  } catch (e) {
    return ""
  }
}

function isOutsideRange(val, refStr) {
  if (!val || !refStr) return false
  const cleaned = refStr.replace(/[()]/g, "").trim()
  const parts = cleaned.split("-")
  if (parts.length === 2) {
    const min = parseFloat(parts[0])
    const max = parseFloat(parts[1])
    const numericVal = parseFloat(val)
    if (!isNaN(min) && !isNaN(max) && !isNaN(numericVal)) {
      return numericVal < min || numericVal > max
    }
  }
  
  // Custom exact matching check for Negative/Trace
  const lowerVal = val.toLowerCase().trim()
  const lowerRef = refStr.toLowerCase().trim()
  if (lowerRef.includes("negative") && (lowerVal.includes("positive") || lowerVal.includes("seen") || lowerVal === "80")) {
    return true
  }
  return false
}

export default function AdminTabTestReports() {
  const [reports, setReports] = useState([])
  const [patients, setPatients] = useState([])
  const [clients, setClients] = useState([])
  const [vets, setVets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentReport, setCurrentReport] = useState(null)
  
  // Searchable pet state inside modal
  const [petSearchText, setPetSearchText] = useState("")
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false)
  const petSearchRef = useRef(null)

  const [formData, setFormData] = useState({
    pet_id: "",
    vet_id: "",
    report_date: "",
  })

  const [headerData, setHeaderData] = useState({
    owner_name: "",
    owner_address: "",
    owner_contact: "",
    owner_email: "",
    pet_name: "",
    pet_age: "",
    pet_species: "",
    pet_sex: "",
    pet_breed: "",
    pet_color: "",
    pet_microchip: "0",
    pet_weight: "",
    printed_date: "",
  })

  const [results, setResults] = useState({})

  // View / Print states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeReport, setActiveReport] = useState(null)
  const [qrModalReport, setQrModalReport] = useState(null)

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
      const [reportsRes, patientsRes, clientsRes, usersRes] = await Promise.all([
        fetchWithAuth("/api/admin/test-reports"),
        fetchWithAuth("/api/admin/patients"),
        fetchWithAuth("/api/admin/clients"),
        fetchWithAuth("/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } })
      ])

      if (reportsRes.ok) setReports(await reportsRes.json())
      if (patientsRes.ok) setPatients(await patientsRes.json())
      if (clientsRes.ok) setClients(await clientsRes.json())
      if (usersRes.ok) {
        const uData = await usersRes.json()
        const staff = uData.filter(u => ["admin", "veterinarian", "vet_assistant"].includes(u.role))
        setVets(staff)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePetSelect = (pet) => {
    const owner = clients.find(c => Number(c.id) === Number(pet.user_id))
    
    setPetSearchText(`${pet.name} (${owner?.full_name || "Unknown"})`)
    setFormData(prev => ({ ...prev, pet_id: pet.id }))
    setIsPetDropdownOpen(false)

    setHeaderData({
      owner_name: owner?.full_name || "",
      owner_address: owner?.address || "",
      owner_contact: owner?.phone_number || "",
      owner_email: owner?.email || "",
      pet_name: pet.name || "",
      pet_age: getAgeString(pet.dob),
      pet_species: pet.species || "",
      pet_sex: pet.sex || "",
      pet_breed: pet.breed || "",
      pet_color: pet.color || "",
      pet_microchip: pet.identifying_marks || "0",
      pet_weight: pet.weight ? `${pet.weight} Kg` : "",
      printed_date: new Date().toLocaleString("en-US", { hour12: false }).replace(",", ""),
    })
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setFormData({
      pet_id: "",
      vet_id: "",
      report_date: new Date().toISOString().slice(0, 16),
    })
    setHeaderData({
      owner_name: "",
      owner_address: "",
      owner_contact: "",
      owner_email: "",
      pet_name: "",
      pet_age: "",
      pet_species: "",
      pet_sex: "",
      pet_breed: "",
      pet_color: "",
      pet_microchip: "0",
      pet_weight: "",
      printed_date: new Date().toLocaleString("en-US", { hour12: false }).replace(",", ""),
    })
    
    // Initialize results with empty strings
    const initialResults = {}
    labTestCategories.forEach(cat => {
      cat.tests.forEach(test => {
        initialResults[test.key] = ""
      })
    })
    setResults(initialResults)
    setPetSearchText("")
    setIsPetDropdownOpen(false)
    setIsModalOpen(true)
  }

  const openEditModal = (report) => {
    setIsEditMode(true)
    setCurrentReport(report)
    setFormData({
      pet_id: report.pet_id,
      vet_id: report.vet_id,
      report_date: report.report_date ? new Date(report.report_date).toISOString().slice(0, 16) : "",
    })

    let parsedResults = {}
    try {
      parsedResults = typeof report.results === "string" ? JSON.parse(report.results) : report.results
    } catch (e) {
      parsedResults = {}
    }

    const metadata = parsedResults?.metadata || {}
    setHeaderData({
      owner_name: metadata.owner_name || report.client_name || "",
      owner_address: metadata.owner_address || report.client_address || "",
      owner_contact: metadata.owner_contact || report.client_phone || "",
      owner_email: metadata.owner_email || report.client_email || "",
      pet_name: metadata.pet_name || report.pet_name || "",
      pet_age: metadata.pet_age || getAgeString(report.pet_dob) || "",
      pet_species: metadata.pet_species || report.pet_species || "",
      pet_sex: metadata.pet_sex || report.pet_sex || "",
      pet_breed: metadata.pet_breed || report.pet_breed || "",
      pet_color: metadata.pet_color || report.pet_color || "",
      pet_microchip: metadata.pet_microchip || report.pet_identifying_marks || "0",
      pet_weight: metadata.pet_weight || (report.pet_weight ? `${report.pet_weight} Kg` : "") || "",
      printed_date: metadata.printed_date || new Date().toLocaleString("en-US", { hour12: false }).replace(",", ""),
    })

    // Separate clean values
    const flatResults = { ...parsedResults }
    delete flatResults.metadata

    // Pre-fill fields
    const newResults = {}
    labTestCategories.forEach(cat => {
      cat.tests.forEach(test => {
        newResults[test.key] = flatResults[test.key] !== undefined ? flatResults[test.key] : ""
      })
    })

    setResults(newResults)
    setPetSearchText(`${report.pet_name} (${report.client_name || "Unknown"})`)
    setIsPetDropdownOpen(false)
    setIsModalOpen(true)
  }

  const handleResultChange = (key, value) => {
    setResults(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.pet_id) {
      alert("Please select a valid Pet.")
      return
    }
    if (!formData.vet_id) {
      alert("Please select an Attending Veterinarian.")
      return
    }

    // Embed metadata inside results to preserve historical owner/pet info
    const finalResults = {
      ...results,
      metadata: {
        owner_name: headerData.owner_name,
        owner_address: headerData.owner_address,
        owner_contact: headerData.owner_contact,
        owner_email: headerData.owner_email,
        pet_name: headerData.pet_name,
        pet_age: headerData.pet_age,
        pet_species: headerData.pet_species,
        pet_sex: headerData.pet_sex,
        pet_breed: headerData.pet_breed,
        pet_color: headerData.pet_color,
        pet_microchip: headerData.pet_microchip,
        pet_weight: headerData.pet_weight,
        printed_date: headerData.printed_date,
      }
    }

    const payload = {
      pet_id: formData.pet_id,
      vet_id: formData.vet_id,
      report_date: formData.report_date,
      results: finalResults
    }

    try {
      const url = isEditMode ? `/api/admin/test-reports/${currentReport.id}` : "/api/admin/test-reports"
      const method = isEditMode ? "PUT" : "POST"

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        fetchData()
        setIsModalOpen(false)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save test report")
      }
    } catch (e) {
      console.error(e)
      alert("Failed to save test report")
    }
  }

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this test report? This action is permanent.")) {
      try {
        const res = await fetchWithAuth(`/api/admin/test-reports/${id}`, {
          method: "DELETE"
        })
        if (res.ok) {
          fetchData()
        } else {
          const err = await res.json()
          alert(err.error || "Failed to delete test report")
        }
      } catch (e) {
        console.error(e)
        alert("Failed to delete test report")
      }
    }
  }

  const openViewModal = (report) => {
    let parsedResults = {}
    try {
      parsedResults = typeof report.results === "string" ? JSON.parse(report.results) : report.results
    } catch (e) {
      parsedResults = {}
    }
    setActiveReport({
      ...report,
      parsedResults
    })
    setIsViewModalOpen(true)
  }

  const filteredReports = reports.filter(r => {
    const q = searchQuery.toLowerCase()
    return (
      r.pet_name?.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.vet_name?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Loading Pathology Test Reports...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lab Pathology Test Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage and generate laboratory pathology tests for clinic patients.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Generate New Test Report
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-lg border border-border shadow-sm no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by pet name, owner, or veterinarian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 w-full text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
          />
        </div>
      </div>

      {/* Test Reports List */}
      <div className="bg-background border border-border rounded-lg overflow-hidden shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient &amp; Owner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Report Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attending Veterinarian</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Code</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{report.pet_name}</div>
                    <div className="text-xs text-muted-foreground">Owner: {report.client_name || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {new Date(report.report_date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    Dr. {report.vet_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setQrModalReport(report)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Generate QR
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openViewModal(report)}
                      className="text-primary hover:text-primary/80 mr-4 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> View & Print
                    </button>
                    <button
                      onClick={() => openEditModal(report)}
                      className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="text-red-500 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground italic">
                    No pathology test reports found. Click "Generate New Test Report" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl overflow-hidden my-8 border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {isEditMode ? "Modify Lab Test Report" : "Generate Lab Test Report"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Header Section (Auto-fill & Overrides) */}
                <div className="lg:col-span-4 space-y-6 border-r border-border pr-0 lg:pr-8">
                  <h4 className="text-md font-bold text-primary border-b border-border pb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> 1. Client & Patient Details
                  </h4>
                  
                  {/* Combobox for Pet Selection */}
                  <div className="relative" ref={petSearchRef}>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Search Patient (Pet) *</label>
                    <input
                      type="text"
                      value={petSearchText}
                      onFocus={() => setIsPetDropdownOpen(true)}
                      onChange={(e) => {
                        setPetSearchText(e.target.value)
                        setIsPetDropdownOpen(true)
                        const matched = patients.find(p => p.name?.toLowerCase() === e.target.value.toLowerCase())
                        if (matched) {
                          handlePetSelect(matched)
                        } else {
                          setFormData(prev => ({ ...prev, pet_id: "" }))
                        }
                      }}
                      placeholder="Type patient name..."
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                    />
                    {isPetDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {patients.filter(p => p.name?.toLowerCase().includes(petSearchText.toLowerCase())).length > 0 ? (
                          patients
                            .filter(p => p.name?.toLowerCase().includes(petSearchText.toLowerCase()))
                            .map(p => {
                              const owner = clients.find(c => Number(c.id) === Number(p.user_id))
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => handlePetSelect(p)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted/80 focus:bg-muted/80 focus:outline-none text-foreground font-normal border-b border-muted/30 last:border-none"
                                >
                                  <span className="font-semibold">{p.name}</span> ({owner?.full_name || "No Owner"})
                                </button>
                              )
                            })
                        ) : (
                          <div className="px-3 py-2 text-xs text-muted-foreground">No matches found for "{petSearchText}"</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Attending Vet *</label>
                      <select
                        value={formData.vet_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, vet_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
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
                      <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Report Date</label>
                      <input
                        type="datetime-local"
                        value={formData.report_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, report_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                        required
                      />
                    </div>
                  </div>

                  {/* Editable snapshot data */}
                  <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                    <h5 className="font-bold text-xs text-slate-600 uppercase border-b border-border/50 pb-1">Owner Information (Editable)</h5>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Owner Name</label>
                      <input
                        type="text"
                        value={headerData.owner_name}
                        onChange={(e) => setHeaderData(prev => ({ ...prev, owner_name: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Owner Address</label>
                      <input
                        type="text"
                        value={headerData.owner_address}
                        onChange={(e) => setHeaderData(prev => ({ ...prev, owner_address: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Owner Contact</label>
                        <input
                          type="text"
                          value={headerData.owner_contact}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, owner_contact: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Owner Email</label>
                        <input
                          type="email"
                          value={headerData.owner_email}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, owner_email: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                    <h5 className="font-bold text-xs text-slate-600 uppercase border-b border-border/50 pb-1">Pet Information (Editable)</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Pet Name</label>
                        <input
                          type="text"
                          value={headerData.pet_name}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_name: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">DOB / Age</label>
                        <input
                          type="text"
                          value={headerData.pet_age}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_age: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Species</label>
                        <input
                          type="text"
                          value={headerData.pet_species}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_species: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Sex</label>
                        <input
                          type="text"
                          value={headerData.pet_sex}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_sex: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Breed</label>
                        <input
                          type="text"
                          value={headerData.pet_breed}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_breed: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Color</label>
                        <input
                          type="text"
                          value={headerData.pet_color}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_color: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Microchip</label>
                        <input
                          type="text"
                          value={headerData.pet_microchip}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_microchip: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Weight</label>
                        <input
                          type="text"
                          value={headerData.pet_weight}
                          onChange={(e) => setHeaderData(prev => ({ ...prev, pet_weight: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Printed Date Override</label>
                    <input
                      type="text"
                      value={headerData.printed_date}
                      onChange={(e) => setHeaderData(prev => ({ ...prev, printed_date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                    />
                  </div>
                </div>

                {/* Results Form Table */}
                <div className="lg:col-span-8 space-y-6">
                  <h4 className="text-md font-bold text-primary border-b border-border pb-2 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5" /> 2. Test Results & Reference Ranges
                  </h4>

                  <div className="bg-slate-50 rounded-lg border border-border overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 border-b border-border sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-1/2">Test Name</th>
                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Results</th>
                            <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider w-1/4">Reference Range</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labTestCategories.map((cat, catIdx) => (
                            <React.Fragment key={cat.category}>
                              <tr className="bg-slate-200/80 border-y border-border/80">
                                <td colSpan="3" className="px-4 py-2 font-black text-xs text-slate-700 tracking-wide uppercase">
                                  {cat.category}
                                </td>
                              </tr>
                              {cat.tests.map(test => (
                                <tr key={test.key} className="hover:bg-slate-50 transition-colors border-b border-border last:border-none">
                                  <td className="px-4 py-2 text-sm font-semibold text-slate-700">
                                    {test.name}
                                  </td>
                                  <td className="px-4 py-1.5">
                                    <input
                                      type="text"
                                      value={results[test.key] || ""}
                                      onChange={(e) => handleResultChange(test.key, e.target.value)}
                                      placeholder="-"
                                      className={`w-full border border-border rounded px-2.5 py-1 text-sm bg-background text-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary ${
                                        isOutsideRange(results[test.key], test.ref) 
                                          ? "font-bold text-red-600 border-red-300 bg-red-50/20" 
                                          : ""
                                      }`}
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-sm text-slate-500 font-mono">
                                    {test.ref || "Variable"}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-border bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-border text-sm font-medium rounded-md hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-md hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
                >
                  {isEditMode ? "Save Lab Report Changes" : "Generate Lab Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View and Print Modal â€” full-page scrollable */}
      {isViewModalOpen && activeReport && (
        <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
          
          {/* Sticky top bar with Print + Close */}
          <div className="shrink-0 flex justify-between items-center px-6 py-3 bg-white border-b border-border shadow-sm no-print">
            <span className="font-bold text-slate-800 text-lg">Lab Test Report Preview</span>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Report
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="border border-border hover:bg-slate-100 px-5 py-2 rounded-lg text-slate-700 font-semibold text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable report content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div id="printable-report" className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-border p-8 md:p-12 text-slate-950 font-serif leading-normal">
              
              {/* Print media style */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  /* Hide everything on the page */
                  body * { visibility: hidden !important; }

                  /* Show the report and all its children */
                  #printable-report, #printable-report * { visibility: visible !important; }

                  /* Break the report out of its fixed/scrollable parents */
                  #printable-report {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    padding: 16px !important;
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                    overflow: visible !important;
                    z-index: 99999 !important;
                  }

                  /* Force ALL parent containers to not clip */
                  #printable-report,
                  #printable-report ~ *,
                  .fixed, [class*="fixed"],
                  [class*="overflow-y-auto"],
                  [class*="overflow-y-scroll"],
                  [class*="flex-1"] {
                    overflow: visible !important;
                    height: auto !important;
                    max-height: none !important;
                    position: static !important;
                  }

                  /* Re-force #printable-report after the above static rule */
                  #printable-report {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                  }

                  .no-print { display: none !important; visibility: hidden !important; }

                  .category-section {
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                  #printable-report table tr {
                    page-break-inside: avoid;
                    break-inside: avoid;
                  }
                  #printable-report .report-header {
                    page-break-after: avoid;
                    break-after: avoid;
                  }
                }
                @page {
                  size: A4;
                  margin: 1.2cm 1cm;
                }
              `}} />

              {/* Clinic Banner */}
              <div className="flex items-center justify-center border-b border-slate-300 pb-6 mb-6">
                <div className="text-center">
                  <img src="/happy_pets_logo.jpg" alt="Happy Pets Animal Clinic Logo" className="w-28 h-28 mx-auto mb-3 object-contain" />
                  <h1 className="text-3xl font-black tracking-wider uppercase text-slate-900 font-sans">HAPPY PETS ANIMAL CLINIC</h1>
                  <p className="text-sm font-semibold text-slate-600 font-sans mt-0.5">Imadol, Lalitpur, NEPAL</p>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">9860872125, 9860872125 | happypetsnepal@gmail.com</p>
                </div>
              </div>

              {/* Owner and Pet Info Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-300 text-xs font-sans rounded-none divide-y md:divide-y-0 md:divide-x divide-slate-300 mb-6 bg-slate-50/30">
                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-sm border-b border-slate-200 pb-1 text-slate-800 uppercase tracking-wider">{"Owner's Details"}</h3>
                  <div className="grid grid-cols-12 gap-1.5">
                    <span className="col-span-4 font-bold text-slate-500">Name</span>
                    <span className="col-span-8 font-extrabold text-slate-800">{activeReport.parsedResults?.metadata?.owner_name || activeReport.client_name || "N/A"}</span>
                    <span className="col-span-4 font-bold text-slate-500">Address</span>
                    <span className="col-span-8 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.owner_address || activeReport.client_address || "N/A"}</span>
                    <span className="col-span-4 font-bold text-slate-500">Contact</span>
                    <span className="col-span-8 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.owner_contact || activeReport.client_phone || "N/A"}</span>
                    <span className="col-span-4 font-bold text-slate-500">Email</span>
                    <span className="col-span-8 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.owner_email || activeReport.client_email || "N/A"}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-extrabold text-sm border-b border-slate-200 pb-1 text-slate-800 uppercase tracking-wider">{"Pet's Details"}</h3>
                  <div className="grid grid-cols-12 gap-x-2 gap-y-1.5">
                    <span className="col-span-3 font-bold text-slate-500">Name</span>
                    <span className="col-span-4 font-extrabold text-slate-800">{activeReport.parsedResults?.metadata?.pet_name || activeReport.pet_name || "N/A"}</span>
                    <span className="col-span-2 font-bold text-slate-500">Breed</span>
                    <span className="col-span-3 font-semibold text-slate-700">{activeReport.parsedResults?.metadata?.pet_breed || activeReport.pet_breed || "N/A"}</span>
                    <span className="col-span-3 font-bold text-slate-500">DOB/Age</span>
                    <span className="col-span-4 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.pet_age || getAgeString(activeReport.pet_dob) || "N/A"}</span>
                    <span className="col-span-2 font-bold text-slate-500">Color</span>
                    <span className="col-span-3 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.pet_color || activeReport.pet_color || "N/A"}</span>
                    <span className="col-span-3 font-bold text-slate-500">Species</span>
                    <span className="col-span-4 font-semibold text-slate-700">{activeReport.parsedResults?.metadata?.pet_species || activeReport.pet_species || "N/A"}</span>
                    <span className="col-span-2 font-bold text-slate-500">Microchip</span>
                    <span className="col-span-3 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.pet_microchip || activeReport.pet_identifying_marks || "0"}</span>
                    <span className="col-span-3 font-bold text-slate-500">Sex</span>
                    <span className="col-span-4 font-medium text-slate-700">{activeReport.parsedResults?.metadata?.pet_sex || activeReport.pet_sex || "N/A"}</span>
                    <span className="col-span-2 font-bold text-slate-500">Weight</span>
                    <span className="col-span-3 font-semibold text-slate-700">{activeReport.parsedResults?.metadata?.pet_weight || (activeReport.pet_weight ? `${activeReport.pet_weight} Kg` : "") || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Dates and Vet details */}
              <div className="flex justify-between items-center text-xs font-bold font-sans text-slate-700 mb-6 border-b border-slate-200 pb-3">
                <div>Attending Vet: <span className="font-extrabold text-slate-900">Dr. {activeReport.vet_name || "N/A"}</span></div>
                <div className="text-right space-y-1">
                  <div>Printed Date: <span className="font-extrabold text-slate-900">{activeReport.parsedResults?.metadata?.printed_date || new Date().toLocaleString("en-US", { hour12: false }).replace(",", "")}</span></div>
                  <div>Date: <span className="font-extrabold text-slate-900">{new Date(activeReport.report_date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                </div>
              </div>

              {/* Laboratory Report Table */}
              <div className="border border-slate-400 rounded-none overflow-hidden">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-slate-100 border-b border-slate-400">
                    <tr className="divide-x divide-slate-300">
                      <th className="px-4 py-2 font-extrabold text-slate-800 uppercase tracking-wider w-1/2">Test Name</th>
                      <th className="px-4 py-2 font-extrabold text-slate-800 uppercase tracking-wider w-1/4 text-center">Results</th>
                      <th className="px-4 py-2 font-extrabold text-slate-800 uppercase tracking-wider w-1/4 text-right">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {labTestCategories.map(cat => {
                      const testsWithResults = cat.tests.filter(t => activeReport.parsedResults[t.key] !== undefined && activeReport.parsedResults[t.key] !== "")
                      if (testsWithResults.length === 0) return null
                      return (
                        <React.Fragment key={cat.category}>
                          <tr className="category-section bg-slate-50/80 font-black border-y border-slate-300" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <td colSpan="3" className="px-4 py-2 text-[11px] text-slate-900 font-extrabold uppercase tracking-wider">{cat.category}</td>
                          </tr>
                          {testsWithResults.map(test => {
                            const val = activeReport.parsedResults[test.key]
                            const isAbnormal = isOutsideRange(val, test.ref)
                            return (
                              <tr key={test.key} className="hover:bg-slate-50/50 divide-x divide-slate-200" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                <td className="px-4 py-2 text-slate-700 font-semibold">{test.name}</td>
                                <td className={`px-4 py-2 text-center text-slate-900 ${isAbnormal ? "font-black text-sm text-red-700" : "font-medium"}`}>{val}</td>
                                <td className="px-4 py-2 text-right text-slate-500 font-mono">{test.ref || "Variable"}</td>
                              </tr>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signature / Stamp line */}
              <div className="mt-20 flex justify-between items-end font-sans">
                <div className="text-center w-48 border-t border-slate-300 pt-2 text-[10px] text-slate-500">Laboratory Technician</div>
                <div className="text-center w-48 border-t border-slate-300 pt-2 text-[10px] text-slate-500">Authorized Signature</div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* QR Code Modal */}
      {qrModalReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-border p-6 text-center space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <h3 className="font-bold text-slate-800 text-base">Test Report QR Code</h3>
              <button 
                onClick={() => setQrModalReport(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-lg border border-slate-200 shadow-inner">
              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/test-report/${qrModalReport.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Scan or click to open report"
                className="block p-2 bg-white rounded border border-slate-100 shadow-sm hover:opacity-90"
              >
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/test-report/${qrModalReport.id}`}
                  size={192}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                />
              </a>
              <p className="text-xs text-muted-foreground mt-3 font-semibold">Report #{qrModalReport.id} for {qrModalReport.pet_name}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 leading-normal">
                Scan this QR code with a mobile device or click on it to view and download the full test report in a new tab.
              </p>
              <div className="pt-2 flex gap-2">
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/test-report/${qrModalReport.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer block text-center"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={() => setQrModalReport(null)}
                  className="flex-1 border border-border hover:bg-slate-50 py-2 rounded-lg text-slate-700 font-semibold text-sm cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

