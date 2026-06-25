"use client"
import { fetchWithAuth } from "@/lib/api"

import { useState, useEffect } from "react"


export default function AppointmentBookingForm() {
  const [step, setStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [serviceType, setServiceType] = useState(null)
  const [petSpecies, setPetSpecies] = useState("dog")
  const [petAge, setPetAge] = useState("")
  const [problemDescription, setProblemDescription] = useState("")
  const [petName, setPetName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(null)
  const [services, setServices] = useState([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("authToken")
    setAuthToken(token)
    setIsAuthenticated(!!token)
  }, [])

  // Fetch services from API for booking
  useEffect(() => {
    fetchWithAuth("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data || [])
        // Default selected is first one (if not already selected)
        if (!serviceType && data && data.length > 0) {
          setServiceType(data[0].id)
        }
      })
      .catch(() => setServices([]))
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900 text-center space-y-2">
        <p className="text-lg font-semibold">You must be logged in to book an appointment.</p>
        <a href="/login" className="inline-block px-4 py-2 mt-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-all">Login to your account</a>
      </div>
    )
  }

  const availableSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ]

  const minDate = new Date().toISOString().split("T")[0]
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const handleContinue = () => {
    if (step === 1 && (!selectedDate || !selectedTime)) {
      setError("Please select both date and time")
      return
    }
    if (step === 2 && (!petName || !petAge || !phoneNumber)) {
      setError("Please enter pet name, age, and phone number")
      return
    }
    setError("")
    setStep(step + 1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (!authToken) {
        throw new Error("You must be logged in to book")
      }
      const response = await fetchWithAuth("/api/appointments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          serviceType,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          petSpecies,
          petName,
          petAge,
          problemDescription,
          phoneNumber,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to book appointment")
      }
      setSuccess(true)
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
      {success && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">Appointment booked successfully! Redirecting...</div>
      )}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-muted"}`}
          />
        ))}
      </div>
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Service Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {services.length > 0 ? (
                services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setServiceType(service.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${serviceType === service.id ? "border-accent bg-accent/10" : "border-border hover:border-accent"}`}
                  >
                    <div className="font-semibold">{service.name}</div>
                    {service.price && (
                      <div className="text-sm text-muted-foreground mt-1">NPR {service.price}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-muted-foreground py-4">No services available</div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Date</h3>
            <input
              type="date"
              min={minDate}
              max={maxDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Time</h3>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select a time</option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full p-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-all"
            disabled={!selectedDate || !selectedTime || !serviceType}
          >
            Continue
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Pet Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="petName" className="block text-sm font-medium mb-1">
                  Pet Name
                </label>
                <input
                  type="text"
                  id="petName"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="petAge" className="block text-sm font-medium mb-1">
                  Pet Age
                </label>
                <input
                  type="text"
                  id="petAge"
                  value={petAge}
                  onChange={(e) => setPetAge(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Problem Description</h3>
            <textarea
              value={problemDescription}
              onChange={(e) => setProblemDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Phone Number</h3>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full p-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-all"
            disabled={!petName || !petAge || !phoneNumber}
          >
            Continue
          </button>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Appointment</h3>
          <p>
            Service Type: <span className="font-semibold">{services.find((s) => s.id === serviceType)?.name || ""}</span>
          </p>
          <p>
            Date: <span className="font-semibold">{selectedDate}</span>
          </p>
          <p>
            Time: <span className="font-semibold">{selectedTime}</span>
          </p>
          <p>
            Pet Name: <span className="font-semibold">{petName}</span>
          </p>
          <p>
            Pet Age: <span className="font-semibold">{petAge}</span>
          </p>
          <p>
            Problem Description: <span className="font-semibold">{problemDescription}</span>
          </p>
          <p>
            Phone Number: <span className="font-semibold">{phoneNumber}</span>
          </p>

          <button
            type="submit"
            className="w-full p-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-all"
            disabled={loading}
          >
            {loading ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      )}
    </form>
  )
}