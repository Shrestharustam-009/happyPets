"use client"

import { useState, useEffect } from "react"
import { Users, FileText, Activity, AlertTriangle, TrendingUp, Package, Clock, ArrowRight, UserPlus, FilePlus, Bell, CalendarCheck, Stethoscope, Syringe, ShoppingBag, DollarSign, Shield, Zap } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#2563eb', '#3b82f6', '#0284c7', '#06b6d4', '#6366f1', '#4f46e5']

function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const num = Number(value) || 0
    const duration = 1200
    const steps = 40
    const increment = num / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= num) { setCount(num); clearInterval(timer) }
      else setCount(current)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}{suffix}</span>
}

export default function AdminTabOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState("admin")
  const prefix = role === 'vet' ? '/vet' : role === 'reception' ? '/receptionist' : '/admin'

  useEffect(() => {
    fetchStats()
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData)
        if (parsed.role) setRole(parsed.role)
      } catch (e) {
        console.error("Error parsing admin role:", e)
      }
    }
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats")
      if (res.ok) setStats(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    </div>
  )

  if (!stats) return (
    <div className="flex flex-col items-center justify-center p-12 max-w-xl mx-auto my-12 bg-card rounded-2xl border border-border shadow-sm text-center">
      <AlertTriangle className="w-12 h-12 text-destructive mb-4 animate-bounce" />
      <h3 className="font-extrabold text-xl text-foreground mb-2">Database Connection Failed</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        We couldn't connect to the MySQL database. Please make sure your database server is running on port 3306 and refresh the page.
      </p>
      <button 
        onClick={() => { setLoading(true); fetchStats(); }}
        className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all text-sm shadow-sm"
      >
        Retry Connection
      </button>
    </div>
  )

  const isVet = role === 'vet'

  const m = stats.metrics
  const speciesData = stats.speciesDistribution?.length > 0
    ? stats.speciesDistribution.map(s => ({ name: s.name || 'Unspecified', value: Number(s.value) }))
    : [{ name: 'No Data', value: 1 }]
  const totalSpecies = speciesData.reduce((a, b) => a + b.value, 0)

  const revenueData = stats.revenueByMonth || []
  const maxRev = Math.max(...revenueData.map(d => Number(d.revenue) || 0), 1)

  const alertCount = Number(stats.alerts.overdueReminders) + stats.alerts.lowStock.length + Number(stats.alerts.upcomingVaccines)

  // Filter primary metrics
  const primaryMetrics = [
    ...(!isVet ? [{ label: 'Total Revenue', value: m.totalRevenue, prefix: 'NPR ', icon: DollarSign, color: 'blue', decimals: 2 }] : []),
    { label: 'Active Clients', value: m.totalClients, icon: Users, color: 'indigo' },
    { label: 'Registered Patients', value: m.totalPets, icon: Stethoscope, color: 'sky' },
    { label: 'Visits This Month', value: m.appointmentsThisMonth, icon: CalendarCheck, color: 'blue' },
  ]

  // Filter secondary metrics
  const secondaryMetrics = [
    { label: 'Medical Records', value: m.totalMedicalRecords, icon: FileText, bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Vaccinations', value: m.totalVaccinations, icon: Syringe, bg: 'bg-sky-50', text: 'text-sky-700' },
    ...(!isVet ? [
      { label: 'Invoices', value: m.totalInvoices, icon: DollarSign, bg: 'bg-blue-100/50', text: 'text-blue-800' },
      { label: 'Products', value: m.totalProducts, icon: Package, bg: 'bg-indigo-50', text: 'text-indigo-700' },
    ] : []),
    { label: 'Services', value: m.activeServices, icon: Shield, bg: 'bg-sky-100/50', text: 'text-sky-800' },
  ]

  // Filter activities to exclude Billing for Vets
  const filteredActivities = isVet 
    ? stats.activityFeed.filter(item => item.type !== 'Billing')
    : stats.activityFeed

  return (
    <div className="space-y-6">
      {/* ===== WELCOME HERO ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {isVet ? 'Veterinarian Dashboard' : role === 'reception' ? 'Receptionist Dashboard' : 'HappyPets Dashboard'}
            </h1>
            <p className="text-blue-100 mt-1 text-sm">Real-time overview of your veterinary practice.</p>
          </div>
          <div className="flex gap-3">
            <Link href={`${prefix}/patients`} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl font-semibold text-sm transition-all border border-white/20">
              <UserPlus className="w-4 h-4" /> Add Patient
            </Link>
            {!isVet && (
              <>
                <Link href={`${prefix}/billing`} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur rounded-xl font-semibold text-sm transition-all border border-white/20">
                  <FilePlus className="w-4 h-4" /> New Invoice
                </Link>
                <Link href={`${prefix}/reminders`} className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 rounded-xl font-bold text-sm transition-all shadow-lg">
                  <Bell className="w-4 h-4" /> Reminders
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== PRIMARY METRICS ===== */}
      <div className={`grid gap-4 ${isVet ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {primaryMetrics.map((card, i) => (
          <div key={i} className="group relative bg-background rounded-2xl p-5 border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-${card.color}-500/10 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-xl bg-${card.color}-100 text-${card.color}-600`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-foreground relative z-10">
              <AnimatedCounter value={card.value} prefix={card.prefix || ''} decimals={card.decimals || 0} />
            </div>
          </div>
        ))}
      </div>

      {/* ===== SECONDARY METRICS ROW ===== */}
      <div className={`grid gap-3 ${isVet ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'}`}>
        {secondaryMetrics.map((item, i) => (
          <div key={i} className={`${item.bg} rounded-xl p-4 border border-transparent hover:border-border transition-all duration-200`}>
            <div className="flex items-center gap-2 mb-1">
              <item.icon className={`w-3.5 h-3.5 ${item.text}`} />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
            </div>
            <div className={`text-2xl font-black ${item.text}`}>{Number(item.value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Trend (Admin Only) */}
        {!isVet && (
          <div className="lg:col-span-3 bg-background rounded-2xl border border-border shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold">Revenue Trend</h2>
                <p className="text-xs text-muted-foreground">Monthly revenue breakdown</p>
              </div>
              <Link href={`${prefix}/reports`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View Reports <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {revenueData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No revenue data yet. Create your first invoice!</div>
            ) : (
              <div className="space-y-3">
                {revenueData.map((d, i) => {
                  const rev = Number(d.revenue) || 0
                  const pct = (rev / maxRev) * 100
                  return (
                    <div key={i} className="group flex items-center gap-3">
                      <div className="w-12 text-xs font-bold text-muted-foreground text-right">{d.month}</div>
                      <div className="flex-1 h-9 bg-muted/50 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        >
                          <span className="text-[11px] font-bold text-white drop-shadow">NPR {rev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-border flex gap-6">
              <div>
                <div className="text-xs text-muted-foreground">Collected</div>
                <div className="text-lg font-black text-emerald-600">NPR {Number(m.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="text-lg font-black text-amber-600">NPR {Number(m.pendingRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        )}

        {/* Species Donut + Stats */}
        <div className={`${isVet ? 'lg:col-span-5' : 'lg:col-span-2'} bg-background rounded-2xl border border-border shadow-sm p-6 flex flex-col`}>
          <h2 className="text-lg font-bold mb-1">Patient Demographics</h2>
          <p className="text-xs text-muted-foreground mb-4">Species distribution</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={speciesData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,.12)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-auto space-y-2">
            {speciesData.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{s.value}</span>
                  <span className="text-xs text-muted-foreground">({totalSpecies > 0 ? Math.round((s.value / totalSpecies) * 100) : 0}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM ROW: ACTIVITY + RECENT PATIENTS ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-bold">Activity Feed</h2>
            <p className="text-[11px] text-muted-foreground">Latest clinic actions</p>
          </div>
          <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No recent activity</div>
            ) : filteredActivities.map((item, i) => (
              <div key={i} className="px-5 py-3 hover:bg-muted/30 transition-colors flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  item.type === 'Medical' ? 'bg-blue-100 text-blue-600' :
                  item.type === 'Vaccination' ? 'bg-sky-100 text-sky-600' :
                  'bg-indigo-100 text-indigo-600'
                }`}>
                  {item.type === 'Medical' ? <Activity className="w-3 h-3" /> :
                   item.type === 'Vaccination' ? <Syringe className="w-3 h-3" /> :
                   <DollarSign className="w-3 h-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground truncate">{item.pet_name || 'System'}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                    item.type === 'Medical' ? 'bg-blue-100 text-blue-700' :
                    item.type === 'Vaccination' ? 'bg-sky-100 text-sky-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Recent Patients</h2>
              <p className="text-[11px] text-muted-foreground">Newly registered</p>
            </div>
            <Link href={`${prefix}/patients`} className="text-xs font-bold text-primary hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-border max-h-[380px] overflow-y-auto">
            {(stats.recentPatients || []).length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No patients yet</div>
            ) : stats.recentPatients.map((pet, i) => (
              <div key={i} className="px-5 py-3 hover:bg-muted/30 transition-colors flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-black text-sm shrink-0">
                  {pet.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-foreground">{pet.name}</div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(pet.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{pet.species} · {pet.breed} · Owner: {pet.owner_name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== LOW STOCK & VACCINATION REMINDERS (Admin Only) ===== */}
      {!isVet && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Low Stock Reminders */}
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600"><Package className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-base font-bold">Low Stock Alerts</h2>
                  <p className="text-[11px] text-muted-foreground">Products running low on inventory</p>
                </div>
              </div>
              <Link href={`${prefix}/inventory`} className="text-xs font-bold text-primary hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-border max-h-[340px] overflow-y-auto">
              {stats.alerts.lowStock.length === 0 ? (
                <div className="p-8 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                  <div className="text-sm font-semibold text-green-600">All inventory levels are healthy</div>
                  <div className="text-xs text-muted-foreground mt-1">No products below threshold</div>
                </div>
              ) : stats.alerts.lowStock.map((item) => (
                <div key={item.id} className="px-5 py-3 hover:bg-muted/30 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      item.stock <= 2 ? 'bg-red-100 text-red-600' : item.stock <= 5 ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {item.stock}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">NPR {Number(item.price).toFixed(2)} per unit</div>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                    item.stock <= 2 ? 'bg-red-100 text-red-700' : item.stock <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.stock <= 2 ? 'Critical' : item.stock <= 5 ? 'Low' : 'Warning'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vaccination Reminders */}
          <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600"><Syringe className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-base font-bold">Vaccination Reminders</h2>
                  <p className="text-[11px] text-muted-foreground">Overdue & upcoming vaccinations</p>
                </div>
              </div>
              <Link href={`${prefix}/reminders`} className="text-xs font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="max-h-[340px] overflow-y-auto">
              {/* Overdue */}
              {(stats.alerts.overdueVaccinesList || []).length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wider">Overdue</div>
                  {stats.alerts.overdueVaccinesList.map((v, i) => (
                    <div key={`o-${i}`} className="px-5 py-3 border-b border-border hover:bg-red-50/30 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0">
                          {v.pet_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{v.pet_name} <span className="text-muted-foreground font-normal">· {v.vaccine_name}</span></div>
                          <div className="text-[11px] text-muted-foreground">Owner: {v.owner_name}{v.phone ? ` · ${v.phone}` : ''}</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg whitespace-nowrap">
                        {new Date(v.next_due_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Upcoming */}
              {(stats.alerts.upcomingVaccinesList || []).length > 0 && (
                <div>
                  <div className="px-5 py-2 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wider">Upcoming</div>
                  {stats.alerts.upcomingVaccinesList.map((v, i) => {
                    const daysLeft = Math.ceil((new Date(v.next_due_date) - new Date()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={`u-${i}`} className="px-5 py-3 border-b border-border hover:bg-amber-50/30 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                            {v.pet_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{v.pet_name} <span className="text-muted-foreground font-normal">· {v.vaccine_name}</span></div>
                            <div className="text-[11px] text-muted-foreground">Owner: {v.owner_name}{v.phone ? ` · ${v.phone}` : ''}</div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg whitespace-nowrap">
                          {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
              {(stats.alerts.overdueVaccinesList || []).length === 0 && (stats.alerts.upcomingVaccinesList || []).length === 0 && (
                <div className="p-8 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                  <div className="text-sm font-semibold text-green-600">All vaccinations are up to date</div>
                  <div className="text-xs text-muted-foreground mt-1">No pending reminders</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
