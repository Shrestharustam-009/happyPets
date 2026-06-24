"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Admin login failed")
      }

      const data = await response.json()
      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("admin", JSON.stringify(data.admin))

      const targetPath = data.admin.role === 'vet' ? '/vet' : data.admin.role === 'reception' ? '/receptionist' : '/admin'
      router.push(targetPath)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Admin Login</h2>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Admin email"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Admin password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Admin Login"}
        </button>
      </form>
    </div>
  )
}
