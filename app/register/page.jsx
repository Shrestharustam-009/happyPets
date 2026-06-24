"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import RegisterForm from "@/components/auth-form-register"

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 py-12">
        <div className="container-custom max-w-md">
          <div className="bg-card rounded-lg border border-border p-8">
            <RegisterForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
