"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [authToken, setAuthToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("authToken")
    const userData = localStorage.getItem("user")
    if (!token || !userData) {
      setLoading(false)
      return
    }
    setAuthToken(token)
    setUser(JSON.parse(userData))
  }, [])

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!authToken || !user?.id) return
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/appointments?user_id=${user.id}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || "Failed to load appointments")
        }
        const data = await res.json()
        setAppointments(data || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [authToken, user])

  const handleCancel = async (appointmentId) => {
    if (!authToken) return
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.message || "Failed to cancel appointment")
        return
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: "cancelled" } : a)),
      )
    } catch (error) {
      alert("Failed to cancel appointment. Please try again.")
    }
  }

  if (!authToken || !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom max-w-lg text-center space-y-4">
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              Please log in to view and manage your appointments.
            </p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">My Appointments</h1>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-sm text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <p className="text-muted-foreground mb-2">You have no appointments yet.</p>
              <a
                href="/appointments"
                className="inline-block mt-2 px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-opacity-90 text-sm font-semibold"
              >
                Book an Appointment
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-card rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(appt.appointment_date || appt.appointmentDate).toLocaleString()}
                    </p>
                    <p className="font-semibold">
                      {appt.serviceName || "Appointment"} • {appt.petName || "Your pet"}
                    </p>
                    {appt.problem_description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {appt.problem_description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {appt.status}
                    </span>
                    {["pending", "confirmed"].includes(appt.status) && (
                      <button
                        onClick={() => handleCancel(appt.id)}
                        className="px-3 py-1 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}


