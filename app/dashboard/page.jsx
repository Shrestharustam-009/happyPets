"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-3 bg-card rounded-lg border border-border p-8">
              <h1 className="text-3xl font-bold mb-4">Welcome, {user?.fullName}!</h1>
              <p className="text-muted-foreground mb-6">
                Here's your personal dashboard where you can manage appointments, pets, and orders.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/appointments"
                  className="p-6 bg-muted rounded-lg hover:border-accent border border-border transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-2">📅</div>
                  <h3 className="font-semibold mb-1">Appointments</h3>
                  <p className="text-sm text-muted-foreground">Book & manage appointments</p>
                </Link>
                <Link
                  href="/my-appointments"
                  className="p-6 bg-muted rounded-lg hover:border-accent border border-border transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-2">📋</div>
                  <h3 className="font-semibold mb-1">My Appointments</h3>
                  <p className="text-sm text-muted-foreground">View and cancel existing bookings</p>
                </Link>
                <Link
                  href="/my-pets"
                  className="p-6 bg-muted rounded-lg hover:border-accent border border-border transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-2">🐾</div>
                  <h3 className="font-semibold mb-1">My Pets</h3>
                  <p className="text-sm text-muted-foreground">Manage pet profiles</p>
                </Link>
                <Link
                  href="/orders"
                  className="p-6 bg-muted rounded-lg hover:border-accent border border-border transition-colors cursor-pointer"
                >
                  <div className="text-3xl mb-2">📦</div>
                  <h3 className="font-semibold mb-1">Orders</h3>
                  <p className="text-sm text-muted-foreground">View your orders</p>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="font-semibold mb-4">Account</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <button onClick={handleLogout} className="text-red-500 hover:underline w-full text-left">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
