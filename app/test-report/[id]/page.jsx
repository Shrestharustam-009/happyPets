"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"

const labTestCategories = [
  { category: "HAEMATOLOGY", tests: [
    { key: "hemoglobin", name: "Hemoglobin", ref: "(13-20)" },
    { key: "pcv", name: "PCV (%)", ref: "(35-60)" },
    { key: "rbc", name: "RBC Count (M/µL)", ref: "(5-7)" },
    { key: "mcv", name: "MCV (fL)", ref: "(60-73)" },
    { key: "mch", name: "MCH (pg)", ref: "(21-25)" },
    { key: "mchc", name: "MCHC (g/dl)", ref: "(32-38)" },
    { key: "wbc", name: "WBC Count", ref: "05-17" },
    { key: "platelets", name: "Platelet Count (K/µL)", ref: "(148-484)" },
  ]},
  { category: "Differential Leucocyte Count (DLC)", tests: [
    { key: "neutrophils", name: "Neutrophils (%)", ref: "(60-77)" },
    { key: "lymphocytes", name: "Lymphocytes (%)", ref: "(12-30)" },
    { key: "monocytes", name: "Monocytes (%)", ref: "(3-10)" },
    { key: "eosinophils", name: "Eosinophils (%)", ref: "(02-10)" },
    { key: "basophils", name: "Basophils (%)", ref: "(0-1)" },
  ]},
  { category: "Absolute Leucocyte Count", tests: [
    { key: "esr", name: "ESR (mm/hr)", ref: "(5-10)" },
    { key: "blood_parasites", name: "Blood Parasites", ref: "" },
    { key: "rdw", name: "RDW (%)", ref: "(32-22)" },
    { key: "retic", name: "RETIC (K/µL)", ref: "(10-110)" },
  ]},
  { category: "BIOCHEMISTRY - Liver Function Test (LFT)", tests: [
    { key: "alt_sgpt", name: "ALT-SGPT (U/L)", ref: "(17-50)" },
    { key: "ast_sgot", name: "AST-SGOT", ref: "(10-125)" },
    { key: "alp", name: "ALP (U/L)", ref: "(23-212)" },
    { key: "total_protein", name: "Total Protein (gm/dl)", ref: "(5.2-8.2)" },
    { key: "albumin", name: "Albumin (gm/dl)", ref: "(2.3-4)" },
    { key: "globulin", name: "Globulin (gm/dl)", ref: "(2.5-4.5)" },
    { key: "ag_ratio", name: "A/G Ratio", ref: "(0.7-1.5)" },
    { key: "total_bilirubin", name: "Total Bilirubin (mg/dl)", ref: "(0.0-0.9)" },
    { key: "direct_bilirubin", name: "Direct Bilirubin", ref: "(0-0.3)" },
  ]},
  { category: "BIOCHEMISTRY - Kidney Function Test (KFT)", tests: [
    { key: "bun", name: "BUN (mg/dl)", ref: "(7-30)" },
    { key: "creatinine", name: "Creatinine (mg/dl)", ref: "(0.5-1.8)" },
    { key: "sodium", name: "Sodium (mmol/L)", ref: "(142-152)" },
    { key: "potassium", name: "Potassium (mmol/L)", ref: "(3.9-5.1)" },
    { key: "nak_ratio", name: "NA/K Ratio", ref: "(28-37)" },
  ]},
  { category: "BIOCHEMISTRY - Others", tests: [
    { key: "glucose", name: "Glucose (mg/dl)", ref: "(70-130)" },
    { key: "amylase", name: "Amylase (U/L)", ref: "(500-1500)" },
    { key: "chloride", name: "Chloride (mmol/L)", ref: "(110-124)" },
    { key: "calcium", name: "Calcium (mg/dl)", ref: "(5.1-10.0)" },
    { key: "lipase", name: "Lipase (U/L)", ref: "(200-1800)" },
    { key: "nh3", name: "NH3 (µmol/L)", ref: "(0-98)" },
    { key: "ck", name: "CK (U/L)", ref: "(100-200)" },
    { key: "lac", name: "LAC (mmol/L)", ref: "(0.5-2.5)" },
    { key: "ldh", name: "LDH (U/L)", ref: "(40-400)" },
    { key: "mg", name: "Mg (mg/dl)", ref: "(1.4-2.4)" },
    { key: "phos", name: "PHOS (mg/dl)", ref: "(2.5-6.8)" },
    { key: "uric_acid", name: "Uric Acid", ref: ">1" },
  ]},
  { category: "URINE ANALYSIS - Dipstick Analysis", tests: [
    { key: "urine_color", name: "Urine Color", ref: "(Straw, Yellow or Light amber)" },
    { key: "transparency", name: "Transparency", ref: "(Clear)" },
    { key: "urine_albumin", name: "Urine Albumin", ref: "(Negative/Trace)" },
    { key: "urine_ph", name: "Urine PH", ref: "(6-7)" },
    { key: "urine_protein", name: "Protein", ref: "Trace" },
    { key: "urine_glucose", name: "Glucose", ref: "Negative" },
    { key: "urine_ketones", name: "Ketones", ref: "Negative" },
    { key: "urine_bilirubin", name: "Bilirubin", ref: "Negative" },
    { key: "urine_blood", name: "Blood/Hemoglobin", ref: "Negative" },
    { key: "urine_leukocytes", name: "Leukocytes", ref: "Negative" },
    { key: "urine_nitrites", name: "Nitrites", ref: "Negative" },
    { key: "specific_gravity", name: "Specific Gravity", ref: "(1.015-1.045)" },
    { key: "urine_urobilinogen", name: "Urobilinogen", ref: "Normal" },
  ]},
  { category: "URINE ANALYSIS - Microscopic Examination", tests: [
    { key: "rbc_urine", name: "RBC", ref: "(0-5/HPF)" },
    { key: "wbc_urine", name: "WBC/Pus Cells", ref: "(0-5/HPF)" },
    { key: "epithelial_cells", name: "Epithelial Cells", ref: "(0-2/HPF)" },
    { key: "casts", name: "Casts", ref: "Nil" },
    { key: "crystals", name: "Crystals", ref: "Nil" },
    { key: "bacteria_urine", name: "Bacteria", ref: "Nil" },
    { key: "parasites_urine", name: "Parasites", ref: "Nil" },
  ]},
]

