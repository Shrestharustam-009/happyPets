"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [authToken, setAuthToken] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("authToken")
    setAuthToken(token)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (!authToken) return
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders?scope=customer", {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || "Failed to load orders")
        }
        const data = await res.json()
        setOrders(data)
      } catch (error) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [authToken])

  if (authReady && !authToken) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom max-w-lg text-center space-y-4">
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">Please log in to view your order history.</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg">
              Login
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12 flex items-center justify-center">
          <div className="text-muted-foreground">Loading your orders...</div>
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
          <h1 className="text-4xl font-bold mb-8">My Orders</h1>

          {error && <div className="mb-6 p-4 border border-red-200 bg-red-50 text-sm text-red-600 rounded-lg">{error}</div>}

          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-lg border border-border p-6 hover:border-accent transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Order Number</p>
                      <p className="font-bold">{order.order_number || order.orderNumber || order.id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Date</p>
                      <p className="font-bold">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Status</p>
                      <p className="font-bold text-blue-600">
                        {order.status || "pending"}
                      </p>
                    </div>
                    <div className="text-right md:text-left">
                      <p className="text-muted-foreground text-sm">Total</p>
                      <p className="font-bold">NPR {Number(order.total_amount || order.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {order.itemCount || 0} {order.itemCount === 1 ? "item" : "items"} • Payment:{" "}
                    {order.payment_method || "cod"}
                  </div>
                  <Link href={`/orders/${order.id}`} className="text-accent hover:underline text-sm mt-4 inline-block">
                    View Details →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link href="/shop" className="text-accent hover:underline">
                Start shopping
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
