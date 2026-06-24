"use client"

import { useState, useEffect } from "react"
import AdminTabOverview from "@/components/admin-tabs/admin-tab-overview"
import AdminTabAppointments from "@/components/admin-tabs/admin-tab-appointments"
import AdminTabProducts from "@/components/admin-tabs/admin-tab-products"
import AdminTabOrders from "@/components/admin-tabs/admin-tab-orders"
import AdminTabBlog from "@/components/admin-tabs/admin-tab-blog"
import AdminTabServices from "@/components/admin-tabs/admin-tab-services"
import AdminTabUsers from "@/components/admin-tabs/admin-tab-users"
import AdminTabReviews from "@/components/admin-tabs/admin-tab-reviews"
import AdminTabTeam from "@/components/admin-tabs/admin-tab-team"
import AdminTabImages from "@/components/admin-tabs/admin-tab-images"

export default function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "blog", label: "Blog Posts", icon: "📝" },
    { id: "services", label: "Services", icon: "🏥" },
    { id: "team", label: "Team", icon: "👨‍⚕️" },
    { id: "images", label: "Images", icon: "🖼️" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
  ]

  return (
    <div className="bg-background rounded-lg border border-border">
      {/* Tabs Header */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-b-primary text-primary"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="p-6">
        {activeTab === "overview" && <AdminTabOverview stats={stats} />}
        {activeTab === "appointments" && <AdminTabAppointments />}
        {activeTab === "products" && <AdminTabProducts />}
        {activeTab === "orders" && <AdminTabOrders />}
        {activeTab === "blog" && <AdminTabBlog />}
        {activeTab === "services" && <AdminTabServices />}
        {activeTab === "team" && <AdminTabTeam />}
        {activeTab === "images" && <AdminTabImages />}
        {activeTab === "users" && <AdminTabUsers />}
        {activeTab === "reviews" && <AdminTabReviews />}
      </div>
    </div>
  )
}
