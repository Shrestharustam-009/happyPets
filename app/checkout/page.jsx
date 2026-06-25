"use client"
import { fetchWithAuth } from "@/lib/api"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import Image from "next/image"


export default function CheckoutPage() {
  const { cartItems, getCartTotal, clearCart } = useCart()
  const [step, setStep] = useState("shipping")
  const [loading, setLoading] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [error, setError] = useState("")
  const [authToken, setAuthToken] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  // Shipping Form
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })

  // Billing Form
  const [billingData, setBillingData] = useState({
    sameAsShipping: true,
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })

  const [paymentMethod, setPaymentMethod] = useState("cod")

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("authToken")
    setAuthToken(token)
    setAuthReady(true)
  }, [])

  const subtotal = getCartTotal()
  const shipping = subtotal > 50 ? 0 : 10
  const tax = (subtotal * 0.08).toFixed(2)
  const total = (subtotal + shipping + Number.parseFloat(tax)).toFixed(2)

  const handleShippingChange = (e) => {
    const { name, value } = e.target
    setShippingData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBillingChange = (e) => {
    const { name, value } = e.target
    setBillingData((prev) => ({ ...prev, [name]: value }))
  }

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone) => /^\d{10}$/.test(phone.replace(/\D/g, ""))

  const handleContinueShipping = () => {
    if (
      !shippingData.firstName ||
      !shippingData.lastName ||
      !shippingData.email ||
      !shippingData.phone ||
      !shippingData.address ||
      !shippingData.city ||
      !shippingData.state ||
      !shippingData.zipCode
    ) {
      alert("Please fill all fields")
      return
    }
    if (!validateEmail(shippingData.email)) {
      alert("Invalid email")
      return
    }
    if (!validatePhone(shippingData.phone)) {
      alert("Invalid phone number")
      return
    }
    setStep("billing")
  }

  const handleContinueBilling = () => {
    if (!billingData.sameAsShipping) {
      if (!billingData.address || !billingData.city || !billingData.state || !billingData.zipCode) {
        alert("Please fill all billing fields")
        return
      }
    }
    setStep("payment")
  }

  const handleSubmitPayment = async () => {
    if (!authToken) {
      setError("Please log in before placing an order.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const billingAddressPayload = billingData.sameAsShipping
        ? shippingData
        : {
            address: billingData.address,
            city: billingData.city,
            state: billingData.state,
            zipCode: billingData.zipCode,
          }

      const payload = {
        items: cartItems,
        shippingAddress: shippingData,
        billingAddress: billingAddressPayload,
        total: Number(total),
        paymentMethod,
      }

      const response = await fetchWithAuth("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to place order")
      }

      const data = await response.json()
      setOrderConfirmed(true)
      clearCart()
      setTimeout(() => {
        window.location.href = `/orders/${data.order.id}`
      }, 2000)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (authReady && !authToken) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom max-w-lg text-center space-y-4">
            <h1 className="text-3xl font-bold">Login Required</h1>
            <p className="text-muted-foreground">
              Please log in to complete your purchase and keep track of your orders.
            </p>
            <Link href="/login" className="inline-block px-6 py-3 bg-accent text-accent-foreground rounded-lg">
              Go to Login
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (cartItems.length === 0 && !orderConfirmed) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom text-center">
            <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
            <Link href="/shop" className="text-accent hover:underline">
              Back to shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (orderConfirmed) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-muted/30 py-12">
          <div className="container-custom max-w-md mx-auto">
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your purchase. A confirmation email has been sent to your inbox.
              </p>
              <Link
                href="/orders"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90"
              >
                View Order
              </Link>
            </div>
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
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 border border-red-200 bg-red-50 text-sm text-red-600 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="flex gap-4 mb-8">
                {["shipping", "billing", "payment"].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 py-2 px-4 rounded-lg text-center font-medium transition-all ${
                      step === s
                        ? "bg-accent text-accent-foreground"
                        : s === "shipping" ||
                            (s === "billing" && step !== "shipping") ||
                            (s === "payment" && step === "payment")
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>

              {/* Shipping Step */}
              {step === "shipping" && (
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-6">Shipping Address</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={shippingData.firstName}
                      onChange={handleShippingChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={shippingData.lastName}
                      onChange={handleShippingChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={shippingData.email}
                    onChange={handleShippingChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={shippingData.phone}
                    onChange={handleShippingChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={shippingData.address}
                    onChange={handleShippingChange}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={shippingData.city}
                      onChange={handleShippingChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      value={shippingData.state}
                      onChange={handleShippingChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="ZIP Code"
                      value={shippingData.zipCode}
                      onChange={handleShippingChange}
                      className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <button
                    onClick={handleContinueShipping}
                    className="w-full mt-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 font-semibold"
                  >
                    Continue to Billing
                  </button>
                </div>
              )}

              {/* Billing Step */}
              {step === "billing" && (
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-6">Billing Address</h2>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={billingData.sameAsShipping}
                      onChange={(e) => setBillingData((prev) => ({ ...prev, sameAsShipping: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Same as shipping address</span>
                  </label>

                  {!billingData.sameAsShipping && (
                    <>
                      <input
                        type="text"
                        name="address"
                        placeholder="Street Address"
                        value={billingData.address}
                        onChange={handleBillingChange}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                      />

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={billingData.city}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={billingData.state}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="ZIP Code"
                          value={billingData.zipCode}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setStep("shipping")}
                      className="flex-1 py-3 border border-border rounded-lg hover:border-accent font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleContinueBilling}
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 font-semibold"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {step === "payment" && (
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <h2 className="text-xl font-bold mb-6">Payment</h2>
                  <div className="space-y-3">
                    {[
                      { id: "cod", label: "Cash on Delivery", description: "Pay with cash or mobile wallet upon delivery." },
                      {
                        id: "bank_transfer",
                        label: "Bank Transfer / QR",
                        description: "Transfer to our clinic account or scan the QR code shown on the right.",
                      },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
                          paymentMethod === option.id ? "border-accent bg-accent/5" : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={paymentMethod === option.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Order once received can't be return back
                    </p>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => setStep("billing")}
                      className="flex-1 py-3 border border-border rounded-lg hover:border-accent font-semibold"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      disabled={loading}
                      className="flex-1 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-opacity-90 font-semibold disabled:opacity-50"
                    >
                      {loading ? "Placing Order..." : `Place Order - NPR ${total}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg border border-border p-6 sticky top-24 space-y-4">
                <h2 className="text-xl font-bold">Order Summary</h2>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-medium">NPR {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>NPR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : `NPR ${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>NPR {tax}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Scan to pay (bank transfer)</p>
                    <div className="w-32 h-32 bg-muted text-muted-foreground flex items-center justify-center rounded-lg border-2 border-dashed border-border">
                        <Image src="/qr-code.jpeg" alt="Bank Transfer" width={100} height={100}/>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Selected Payment Method</p>
                    <p className="text-muted-foreground capitalize">{paymentMethod.replace("_", " ")}</p>
                  </div>
                  <div className="p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Note:</strong> Order once received can't be return back
                    </p>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>NPR {total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
