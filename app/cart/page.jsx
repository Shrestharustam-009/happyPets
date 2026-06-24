"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useCart } from "@/lib/cart-context"
import Image from "next/image"
import Link from "next/link"

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const [discount, setDiscount] = useState(0)

  const subtotal = getCartTotal()
  // Remove shippingCost entirely
  const total = (subtotal - discount).toFixed(2);



  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="text-5xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start shopping by exploring our pet products and services.</p>
              <Link
                href="/shop"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6 border-b border-border last:border-b-0 flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                        <Image src={item.image_url || "/placeholder.svg"} alt={item.name || "Product image"} fill className="object-contain" />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{item.name}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{item.category}</p>
                        <p className="font-bold text-primary">NPR {item.price}</p>
                      </div>

                      {/* Quantity */}
                      <div className="flex items-center border border-border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 hover:bg-muted"
                        >
                          −
                        </button>
                        <span className="px-4 py-2 border-l border-r border-border text-center min-w-12">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 hover:bg-muted"
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="font-bold">NPR {(item.price * item.quantity).toFixed(2)}</p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:underline text-sm mt-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Cart Actions */}
                  <div className="p-6 bg-muted/30 flex gap-3">
                    <Link
                      href="/shop"
                      className="px-4 py-2 border border-border rounded-lg hover:border-accent text-sm font-medium"
                    >
                      Continue Shopping
                    </Link>
                    <button
                      onClick={clearCart}
                      className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-lg border border-border p-6 sticky top-24 space-y-4">
                  <h2 className="text-xl font-bold">Order Summary</h2>

                  

                  {/* Savings message */}
                  {cartItems.some(item => item.original_price && item.original_price > item.price) && (
                    <div className="text-blue-600 font-medium text-sm mb-2">
                      You saved NPR {cartItems.reduce((acc, item) =>
                        item.original_price && item.price && item.original_price > item.price
                          ? acc + ((item.original_price - item.price) * item.quantity)
                          : acc, 0).toFixed(2)}
                    </div>
                  )}

                  {/* Order Summary - show only Subtotal, Discount (if any), and Total. Remove Shipping. */}
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>NPR {subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Discount</span>
                        <span>-NPR {discount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between font-bold text-lg mb-4">
                      <span>Total</span>
                      <span>NPR {total}</span>
                    </div>

                    <Link
                      href="/checkout"
                      className="w-full block text-center py-3 bg-accent text-accent-foreground rounded-lg hover:bg-opacity-90 transition-all font-semibold"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>


                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
