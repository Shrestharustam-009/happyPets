import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // 1. Total Clients
    const [{ total_clients }] = await query("SELECT COUNT(*) as total_clients FROM users WHERE role = 'client'")

    // 2. Total Pets
    const [{ total_pets }] = await query("SELECT COUNT(*) as total_pets FROM pets")

    // 3. Financial Overview (Paid Invoices)
    const [{ total_revenue }] = await query("SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM invoices WHERE status = 'Paid'")
    
    const [{ pending_revenue }] = await query("SELECT COALESCE(SUM(total_amount), 0) as pending_revenue FROM invoices WHERE status = 'Pending'")

    // 4. Low Stock Alerts
    const low_stock_items = await query("SELECT id, name, stock, price FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10")

    // 5. Upcoming/Overdue Vaccinations
    // We want dates where next_due_date is not null, and is either past or within next 30 days
    const upcoming_vaccinations = await query(`
      SELECT v.id, v.vaccine_name, v.next_due_date, p.name as pet_name, u.full_name as owner_name, u.phone_number
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE v.next_due_date IS NOT NULL 
      AND v.next_due_date <= CURRENT_DATE + INTERVAL '30 day'
      ORDER BY v.next_due_date ASC
      LIMIT 15
    `)

    // 6. Recent Medical Cases
    const recent_medical_cases = await query(`
      SELECT m.*, p.name as pet_name, p.species, p.breed, u.full_name as vet_name, o.full_name as owner_name
      FROM medical_records m
      JOIN pets p ON m.pet_id = p.id
      JOIN users u ON m.vet_id = u.id
      JOIN users o ON p.user_id = o.id
      ORDER BY m.visit_date DESC
      LIMIT 10
    `)

    return NextResponse.json({
      metrics: {
        total_clients,
        total_pets,
        total_revenue: parseFloat(total_revenue),
        pending_revenue: parseFloat(pending_revenue)
      },
      alerts: {
        low_stock_items,
        upcoming_vaccinations
      },
      recent_activity: {
        recent_medical_cases
      }
    })

  } catch (error) {
    console.error("[v0] Error fetching reports data:", error)
    return NextResponse.json({ error: "Failed to fetch reports data" }, { status: 500 })
  }
}
