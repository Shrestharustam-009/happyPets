"use client"

import { CartProvider } from "@/lib/cart-context"

export function RootLayoutContent({ children }) {
  return <CartProvider>{children}</CartProvider>
}
