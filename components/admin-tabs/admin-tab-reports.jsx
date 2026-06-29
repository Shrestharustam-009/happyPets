"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"
import Image from "next/image"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"


export default function AdminTabReports() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPatients = patients.filter((pet) => {
    const query = searchQuery.toLowerCase().trim()
    return (
      pet.name?.toLowerCase().includes(query) ||
      pet.owner_name?.toLowerCase().includes(query) ||
      pet.species?.toLowerCase().includes(query)
    )
  })

  // Modal State
  const [reportData, setReportData] = useState(null)
  const [reportType, setReportType] = useState(null) // 'medical', 'vaccination', 'billing', 'full'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fetchingReport, setFetchingReport] = useState(false)

  // QR Code Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrPet, setQrPet] = useState(null)

  const openQrModal = (pet) => {
    setQrPet(pet)
    setQrModalOpen(true)
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth("/api/admin/patients", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const openReport = async (petId, type) => {
    setReportType(type)
    setIsModalOpen(true)
    setFetchingReport(true)
    setReportData(null)

    try {
      const res = await fetchWithAuth(`/api/admin/reports/patient/${petId}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      } else {
        alert("Failed to load report data")
        setIsModalOpen(false)
      }
    } catch (error) {
      console.error("Error fetching report:", error)
      setIsModalOpen(false)
    } finally {
      setFetchingReport(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setReportData(null)
    setReportType(null)
  }

  // --- PDF Export Logic ---
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    // Ensures YYYY-MM-DD to avoid Excel/CSV import issues
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // Helper to parse attachment URL safely
  const getAttachmentUrl = (rawString) => {
    if (!rawString) return null;
    try {
      const parsed = JSON.parse(rawString);
      if (parsed && parsed.images && parsed.images.length > 0 && parsed.images[0].url) {
        return parsed.images[0].url;
      }
    } catch (e) {
      if (rawString.startsWith('http') || rawString.startsWith('/')) {
        return rawString;
      }
    }
    return null;
  };

  const generatePDFHeader = (doc, title) => {
    doc.setFontSize(20)
    doc.setTextColor(41, 128, 185)
    doc.text("HappyPets Clinic", 14, 22)
    
    doc.setFontSize(14)
    doc.setTextColor(44, 62, 80)
    doc.text(title, 14, 32)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Patient: ${reportData?.patient?.name} (${reportData?.patient?.species} - ${reportData?.patient?.breed})`, 14, 40)
    doc.text(`Owner: ${reportData?.patient?.owner_name}`, 14, 45)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 50)
    return 60 // returns the Y position to start the table
  }

  const exportMedicalPDF = (doc = null, save = true) => {
    if (!reportData || !reportData.medical) return
    const isMainDoc = !doc
    const pdf = doc || new jsPDF()
    
    const startY = isMainDoc ? generatePDFHeader(pdf, "Medical History Report") : pdf.lastAutoTable.finalY + 15
    
    if (!isMainDoc) {
      pdf.setFontSize(14)
      pdf.setTextColor(41, 128, 185)
      pdf.text("Medical History", 14, startY - 5)
    }

    const headers = [["Visit Date / Vitals", "Complaint & Advice", "Diagnosis", "Treatment / Medicines"]]
    const rows = reportData.medical.map(m => [
      `${formatDate(m.visit_date)}\nDr. ${m.vet_name}\n\nTemp: ${m.temperature||'-'}\nWeight: ${m.weight||'-'}\nHR: ${m.heart_rate||'-'}\nBP: ${m.blood_pressure||'-'}`,
      [m.chief_complaint ? `Complaint:\n${m.chief_complaint}` : '', m.advice ? `Advice:\n${m.advice}` : ''].filter(Boolean).join('\n\n') || '-',
      [m.primary_diagnosis ? `Tentative:\n${m.primary_diagnosis}` : '', m.differential_diagnoses ? `Diagnosis:\n${m.differential_diagnoses}` : ''].filter(Boolean).join('\n\n') || '-',
      [m.treatment_interventions ? `Treatment:\n${m.treatment_interventions}` : '', m.prescribed_medicines ? `Prescription:\n${m.prescribed_medicines}` : ''].filter(Boolean).join('\n\n') || '-'
    ])

    autoTable(pdf, {
      startY: isMainDoc ? startY : startY,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { cellPadding: 3, fontSize: 9, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 55 }
      }
    })

    if (save) pdf.save(`${reportData.patient.name}_Medical_Report.pdf`)
  }

  const exportVaccinationPDF = (doc = null, save = true) => {
    if (!reportData || !reportData.vaccinations) return
    const isMainDoc = !doc
    const pdf = doc || new jsPDF()
    
    const startY = isMainDoc ? generatePDFHeader(pdf, "Vaccination Record") : pdf.lastAutoTable.finalY + 15
    
    if (!isMainDoc) {
      pdf.setFontSize(14)
      pdf.setTextColor(41, 128, 185)
      pdf.text("Vaccination Record", 14, startY - 5)
    }

    const headers = [["Date Given", "Vaccine", "Batch", "Administered By", "Next Due"]]
    const rows = reportData.vaccinations.map(v => [
      formatDate(v.given_date),
      v.vaccine_name || 'N/A',
      v.batch_number || 'N/A',
      v.vet_name || 'N/A',
      v.next_due_date ? formatDate(v.next_due_date) : 'N/A'
    ])

    autoTable(pdf, {
      startY: isMainDoc ? startY : startY,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] }
    })

    if (save) pdf.save(`${reportData.patient.name}_Vaccination_Report.pdf`)
  }

  const exportBillingPDF = (doc = null, save = true) => {
    if (!reportData || !reportData.billing) return
    const isMainDoc = !doc
    const pdf = doc || new jsPDF()
    
    const startY = isMainDoc ? generatePDFHeader(pdf, "Billing History") : pdf.lastAutoTable.finalY + 15
    
    if (!isMainDoc) {
      pdf.setFontSize(14)
      pdf.setTextColor(41, 128, 185)
      pdf.text("Billing History", 14, startY - 5)
    }

    const headers = [["Invoice", "Date", "Status", "Amount", "Items"]]
    const rows = reportData.billing.map(inv => [
      `INV-${String(inv.id).padStart(4, '0')}`,
      formatDate(inv.issue_date),
      inv.status,
      `NPR ${Number(inv.total_amount).toFixed(2)}`,
      (inv.items || []).map(i => `${i.quantity}x ${i.description}`).join(", ")
    ])

    autoTable(pdf, {
      startY: isMainDoc ? startY : startY,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [211, 84, 0] }
    })

    if (save) pdf.save(`${reportData.patient.name}_Billing_Report.pdf`)
  }

  const exportConsentPDF = (doc = null) => {
    if (!reportData || !reportData.consentForms || reportData.consentForms.length === 0) return
    const isMainDoc = !doc
    const pdf = doc || new jsPDF()
    
    const startY = isMainDoc ? generatePDFHeader(pdf, "Consent & Waiver Forms") : pdf.lastAutoTable.finalY + 15
    
    if (!isMainDoc) {
      pdf.setFontSize(14)
      pdf.setTextColor(41, 128, 185)
      pdf.text("Consent & Waiver Forms", 14, startY - 5)
    }

    const headers = [["Form Type", "Date Signed", "Status", "Attachment Link"]]
    const rows = reportData.consentForms.map(cf => [
      cf.form_type || 'N/A',
      formatDate(cf.created_at),
      cf.status || 'Signed',
      cf.attachment_url || 'No attachment'
    ])

    autoTable(pdf, {
      startY: startY,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
      styles: { cellPadding: 3, fontSize: 9, overflow: 'linebreak' }
    })
  }

  const exportFullPDF = () => {
    if (!reportData) return
    const doc = new jsPDF()
    generatePDFHeader(doc, "Complete Patient Profile")
    
    // Set an initial fake lastAutoTable so the first export function knows where to start
    doc.lastAutoTable = { finalY: 50 } 
    
    if (reportData.medical?.length > 0) exportMedicalPDF(doc, false)
    if (reportData.vaccinations?.length > 0) exportVaccinationPDF(doc, false)
    if (reportData.billing?.length > 0) exportBillingPDF(doc, false)
    if (reportData.consentForms?.length > 0) exportConsentPDF(doc, false)
    
    doc.save(`${reportData.patient.name}_Complete_Profile.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Patient Reports</h2>
        <p className="text-muted-foreground text-sm mt-1">Historical reports for any registered patient.</p>
      </div>
      <div className="flex items-center max-w-md bg-background border border-border rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-primary">
        <svg className="w-4 h-4 text-muted-foreground mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by patient name, owner, or species..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">
                  Patient (Owner)
                </th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">
                  Medical History
                </th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">
                  Vaccination Record
                </th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">
                  Billing History
                </th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">
                  Full Report
                </th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">Loading patient directory...</td></tr>
              ) : filteredPatients.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-muted-foreground">No matching patients found.</td></tr>
              ) : filteredPatients.map((pet) => (
                <tr key={pet.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {pet.photo_url ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative border border-border">
                          <Image src={pet.photo_url} alt={pet.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {pet.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-foreground text-base">{pet.name}</div>
                        <div className="text-xs text-muted-foreground">{pet.species} - {pet.owner_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openReport(pet.id, 'medical')}
                      className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-md border border-blue-200 transition-colors text-xs"
                    >
                      View Medical
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openReport(pet.id, 'vaccination')}
                      className="px-4 py-2 bg-sky-50 text-sky-600 hover:bg-sky-100 font-semibold rounded-md border border-sky-200 transition-colors text-xs"
                    >
                      View Vaccines
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openReport(pet.id, 'billing')}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold rounded-md border border-indigo-200 transition-colors text-xs"
                    >
                      View Billing
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openReport(pet.id, 'full')}
                      className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-md border border-primary/20 transition-colors text-xs"
                    >
                      Full Report
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => openQrModal(pet)}
                      className="px-4 py-2 bg-violet-50 text-violet-600 hover:bg-violet-100 font-semibold rounded-md border border-violet-200 transition-colors text-xs"
                    >
                      Generate QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reports Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
              <div>
                <h3 className="text-xl font-bold capitalize">
                  {reportType === 'full' ? 'Complete Patient Report' : `${reportType} Report`}
                </h3>
                {reportData && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Patient: <span className="font-semibold text-foreground">{reportData.patient.name}</span> |
                    Owner: {reportData.patient.owner_name}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground text-2xl leading-none">
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-muted/10">
              {fetchingReport ? (
                <div className="py-20 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Compiling report data...</p>
                </div>
              ) : reportData ? (
                <div className="space-y-8">

                  {/* Medical Section */}
                  {(reportType === 'medical' || reportType === 'full') && (
                    <div className="bg-background p-5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h4 className="font-bold text-lg text-blue-600">Medical History ({reportData.medical.length} records)</h4>
                        {reportType !== 'full' && (
                          <button onClick={() => exportMedicalPDF()} className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">
                            ↓ Download PDF
                          </button>
                        )}
                      </div>

                      {reportData.medical.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No medical records found.</p>
                      ) : (
                        <div className="space-y-4">
                          {reportData.medical.map(m => (
                            <div key={m.id} className="p-3 border border-border rounded bg-muted/20 text-sm">
                              <div className="flex justify-between font-bold mb-2">
                                <span>{new Date(m.visit_date).toLocaleDateString()}</span>
                                <span className="text-primary">Dr. {m.vet_name}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                                {m.chief_complaint && <div><span className="font-semibold text-muted-foreground text-xs uppercase">Complaint:</span> <br />{m.chief_complaint}</div>}
                                {m.primary_diagnosis && <div><span className="font-semibold text-muted-foreground text-xs uppercase">Tentative Diagnosis:</span> <br /><span className="text-red-600 font-medium">{m.primary_diagnosis}</span></div>}
                                {m.differential_diagnoses && <div><span className="font-semibold text-muted-foreground text-xs uppercase">Diagnosis:</span> <br /><span className="text-orange-600 font-medium">{m.differential_diagnoses}</span></div>}
                                
                                {m.treatment_interventions && <div className="col-span-1 sm:col-span-2 mt-1"><span className="font-semibold text-muted-foreground text-xs uppercase">Treatment / Interventions:</span> <br />{m.treatment_interventions}</div>}
                                {m.prescribed_medicines && <div className="col-span-1 sm:col-span-2 mt-1"><span className="font-semibold text-muted-foreground text-xs uppercase">Prescribed Medicines:</span> <br />{m.prescribed_medicines}</div>}
                                {m.advice && <div className="col-span-1 sm:col-span-2 mt-1"><span className="font-semibold text-muted-foreground text-xs uppercase">Advice:</span> <br />{m.advice}</div>}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground bg-white/50 p-2 rounded border border-border/50">
                                {m.temperature && <span>Temp: <strong className="text-foreground">{m.temperature}</strong></span>}
                                {m.weight && <span>Weight: <strong className="text-foreground">{m.weight} kg</strong></span>}
                                {m.heart_rate && <span>HR: <strong className="text-foreground">{m.heart_rate}</strong></span>}
                                {m.blood_pressure && <span>BP: <strong className="text-foreground">{m.blood_pressure}</strong></span>}
                                {m.pulse && <span>Pulse: <strong className="text-foreground">{m.pulse}</strong></span>}
                                {m.respiration && <span>Resp: <strong className="text-foreground">{m.respiration}</strong></span>}
                              </div>
                              {m.attachments_url && getAttachmentUrl(m.attachments_url) && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <a 
                                    href={getAttachmentUrl(m.attachments_url)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
                                  >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    View Attached File
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vaccination Section */}
                  {(reportType === 'vaccination' || reportType === 'full') && (
                    <div className="bg-background p-5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h4 className="font-bold text-lg text-sky-600">Vaccination Record ({reportData.vaccinations.length} records)</h4>
                        {reportType !== 'full' && (
                          <button onClick={() => exportVaccinationPDF()} className="text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded hover:bg-sky-100">
                            ↓ Download PDF
                          </button>
                        )}
                      </div>

                      {reportData.vaccinations.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No vaccinations found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted text-left">
                            <tr>
                              <th className="p-2 font-semibold">Date Given</th>
                              <th className="p-2 font-semibold">Vaccine</th>
                              <th className="p-2 font-semibold">Next Due</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.vaccinations.map(v => (
                              <tr key={v.id} className="border-b border-border">
                                <td className="p-2">{new Date(v.given_date).toLocaleDateString()}</td>
                                <td className="p-2 font-medium">{v.vaccine_name}</td>
                                <td className="p-2 text-red-600">{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Billing Section */}
                  {(reportType === 'billing' || reportType === 'full') && (
                    <div className="bg-background p-5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h4 className="font-bold text-lg text-indigo-600">Billing History ({reportData.billing.length} invoices)</h4>
                        {reportType !== 'full' && (
                          <button onClick={() => exportBillingPDF()} className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100">
                            ↓ Download PDF
                          </button>
                        )}
                      </div>

                      {reportData.billing.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No billing records found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted text-left">
                            <tr>
                              <th className="p-2 font-semibold">Invoice #</th>
                              <th className="p-2 font-semibold">Date</th>
                              <th className="p-2 font-semibold text-right">Amount</th>
                              <th className="p-2 font-semibold text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.billing.map(inv => (
                              <tr key={inv.id} className="border-b border-border">
                                <td className="p-2">INV-{String(inv.id).padStart(4, '0')}</td>
                                <td className="p-2">{new Date(inv.issue_date).toLocaleDateString()}</td>
                                <td className="p-2 font-bold text-right">NPR {Number(inv.total_amount).toFixed(2)}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {inv.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Consent Forms Section */}
                  {reportType === 'full' && (
                    <div className="bg-background p-5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h4 className="font-bold text-lg text-emerald-600">Consent & Waiver Forms ({reportData.consentForms?.length || 0} records)</h4>
                      </div>

                      {!reportData.consentForms || reportData.consentForms.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No consent forms found.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-muted text-left">
                            <tr>
                              <th className="p-2 font-semibold">Form Type</th>
                              <th className="p-2 font-semibold">Pet Name</th>
                              <th className="p-2 font-semibold">Date Signed</th>
                              <th className="p-2 font-semibold text-center">Status</th>
                              <th className="p-2 font-semibold text-center">Signed Form</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.consentForms.map(cf => (
                              <tr key={cf.id} className="border-b border-border">
                                <td className="p-2 font-medium capitalize">{cf.form_type}</td>
                                <td className="p-2">{cf.pet_name || 'N/A'}</td>
                                <td className="p-2">{new Date(cf.created_at).toLocaleDateString()}</td>
                                <td className="p-2 text-center">
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-800 border border-green-200">
                                    {cf.status || 'Signed'}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  {cf.attachment_url ? (
                                    <a
                                      href={cf.attachment_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100 hover:bg-emerald-100 inline-block transition-colors"
                                    >
                                      View Signature/File
                                    </a>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">No attachment</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Media & Attachments Section */}
                  {reportType === 'full' && (
                    <div className="bg-background p-5 rounded-lg border border-border shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                        <h4 className="font-bold text-lg text-amber-600">Media & Attachments</h4>
                      </div>
                      
                      {(() => {
                        const media = [];
                        if (reportData.patient?.photo_url) {
                          media.push({ type: 'Patient Photo', url: reportData.patient.photo_url });
                        }
                        reportData.medical?.forEach(m => {
                          const fileUrl = getAttachmentUrl(m.attachments_url);
                          if (fileUrl) media.push({ type: `Medical Record (${new Date(m.visit_date).toLocaleDateString()})`, url: fileUrl });
                        });
                        reportData.consentForms?.forEach(cf => {
                          if (cf.attachment_url) media.push({ type: `${cf.form_type} Signed`, url: cf.attachment_url });
                        });
                        
                        if (media.length === 0) {
                          return <p className="text-sm text-muted-foreground italic">No media or attachments found.</p>
                        }
                        
                        return (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {media.map((item, idx) => {
                              const isImage = item.url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) || item.url.startsWith('data:image/');
                              return (
                                <div key={idx} className="border border-border rounded-lg overflow-hidden flex flex-col group shadow-sm hover:shadow-md transition-shadow">
                                  <div className="h-32 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                    {isImage ? (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img src={item.url} alt={item.type} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                      <div className="flex flex-col items-center justify-center text-slate-400">
                                        <svg className="w-8 h-8 mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <span className="text-xs font-medium">Document File</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3 bg-white border-t border-border flex flex-col items-start gap-3 h-full justify-between">
                                    <span className="text-xs font-semibold truncate w-full text-slate-700 capitalize" title={item.type}>{item.type}</span>
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[11px] w-full text-center bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1.5 hover:bg-amber-100 transition-colors font-bold">
                                      Open / Download
                                    </a>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end shrink-0">
              {reportType === 'full' && reportData && (
                <button
                  onClick={exportFullPDF}
                  className="mr-3 px-6 py-2 bg-primary text-primary-foreground font-bold rounded hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Download Complete Report Bundle
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-6 py-2 border border-border font-medium rounded hover:bg-muted transition-colors"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Report QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to view the full report for <strong>{qrPet?.name}</strong> in a separate browser tab.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            {qrPet && (
              <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/patient-report/${qrPet.share_token}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <button className="w-full px-4 py-2 border border-border font-medium rounded-lg hover:bg-muted transition-colors text-sm">
                Close
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
