import type React from "react"
import type { Metadata } from "next"
import { Lora, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/lib/cart-context"
import "./globals.css"

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Happypets Animal Clinic",
  description: "Professional veterinary care for your beloved pets",
  generator: "v0.app",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Professional veterinary care for your beloved pets" />
        <meta name="keywords" content="veterinary, clinic, pets, animals, care" />
        <meta name="author" content="Happypets Animal Clinic" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${lora.className} ${poppins.variable} font-serif antialiased`} suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
        <Analytics />
      </body>
    </html>
  )
}
