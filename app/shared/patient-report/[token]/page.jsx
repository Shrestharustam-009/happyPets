"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

export default function SharedPatientReportPage() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`/api/shared/patient-report/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError("Report not found or unavailable."); setLoading(false) })
  }, [token])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading patient report...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2 p-8">
        <p className="text-2xl font-bold text-slate-700">Report Not Found</p>
        <p className="text-slate-500">{error || "This report does not exist or has been removed."}</p>
      </div>
    </div>
  )

  const { patient, medical, vaccinations } = data

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const d = new Date(dateString)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-blue-950 text-white py-6 print:bg-white print:text-black print:border-b-2 print:border-blue-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/happy_pets_logo.jpg" alt="HappyPets Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-0.5" />
            <div>
              <h1 className="text-xl font-black tracking-tight">HappyPets Animal Clinic</h1>
              <p className="text-blue-300 text-xs font-semibold print:text-slate-500">Imadol, Lalitpur, Nepal</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-blue-300 hover:text-white transition-colors print:hidden">
            ← Visit Website
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-blue-900">Patient Summary</h2>
            <button onClick={() => window.print()} className="print:hidden text-xs bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm font-bold hover:bg-blue-100">Print Report</button>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Patient Name</span>
              <p className="font-bold text-base mt-0.5">{patient.name}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Owner</span>
              <p className="font-bold text-base mt-0.5">{patient.owner_name}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Species / Breed</span>
              <p className="mt-0.5">{patient.species}{patient.breed ? ` — ${patient.breed}` : ""}</p>
            </div>
            <div>
              <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Gender</span>
              <p className="mt-0.5">{patient.sex || "N/A"}</p>
            </div>
            {patient.dob && (
              <div>
                <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Date of Birth</span>
                <p className="mt-0.5">{formatDate(patient.dob)}</p>
              </div>
            )}
            {patient.phone_number && (
              <div>
                <span className="text-slate-500 font-semibold uppercase text-xs tracking-wider">Owner Contact</span>
                <p className="mt-0.5">{patient.phone_number}</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-blue-900">Medical History</h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">{medical.length} record{medical.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="p-6">
            {medical.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No medical records found.</p>
            ) : (
              <div className="space-y-4">
                {medical.map((m) => (
                  <div key={m.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                      <span className="text-sm font-bold text-slate-800">{formatDate(m.visit_date)}</span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Dr. {m.vet_name}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-1">
                      <div>
                        <span className="text-slate-400 font-semibold text-xs uppercase">Chief Complaint</span>
                        <p className="mt-0.5 whitespace-pre-wrap">{m.chief_complaint || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold text-xs uppercase">Diagnosis</span>
                        <p className="mt-0.5 font-medium text-red-700 whitespace-pre-wrap">{m.primary_diagnosis || "N/A"}</p>
                      </div>
                      {(m.treatment_interventions || m.prescribed_medicines) && (
                        <>
                          <div className="pt-2 sm:col-span-1">
                            <span className="text-slate-400 font-semibold text-xs uppercase">Treatment / Interventions</span>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-700">{m.treatment_interventions || "N/A"}</p>
                          </div>
                          <div className="pt-2 sm:col-span-1">
                            <span className="text-slate-400 font-semibold text-xs uppercase">Prescription</span>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-700 font-medium">{m.prescribed_medicines || "N/A"}</p>
                          </div>
                        </>
                      )}
                    </div>
                    {(m.temperature || m.weight) && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                        {m.temperature && <span>Temp: <strong className="text-slate-700">{m.temperature}°F</strong></span>}
                        {m.pulse && <span>Pulse: <strong className="text-slate-700">{m.pulse}</strong></span>}
                        {m.respiration && <span>Resp: <strong className="text-slate-700">{m.respiration}</strong></span>}
                        {m.weight && <span>Weight: <strong className="text-slate-700">{m.weight} kg</strong></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-emerald-900">Vaccination Record</h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">{vaccinations.length} record{vaccinations.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="p-6">
            {vaccinations.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No vaccination records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left">
                      <th className="pb-2 pr-4 font-semibold text-slate-500 text-xs uppercase">Date Given</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-500 text-xs uppercase">Vaccine</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-500 text-xs uppercase">Batch #</th>
                      <th className="pb-2 pr-4 font-semibold text-slate-500 text-xs uppercase">Administered By</th>
                      <th className="pb-2 font-semibold text-slate-500 text-xs uppercase">Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinations.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2.5 pr-4">{formatDate(v.given_date)}</td>
                        <td className="py-2.5 pr-4 font-medium">{v.vaccine_name}</td>
                        <td className="py-2.5 pr-4 text-slate-500">{v.batch_number || "—"}</td>
                        <td className="py-2.5 pr-4">{v.vet_name || "—"}</td>
                        <td className="py-2.5 font-semibold text-amber-700">{v.next_due_date ? formatDate(v.next_due_date) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400 pb-8 pt-4 border-t border-slate-200">
          <p>This report was generated by <strong className="text-slate-500">HappyPets Animal Clinic</strong> · Imadol, Lalitpur, Nepal</p>
          <p className="mt-1">For questions, call <a href="tel:+9779860872125" className="text-blue-500 hover:underline">9860872125</a></p>
        </footer>
      </main>
    </div>
  )
}
