"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("authToken")
    setAuthToken(token)
    setAuthReady(true)
  }, [])

  useEffect(() => {
    if (!id || !authToken) return
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        const data = await res.json()
        if (!res.ok || data.message) {
          throw new Error(data.message || "Failed to load order.")
        }
        setOrder(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id, authToken])

  if (authReady && !authToken) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom max-w-lg text-center space-y-4">
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">Please log in to view this order.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found.</div>

  const shippingAddress = order.shipping_address || {}
  const billingAddress = order.billing_address || {}

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom max-w-3xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-8">
            <h1 className="text-2xl font-bold mb-4">Order Details</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Order #</div>
                <div className="font-bold">{order.order_number || order.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Status</div>
                <div className="font-semibold">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {order.status}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Placed</div>
                <div>{order.created_at ? new Date(order.created_at).toLocaleString() : "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm mb-1">Total</div>
                <div className="font-bold">NPR {Number(order.total_amount || order.total || 0).toFixed(2)}</div>
              </div>
            </div>
            <div className="mb-6">
              <div className="font-semibold mb-2">Items</div>
              {order.items && order.items.length > 0 ? (
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 border">Product</th>
                      <th className="p-2 border">Quantity</th>
                      <th className="p-2 border">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.product_id}>
                        <td className="p-2 border">{item.product_name || item.product_id}</td>
                        <td className="p-2 border">{item.quantity}</td>
                        <td className="p-2 border">NPR {Number(item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>No items found.</div>
              )}
            </div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-semibold mb-2">Shipping Address</div>
                <div className="text-sm text-muted-foreground wrap-break-word space-y-1">
                  {order.shipping_address ? (
                    <>
                      {(shippingAddress.firstName || shippingAddress.lastName) && (
                        <p>
                          {[shippingAddress.firstName, shippingAddress.lastName].filter(Boolean).join(" ")}
                        </p>
                      )}
                      {shippingAddress.address && <p>{shippingAddress.address}</p>}
                      {(shippingAddress.city || shippingAddress.state || shippingAddress.zipCode) && (
                        <p>
                          {[shippingAddress.city, shippingAddress.state, shippingAddress.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-2">Billing Address</div>
                <div className="text-sm text-muted-foreground  wrap-break-word space-y-1">
                  {order.billing_address ? (
                    <>
                      {billingAddress.address && <p>{billingAddress.address}</p>}
                      {(billingAddress.city || billingAddress.state || billingAddress.zipCode) && (
                        <p>
                          {[billingAddress.city, billingAddress.state, billingAddress.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => router.push("/orders")} className="mt-6 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-opacity-90">Back to Orders</button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
