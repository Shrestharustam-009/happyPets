"use client"

import { useState, useEffect } from "react"
import { Bell, Mail, Phone, Clock, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminTabReminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(null) // ID of reminder being sent

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/reminders")
      if (res.ok) {
        const data = await res.json()
        setReminders(data)
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (vaccination_id, pet_id, client_id) => {
    try {
      setSending(vaccination_id)
      const res = await fetch("/api/admin/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vaccination_id,
          pet_id,
          client_id,
          type: "Email"
        }),
      })

      if (res.ok) {
        // Refresh the list to show it as sent
        await fetchReminders()
      } else {
        alert("Failed to send reminder.")
      }
    } catch (error) {
      console.error("Error sending reminder:", error)
    } finally {
      setSending(null)
    }
  }

  const sendAllDue = async () => {
    const dueReminders = reminders.filter(r => !r.last_sent_date || new Date(r.last_sent_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    if (dueReminders.length === 0) {
      alert("No pending reminders to send.")
      return
    }

    if (confirm(`Are you sure you want to send ${dueReminders.length} reminders?`)) {
      for (const r of dueReminders) {
        await sendReminder(r.vaccination_id, r.pet_id, r.client_id)
      }
      alert("All pending reminders have been processed!")
    }
  }

  const getStatusBadge = (lastSentDate, nextDueDate) => {
    const now = new Date()
    const dueDate = new Date(nextDueDate)
    const isOverdue = dueDate < now

    // If sent within the last 7 days, consider it "Sent"
    const recentlySent = lastSentDate && new Date(lastSentDate) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (recentlySent) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-md border border-green-200"><CheckCircle2 className="w-3 h-3" /> Sent</span>
    } else if (isOverdue) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-md border border-red-200"><AlertCircle className="w-3 h-3" /> Overdue</span>
    } else {
      return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md border border-yellow-200"><Clock className="w-3 h-3" /> Pending</span>
    }
  }

  const isRecentlySent = (lastSentDate) => {
    if (!lastSentDate) return false
    return new Date(lastSentDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }

  const dueSoonCount = reminders.filter(r => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const twoDaysFromNow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    twoDaysFromNow.setHours(23, 59, 59, 999)
    const dueDate = new Date(r.next_due_date)
    return dueDate <= twoDaysFromNow
  }).length

  return (
    <div className="space-y-6">
      {dueSoonCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 animate-bounce shrink-0" />
            <div>
              <p className="text-red-800 font-bold text-sm">Critical Reminders Pending</p>
              <p className="text-red-700 text-xs mt-0.5">
                You have {dueSoonCount} {dueSoonCount === 1 ? "vaccination" : "vaccinations"} due in the next 2 days (or overdue) that require a reminder.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Automated Reminders
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track upcoming vaccinations and send email/SMS reminders to clients.

          </p>
        </div>
        <button
          onClick={sendAllDue}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-6 rounded-md shadow-sm transition-colors flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          Send All
        </button>
      </div>

      <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Patient & Client</th>
                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left font-bold text-muted-foreground uppercase tracking-wider">Due Service</th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center font-bold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">Loading reminders queue...</td></tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                    No upcoming reminders for the next 30 days!
                  </td>
                </tr>
              ) : (
                reminders.map((r) => (
                  <tr key={r.vaccination_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-foreground text-base">{r.pet_name}</div>
                      <div className="text-xs text-muted-foreground">Owner: {r.client_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-xs text-foreground mb-1"><Mail className="w-3 h-3 text-muted-foreground" /> {r.client_email}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" /> {r.client_phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-foreground">{r.vaccine_name}</div>
                      <div className={`text-xs font-semibold ${new Date(r.next_due_date) < new Date() ? 'text-red-500' : 'text-orange-500'}`}>
                        Due: {new Date(r.next_due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(r.last_sent_date, r.next_due_date)}
                      {r.last_sent_date && (
                        <div className="text-[10px] text-muted-foreground mt-1">Last sent: {new Date(r.last_sent_date).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => sendReminder(r.vaccination_id, r.pet_id, r.client_id)}
                        disabled={isRecentlySent(r.last_sent_date) || sending === r.vaccination_id}
                        className={`px-4 py-2 font-semibold rounded-md border transition-colors text-xs flex items-center justify-center w-full gap-2
                          ${isRecentlySent(r.last_sent_date)
                            ? 'bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50'
                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20'}`}
                      >
                        {sending === r.vaccination_id ? (
                          <><div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div> Sending...</>
                        ) : isRecentlySent(r.last_sent_date) ? (
                          <><CheckCircle2 className="w-3 h-3" /> Sent</>
                        ) : (
                          <><Mail className="w-3 h-3" /> Send Email</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
