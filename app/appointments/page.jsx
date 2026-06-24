"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import AppointmentBookingForm from "@/components/appointment-booking-form"

export default function AppointmentsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Book an Appointment</h1>
            <p className="text-muted-foreground">
              Schedule a visit with our expert veterinarians. Select your preferred service, date, and time.
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-8">
            <AppointmentBookingForm />
          </div>

          {/* FAQ Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-card rounded-lg border border-border p-4 open:bg-muted/50 cursor-pointer group">
                <summary className="font-semibold flex justify-between items-center">
                  What should I bring to my appointment?
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-muted-foreground mt-4 text-sm">
                  Please bring your pet's medical records if available, vaccination history, and any medications your
                  pet is currently taking.
                </p>
              </details>

              <details className="bg-card rounded-lg border border-border p-4 open:bg-muted/50 cursor-pointer group">
                <summary className="font-semibold flex justify-between items-center">
                  How do I cancel or reschedule an appointment?
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-muted-foreground mt-4 text-sm">
                  You can cancel or reschedule from your dashboard at least 24 hours before your appointment.
                </p>
              </details>

              <details className="bg-card rounded-lg border border-border p-4 open:bg-muted/50 cursor-pointer group">
                <summary className="font-semibold flex justify-between items-center">
                  Do you offer emergency services?
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-muted-foreground mt-4 text-sm">
                  Our clinic is open from 8:00am to 8:00pm every day. For emergencies outside these hours, please call ahead to confirm availability.
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
