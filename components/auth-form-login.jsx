"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log(email, password);

    try {
      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Login failed")
      }

      const data = await response.json()
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push("/dashboard")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Sign In to Your Account</h2>

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="you@example.com"
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
            placeholder="Your password"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="space-y-2 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-accent hover:underline">
              Register here
            </Link>
          </p>
          <Link href="#" className="text-accent hover:underline block">
            Forgot your password?
          </Link>
        </div>
      </form>
    </div>
  )
}
