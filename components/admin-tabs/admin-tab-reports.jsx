"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function AdminTabReports() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [reportData, setReportData] = useState(null)
  const [reportType, setReportType] = useState(null) // 'medical', 'vaccination', 'billing', 'full'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [fetchingReport, setFetchingReport] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/patients")
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
      const res = await fetch(`/api/admin/reports/patient/${petId}`)
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

    const headers = [["Visit Date", "Attending Vet", "Chief Complaint", "Diagnosis", "Vitals (T/P/R/W)"]]
    const rows = reportData.medical.map(m => [
      formatDate(m.visit_date),
      `Dr. ${m.vet_name}`,
      m.chief_complaint || 'N/A',
      m.primary_diagnosis || 'N/A',
      `${m.temperature||'-'} / ${m.pulse||'-'} / ${m.respiration||'-'} / ${m.weight||'-'}`
    ])

    autoTable(pdf, {
      startY: isMainDoc ? startY : startY,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
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

  const exportFullPDF = () => {
    if (!reportData) return
    const doc = new jsPDF()
    generatePDFHeader(doc, "Complete Patient Profile")
    
    // Set an initial fake lastAutoTable so the first export function knows where to start
    doc.lastAutoTable = { finalY: 50 } 
    
    if (reportData.medical?.length > 0) exportMedicalPDF(doc, false)
    if (reportData.vaccinations?.length > 0) exportVaccinationPDF(doc, false)
    if (reportData.billing?.length > 0) exportBillingPDF(doc, false)
    
    doc.save(`${reportData.patient.name}_Complete_Profile.pdf`)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Patient Reports</h2>
        <p className="text-muted-foreground text-sm mt-1">Historical reports for any registered patient.</p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">Loading patient directory...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">No patients registered.</td></tr>
              ) : patients.map((pet) => (
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
                              <div className="grid grid-cols-2 gap-4 mb-2">
                                <div><span className="font-semibold text-muted-foreground text-xs uppercase">Complaint:</span> <br />{m.chief_complaint}</div>
                                <div><span className="font-semibold text-muted-foreground text-xs uppercase">Diagnosis:</span> <br /><span className="text-red-600 font-medium">{m.primary_diagnosis || 'N/A'}</span></div>
                              </div>
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
                                <td className="p-2 font-bold text-right">${Number(inv.total_amount).toFixed(2)}</td>
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
    </div>
  )
}
