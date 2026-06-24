import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // ============ CORE METRICS ============
    const revenueRes = await query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'Paid'`)
    const totalRevenue = Number(revenueRes[0]?.total) || 0

    const pendingRevenueRes = await query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status != 'Paid'`)
    const pendingRevenue = Number(pendingRevenueRes[0]?.total) || 0

    const clientsRes = await query(`SELECT COUNT(*) as count FROM users WHERE role = 'client'`)
    const totalClients = Number(clientsRes[0]?.count) || 0

    const petsRes = await query(`SELECT COUNT(*) as count FROM pets`)
    const totalPets = Number(petsRes[0]?.count) || 0

    const totalUsersRes = await query(`SELECT COUNT(*) as count FROM users`)
    const totalUsers = Number(totalUsersRes[0]?.count) || 0

    const staffRes = await query(`SELECT COUNT(*) as count FROM users WHERE role != 'client'`)
    const totalStaff = Number(staffRes[0]?.count) || 0

    // ============ TIME-BASED METRICS ============
    const appointmentsThisMonthRes = await query(`SELECT COUNT(*) as count FROM medical_records WHERE visit_date >= CURRENT_DATE - INTERVAL '1 month'`)
    const appointmentsThisMonth = Number(appointmentsThisMonthRes[0]?.count) || 0

    const totalMedicalRes = await query(`SELECT COUNT(*) as count FROM medical_records`)
    const totalMedicalRecords = Number(totalMedicalRes[0]?.count) || 0

    const totalVaccinationsRes = await query(`SELECT COUNT(*) as count FROM vaccinations`)
    const totalVaccinations = Number(totalVaccinationsRes[0]?.count) || 0

    const totalInvoicesRes = await query(`SELECT COUNT(*) as count FROM invoices`)
    const totalInvoices = Number(totalInvoicesRes[0]?.count) || 0

    // ============ INVENTORY ============
    const inventoryCountRes = await query(`SELECT COALESCE(SUM(stock), 0) as count FROM products`)
    const totalInventoryCount = Number(inventoryCountRes[0]?.count) || 0

    const totalProductsRes = await query(`SELECT COUNT(*) as count FROM products`)
    const totalProducts = Number(totalProductsRes[0]?.count) || 0

    const inventoryValueRes = await query(`SELECT COALESCE(SUM(price * stock), 0) as val FROM products`)
    const inventoryValue = Number(inventoryValueRes[0]?.val) || 0

    // ============ SERVICES & APPOINTMENTS ============
    const activeServicesRes = await query(`SELECT COUNT(*) as count FROM services WHERE is_active = TRUE`)
    const activeServices = Number(activeServicesRes[0]?.count) || 0

    const appointmentStatusRes = await query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`)

    const upcomingAppointmentsRes = await query(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= NOW() AND status = 'pending'`)
    const upcomingAppointments = Number(upcomingAppointmentsRes[0]?.count) || 0

    // ============ SPECIES DISTRIBUTION ============
    const speciesRes = await query(`SELECT COALESCE(species, 'Unspecified') as name, COUNT(*) as value FROM pets GROUP BY species`)

    // ============ REVENUE BY MONTH (last 6 months) ============
    const revenueByMonth = await query(`
      SELECT 
        TO_CHAR(issue_date, 'Mon') as month,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM invoices 
      WHERE status = 'Paid'
      AND issue_date >= CURRENT_DATE - INTERVAL '6 month'
      GROUP BY TO_CHAR(issue_date, 'Mon'), EXTRACT(MONTH FROM issue_date)
      ORDER BY MIN(issue_date) ASC
    `)

    // ============ RECENT ACTIVITY ============
    const recentVisits = await query(`
      SELECT m.id, m.visit_date as date, p.name as pet_name, m.primary_diagnosis as description, 'Medical' as type
      FROM medical_records m
      JOIN pets p ON m.pet_id = p.id
      ORDER BY m.visit_date DESC LIMIT 5
    `)
    
    const recentInvoices = await query(`
      SELECT i.id, i.issue_date as date, p.name as pet_name, 
        CONCAT('Invoice #', i.id, ' - NPR ', i.total_amount) as description, 'Billing' as type
      FROM invoices i
      LEFT JOIN pets p ON i.pet_id = p.id
      ORDER BY i.issue_date DESC LIMIT 5
    `)

    const recentVaccinations = await query(`
      SELECT v.id, v.given_date as date, p.name as pet_name,
        CONCAT(v.vaccine_name, ' vaccination administered') as description, 'Vaccination' as type
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      ORDER BY v.given_date DESC LIMIT 5
    `)

    const activityFeed = [...recentVisits, ...recentInvoices, ...recentVaccinations]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

    // ============ ALERTS ============
    const lowStock = await query(`SELECT id, name, stock, price FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 10`)
    
    const overdueRemindersRes = await query(`SELECT COUNT(*) as count FROM vaccinations WHERE next_due_date < CURRENT_DATE`)
    const overdueReminders = Number(overdueRemindersRes[0]?.count) || 0

    const upcomingVaccinesRes = await query(`
      SELECT COUNT(*) as count FROM vaccinations 
      WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 day'
    `)
    const upcomingVaccines = Number(upcomingVaccinesRes[0]?.count) || 0

    // Detailed overdue vaccination reminders
    const overdueVaccinesList = await query(`
      SELECT v.id, v.vaccine_name, v.next_due_date, p.name as pet_name, u.full_name as owner_name, u.phone_number as phone
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE v.next_due_date < CURRENT_DATE
      ORDER BY v.next_due_date ASC LIMIT 8
    `)

    // Upcoming vaccination reminders (next 14 days)
    const upcomingVaccinesList = await query(`
      SELECT v.id, v.vaccine_name, v.next_due_date, p.name as pet_name, u.full_name as owner_name, u.phone_number as phone
      FROM vaccinations v
      JOIN pets p ON v.pet_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 day'
      ORDER BY v.next_due_date ASC LIMIT 8
    `)

    // ============ RECENT PATIENTS ============
    const recentPatients = await query(`
      SELECT p.name, p.species, p.breed, p.photo_url, p.created_at,
        u.full_name as owner_name
      FROM pets p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 5
    `)

    return NextResponse.json({
      metrics: {
        totalRevenue,
        pendingRevenue,
        totalClients,
        totalPets,
        totalUsers,
        totalStaff,
        appointmentsThisMonth,
        totalMedicalRecords,
        totalVaccinations,
        totalInvoices,
        totalInventoryCount,
        totalProducts,
        inventoryValue,
        activeServices,
        upcomingAppointments,
      },
      revenueByMonth,
      speciesDistribution: speciesRes,
      appointmentStatus: appointmentStatusRes,
      recentPatients,
      activityFeed,
      alerts: {
        lowStock,
        overdueReminders,
        upcomingVaccines,
        overdueVaccinesList,
        upcomingVaccinesList,
      }
    })

  } catch (error) {
    console.error("[v0] Dashboard Stats Error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
