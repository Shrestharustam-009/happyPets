"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import LoginForm from "@/components/auth-form-login"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom max-w-md">
          {registered && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm text-center">
              Account created successfully! Please sign in with your credentials.
            </div>
          )}
          <div className="bg-card rounded-lg border border-border p-8">
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
