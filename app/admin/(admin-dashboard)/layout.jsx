"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  Activity, 
  Users, 
  Stethoscope, 
  FileText, 
  Syringe, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Bell, 
  Shield, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Heart,
  ChevronRight,
  ClipboardCheck,
  Calendar,
  ShoppingCart,
  BookOpen,
  Wrench,
  UserCheck,
  Image,
  Star
} from "lucide-react"

export default function AdminDashboardLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [remindersCount, setRemindersCount] = useState(0)

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const res = await fetch("/api/admin/reminders")
        if (res.ok) {
          const data = await res.json()
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
          twoDaysFromNow.setHours(23, 59, 59, 999)

          const dueSoon = data.filter(r => {
            const dueDate = new Date(r.next_due_date)
            return dueDate <= twoDaysFromNow
          })
          setRemindersCount(dueSoon.length)
        }
      } catch (err) {
        console.error("Error fetching reminders count:", err)
      }
    }

    if (isLoggedIn) {
      fetchNotificationCount()
      const interval = setInterval(fetchNotificationCount, 15000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem("adminToken")
    const adminData = localStorage.getItem("admin")

    if (!adminToken || !adminData) {
      router.push("/admin/login")
      return
    }

    try {
      const parsed = JSON.parse(adminData)
      setAdmin(parsed)
      setIsLoggedIn(true)

      const correctPrefix = parsed.role === "vet" ? "/vet" : parsed.role === "reception" ? "/receptionist" : "/admin"

      if (pathname !== "/admin/login") {
        if (pathname.startsWith("/admin") && correctPrefix !== "/admin") {
          const relativePath = pathname.substring(6)
          router.push(`${correctPrefix}${relativePath}`)
          return
        }
        if (pathname.startsWith("/vet") && correctPrefix !== "/vet") {
          const relativePath = pathname.substring(4)
          router.push(`${correctPrefix}${relativePath}`)
          return
        }
        if (pathname.startsWith("/receptionist") && correctPrefix !== "/receptionist") {
          const relativePath = pathname.substring(13)
          router.push(`${correctPrefix}${relativePath}`)
          return
        }
      }

      // Guard: Redirect vet roles trying to access admin-only tabs
      if (parsed.role === "vet") {
        const restricted = ["billing", "inventory", "reminders", "users"]
        const isRestricted = restricted.some(
          (tab) => pathname === `/vet/${tab}` || pathname.startsWith(`/vet/${tab}/`)
        )
        if (isRestricted) {
          router.push("/vet")
        }
      }

      // Guard: Redirect reception roles trying to access users tab
      if (parsed.role === "reception") {
        const restricted = ["users"]
        const isRestricted = restricted.some(
          (tab) => pathname === `/receptionist/${tab}` || pathname.startsWith(`/receptionist/${tab}/`)
        )
        if (isRestricted) {
          router.push("/receptionist")
        }
      }
    } catch (error) {
      console.error("[v0] Error parsing admin data:", error)
      localStorage.removeItem("adminToken")
      localStorage.removeItem("admin")
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")
    router.push("/admin/login")
  }

  // Tabs restricted to admin-only
  const adminOnlyTabs = ['billing', 'inventory', 'reminders', 'users']

  const prefix = admin?.role === 'vet' ? '/vet' : admin?.role === 'reception' ? '/receptionist' : '/admin'

  const allTabs = [
    { id: "overview", label: "Overview", path: `${prefix}`, icon: Activity },
    { id: "appointments", label: "Appointments", path: `${prefix}/appointments`, icon: Calendar },
    { id: "patients", label: "Patients (Pets)", path: `${prefix}/patients`, icon: Stethoscope },
    { id: "medical_records", label: "Medical Records", path: `${prefix}/medical-records`, icon: FileText },
    { id: "vaccinations", label: "Vaccinations", path: `${prefix}/vaccinations`, icon: Syringe },
    { id: "consent_forms", label: "Consent Forms", path: `${prefix}/consent-forms`, icon: ClipboardCheck },
    { id: "billing", label: "Billing", path: `${prefix}/billing`, icon: DollarSign },
    { id: "inventory", label: "Inventory", path: `${prefix}/inventory`, icon: Package },
    { id: "orders", label: "Orders", path: `${prefix}/orders`, icon: ShoppingCart },
    { id: "blog", label: "Blog Posts", path: `${prefix}/blog`, icon: BookOpen },
    { id: "services", label: "Services", path: `${prefix}/services`, icon: Wrench },
    { id: "team", label: "Team", path: `${prefix}/team`, icon: UserCheck },
    { id: "images", label: "Images", path: `${prefix}/images`, icon: Image },
    { id: "reviews", label: "Reviews", path: `${prefix}/reviews`, icon: Star },
    { id: "reports", label: "Reports", path: `${prefix}/reports`, icon: TrendingUp },
    { id: "reminders", label: "Reminders", path: `${prefix}/reminders`, icon: Bell },
    { id: "users", label: "Users (Staff)", path: `${prefix}/users`, icon: Shield },
  ]

  const tabs = admin?.role === 'vet'
    ? allTabs.filter(tab => !adminOnlyTabs.includes(tab.id))
    : admin?.role === 'reception'
      ? allTabs.filter(tab => tab.id !== 'users')
      : allTabs

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">Loading dashboard...</p>
        </div>
      </main>
    )
  }

  if (!isLoggedIn || !admin) {
    return null
  }

  // Get current tab label
  const activeTab = tabs.find(tab => tab.id === 'overview' ? pathname === prefix : pathname === tab.path || pathname.startsWith(tab.path + '/'))
  const pageTitle = activeTab ? activeTab.label : (admin.role === 'vet' ? 'Veterinarian Dashboard' : admin.role === 'reception' ? 'Receptionist Dashboard' : 'Admin Dashboard')

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* ===== SIDEBAR (DESKTOP) ===== */}
      <aside className="hidden lg:flex flex-col w-64 bg-blue-950 text-white shrink-0 border-r border-blue-900 h-full overflow-hidden">
        {/* Brand Logo */}
        <div className="h-16 border-b border-blue-900 bg-blue-950">
          <Link href="/" className="flex items-center px-6 h-full gap-3 hover:opacity-85 transition-opacity">
            <img src="/logo.png" alt="HappyPets Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" />
            <div>
              <span className="font-black text-lg tracking-tight text-white block">HappyPets</span>
              <span className="text-[10px] text-blue-300 font-bold tracking-wider uppercase -mt-1 block">
                {admin.role === 'admin' ? 'Admin Panel' : admin.role === 'vet' ? 'Vet Panel' : admin.role === 'reception' ? 'Reception Panel' : admin.role === 'client' ? 'Client Panel' : `${admin.role} Panel`}
              </span>
            </div>
          </Link>
        </div>

        {/* Sidebar Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = tab.id === 'overview' ? pathname === prefix : pathname === tab.path || pathname.startsWith(tab.path + '/')
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                    : "text-blue-200/70 hover:bg-blue-900/50 hover:text-white"
                }`}
              >
                <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-300/60'}`} />
                <span>{tab.label}</span>
                {tab.id === 'reminders' && remindersCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {remindersCount}
                  </span>
                )}
                {isActive && tab.id !== 'reminders' && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-4 border-t border-blue-900 bg-blue-950/40 text-center">
          <div className="text-[10px] text-blue-300/50 font-bold uppercase tracking-wider">HappyPets VPMS v2.0</div>
        </div>
      </aside>

      {/* ===== MOBILE SIDEBAR DRAWER ===== */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/50 backdrop-blur-sm">
          <div className="w-64 bg-blue-950 text-white flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-blue-900 bg-blue-950">
              <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
                <img src="/logo.png" alt="HappyPets Logo" className="w-8 h-8 object-contain bg-white rounded-lg p-0.5" />
                <span className="font-black text-lg tracking-tight text-white">HappyPets</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-blue-900 rounded-lg">
                <X className="w-5 h-5 text-blue-300" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {tabs.map((tab) => {
                 const isActive = tab.id === 'overview' ? pathname === prefix : pathname === tab.path || pathname.startsWith(tab.path + '/')
                return (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-blue-200/70 hover:bg-blue-900/50 hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.id === 'reminders' && remindersCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {remindersCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* ===== TOP BAR / HEADER ===== */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          </div>

          {/* User Profile and Logout options */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {admin.fullName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{admin.fullName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    {admin.role === 'admin' ? 'Administrator' : admin.role === 'vet' ? 'Veterinarian' : admin.role === 'reception' ? 'Receptionist' : admin.role === 'client' ? 'Client' : admin.role}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-6 w-px bg-slate-200"></div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all duration-200 text-sm font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ===== TAB CONTENT AREA ===== */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
