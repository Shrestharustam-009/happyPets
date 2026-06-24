import AdminTabReminders from "@/components/admin-tabs/admin-tab-reminders"

export const metadata = {
  title: "Automated Reminders | HappyPets Admin",
  description: "Track and send automated reminders to clients.",
}

export default function ReportsPage() {
  return (
    <div className="w-full">
      <AdminTabReminders />
    </div>
  )
}