function isOutsideRange(val, ref) {
  if (!val || !ref) return false
  const match = ref.match(/\(?([\d.]+)[-–]([\d.]+)\)?/)
  if (!match) return false
  const num = parseFloat(val)
  if (isNaN(num)) return false
  return num < parseFloat(match[1]) || num > parseFloat(match[2])
}

function getAgeString(dob) {
  if (!dob) return ""
  const birth = new Date(dob)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  if (years > 0) return `${years}Y ${months}M`
  return `${months} Months`
}

export default function PublicTestReportPage() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/test-report/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject("Not found"))
      .then(data => { setReport(data); setLoading(false) })
      .catch(() => { setError("Report not found or unavailable."); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading report...</p>
      </div>
    </div>
  )

  if (error || !report) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2 p-8">
        <p className="text-2xl font-bold text-slate-700">Report Not Found</p>
        <p className="text-slate-500">{error || "This report does not exist or has been removed."}</p>
      </div>
    </div>
  )

  let parsedResults = {}
  try {
    parsedResults = typeof report.results === "string" ? JSON.parse(report.results) : report.results || {}
  } catch { parsedResults = {} }

  const meta = parsedResults.metadata || {}

  return (
    <>
      <style>{`
        @media print {
          /* Hide toolbar */
          .no-print { display: none !important; }

          /* Reset the page background wrapper */
          .no-print-bg {
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          /* The report card itself */
          .report-page, .report-page * {
            visibility: visible !important;
          }
          .report-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 16px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          /* Prevent rows from splitting across pages */
          .category-section {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .report-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .report-header {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          /* Tighten layout to reduce total page count */
          .report-page .mb-6 { margin-bottom: 12px !important; }
          .report-page .pb-6 { padding-bottom: 12px !important; }
          .report-page .p-8 { padding: 16px !important; }
          .report-page .mt-16 { margin-top: 32px !important; }
          
          .report-page table td, 
          .report-page table th {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
            font-size: 11px !important;
          }
          
          .report-page .category-section td {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }

          .report-page img {
            width: 72px !important;
            height: 72px !important;
            margin-bottom: 8px !important;
          }
          
          .report-page h1 {
            font-size: 22px !important;
          }
          
          .signature-line {
            page-break-before: auto;
          }
        }
        @page {
          size: A4;
          margin: 1.2cm 1cm;
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/happy_pets_logo.jpg" alt="HappyPets" className="w-9 h-9 object-contain rounded" />
          <div>
            <p className="font-bold text-slate-800 text-sm leading-none">Lab Test Report</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Happy Pets Animal Clinic</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Report document */}
      <div className="min-h-screen bg-slate-100 py-8 no-print-bg">
        <div className="report-page max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-border p-8 md:p-12 text-slate-950 font-serif leading-normal">

          {/* Clinic Banner */}
          <div className="report-header flex items-center justify-center border-b border-slate-300 pb-6 mb-6">
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
                <span className="col-span-8 font-extrabold text-slate-800">{meta.owner_name || report.client_name || "N/A"}</span>
                <span className="col-span-4 font-bold text-slate-500">Address</span>
                <span className="col-span-8 font-medium text-slate-700">{meta.owner_address || report.client_address || "N/A"}</span>
                <span className="col-span-4 font-bold text-slate-500">Contact</span>
                <span className="col-span-8 font-medium text-slate-700">{meta.owner_contact || report.client_phone || "N/A"}</span>
                <span className="col-span-4 font-bold text-slate-500">Email</span>
                <span className="col-span-8 font-medium text-slate-700">{meta.owner_email || report.client_email || "N/A"}</span>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-extrabold text-sm border-b border-slate-200 pb-1 text-slate-800 uppercase tracking-wider">{"Pet's Details"}</h3>
              <div className="grid grid-cols-12 gap-x-2 gap-y-1.5">
                <span className="col-span-3 font-bold text-slate-500">Name</span>
                <span className="col-span-4 font-extrabold text-slate-800">{meta.pet_name || report.pet_name || "N/A"}</span>
                <span className="col-span-2 font-bold text-slate-500">Breed</span>
                <span className="col-span-3 font-semibold text-slate-700">{meta.pet_breed || report.pet_breed || "N/A"}</span>
                <span className="col-span-3 font-bold text-slate-500">DOB/Age</span>
                <span className="col-span-4 font-medium text-slate-700">{meta.pet_age || getAgeString(report.pet_dob) || "N/A"}</span>
                <span className="col-span-2 font-bold text-slate-500">Color</span>
                <span className="col-span-3 font-medium text-slate-700">{meta.pet_color || report.pet_color || "N/A"}</span>
                <span className="col-span-3 font-bold text-slate-500">Species</span>
                <span className="col-span-4 font-semibold text-slate-700">{meta.pet_species || report.pet_species || "N/A"}</span>
                <span className="col-span-2 font-bold text-slate-500">Microchip</span>
                <span className="col-span-3 font-medium text-slate-700">{meta.pet_microchip || report.pet_identifying_marks || "0"}</span>
                <span className="col-span-3 font-bold text-slate-500">Sex</span>
                <span className="col-span-4 font-medium text-slate-700">{meta.pet_sex || report.pet_sex || "N/A"}</span>
                <span className="col-span-2 font-bold text-slate-500">Weight</span>
                <span className="col-span-3 font-semibold text-slate-700">{meta.pet_weight || (report.pet_weight ? `${report.pet_weight} Kg` : "") || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Dates and Vet details */}
          <div className="flex justify-between items-center text-xs font-bold font-sans text-slate-700 mb-6 border-b border-slate-200 pb-3">
            <div>Attending Vet: <span className="font-extrabold text-slate-900">Dr. {report.vet_name || "N/A"}</span></div>
            <div className="text-right space-y-1">
              <div>Printed Date: <span className="font-extrabold text-slate-900">{meta.printed_date || new Date().toLocaleString("en-US", { hour12: false }).replace(",", "")}</span></div>
              <div>Date: <span className="font-extrabold text-slate-900">{new Date(report.report_date).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
            </div>
          </div>

          {/* Laboratory Report Table */}
          <div className="border border-slate-400 rounded-none overflow-hidden report-table">
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
                  const testsWithResults = cat.tests.filter(t => parsedResults[t.key] !== undefined && parsedResults[t.key] !== "")
                  if (testsWithResults.length === 0) return null
                  return (
                    <React.Fragment key={cat.category}>
                      <tr className="category-section bg-slate-50/80 font-black border-y border-slate-300">
                        <td colSpan="3" className="px-4 py-2 text-[11px] text-slate-900 font-extrabold uppercase tracking-wider">{cat.category}</td>
                      </tr>
                      {testsWithResults.map(test => {
                        const val = parsedResults[test.key]
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
          <div className="signature-line mt-16 flex justify-between items-end font-sans">
            <div className="text-center w-48 border-t border-slate-300 pt-2 text-[10px] text-slate-500">Laboratory Technician</div>
            <div className="text-center w-48 border-t border-slate-300 pt-2 text-[10px] text-slate-500">Authorized Signature</div>
          </div>

        </div>
      </div>
    </>
  )
}
