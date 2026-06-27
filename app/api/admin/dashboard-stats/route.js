import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth-middleware"

export async function GET(request) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Execute all independent queries concurrently to eliminate waterfall latency
    const [
      revenueRes, pendingRevenueRes, clientsRes, petsRes, totalUsersRes, staffRes,
      appointmentsThisMonthRes, totalMedicalRes, totalVaccinationsRes, totalInvoicesRes,
      inventoryCountRes, totalProductsRes, inventoryValueRes, activeServicesRes,
      appointmentStatusRes, upcomingAppointmentsRes, speciesRes, revenueByMonth,
      recentVisits, recentInvoices, recentVaccinations, lowStock, overdueRemindersRes,
      upcomingVaccinesRes, overdueVaccinesList, upcomingVaccinesList, recentPatients
    ] = await Promise.all([
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'Paid'`),
      query(`SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status != 'Paid'`),
      query(`SELECT COUNT(*) as count FROM users WHERE role = 'client'`),
      query(`SELECT COUNT(*) as count FROM pets`),
      query(`SELECT COUNT(*) as count FROM users`),
      query(`SELECT COUNT(*) as count FROM users WHERE role != 'client'`),
      query(`SELECT COUNT(*) as count FROM medical_records WHERE visit_date >= CURRENT_DATE - INTERVAL 1 MONTH`),
      query(`SELECT COUNT(*) as count FROM medical_records`),
      query(`SELECT COUNT(*) as count FROM vaccinations`),
      query(`SELECT COUNT(*) as count FROM invoices`),
      query(`SELECT COALESCE(SUM(stock), 0) as count FROM products`),
      query(`SELECT COUNT(*) as count FROM products`),
      query(`SELECT COALESCE(SUM(price * stock), 0) as val FROM products`),
      query(`SELECT COUNT(*) as count FROM services WHERE is_active = TRUE`),
      query(`SELECT status, COUNT(*) as count FROM appointments GROUP BY status`),
      query(`SELECT COUNT(*) as count FROM appointments WHERE appointment_date >= NOW() AND status = 'pending'`),
      query(`SELECT COALESCE(species, 'Unspecified') as name, COUNT(*) as value FROM pets GROUP BY species`),
      query(`
        SELECT DATE_FORMAT(issue_date, '%b') as month, COALESCE(SUM(total_amount), 0) as revenue
        FROM invoices WHERE status = 'Paid' AND issue_date >= CURRENT_DATE - INTERVAL 6 MONTH
        GROUP BY DATE_FORMAT(issue_date, '%b'), EXTRACT(MONTH FROM issue_date)
        ORDER BY MIN(issue_date) ASC
      `),
      query(`
        SELECT m.id, m.visit_date as date, p.name as pet_name, m.primary_diagnosis as description, 'Medical' as type
        FROM medical_records m JOIN pets p ON m.pet_id = p.id
        ORDER BY m.visit_date DESC LIMIT 5
      `),
      query(`
        SELECT i.id, i.issue_date as date, p.name as pet_name, CONCAT('Invoice #', i.id, ' - NPR ', i.total_amount) as description, 'Billing' as type
        FROM invoices i LEFT JOIN pets p ON i.pet_id = p.id
        ORDER BY i.issue_date DESC LIMIT 5
      `),
      query(`
        SELECT v.id, v.given_date as date, p.name as pet_name, CONCAT(v.vaccine_name, ' vaccination administered') as description, 'Vaccination' as type
        FROM vaccinations v JOIN pets p ON v.pet_id = p.id
        ORDER BY v.given_date DESC LIMIT 5
      `),
      query(`SELECT id, name, stock, price FROM products WHERE stock < 10 ORDER BY stock ASC LIMIT 10`),
      query(`SELECT COUNT(*) as count FROM vaccinations WHERE next_due_date < CURRENT_DATE`),
      query(`SELECT COUNT(*) as count FROM vaccinations WHERE next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 7 DAY`),
      query(`
        SELECT v.id, v.vaccine_name, v.next_due_date, p.name as pet_name, u.full_name as owner_name, u.phone_number as phone
        FROM vaccinations v JOIN pets p ON v.pet_id = p.id JOIN users u ON p.user_id = u.id
        WHERE v.next_due_date < CURRENT_DATE ORDER BY v.next_due_date ASC LIMIT 8
      `),
      query(`
        SELECT v.id, v.vaccine_name, v.next_due_date, p.name as pet_name, u.full_name as owner_name, u.phone_number as phone
        FROM vaccinations v JOIN pets p ON v.pet_id = p.id JOIN users u ON p.user_id = u.id
        WHERE v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 14 DAY ORDER BY v.next_due_date ASC LIMIT 8
      `),
      query(`
        SELECT p.name, p.species, p.breed, p.photo_url, p.created_at, u.full_name as owner_name
        FROM pets p JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC LIMIT 5
      `)
    ]);

    // Format metrics
    const totalRevenue = Number(revenueRes[0]?.total) || 0
    const pendingRevenue = Number(pendingRevenueRes[0]?.total) || 0
    const totalClients = Number(clientsRes[0]?.count) || 0
    const totalPets = Number(petsRes[0]?.count) || 0
    const totalUsers = Number(totalUsersRes[0]?.count) || 0
    const totalStaff = Number(staffRes[0]?.count) || 0
    const appointmentsThisMonth = Number(appointmentsThisMonthRes[0]?.count) || 0
    const totalMedicalRecords = Number(totalMedicalRes[0]?.count) || 0
    const totalVaccinations = Number(totalVaccinationsRes[0]?.count) || 0
    const totalInvoices = Number(totalInvoicesRes[0]?.count) || 0
    const totalInventoryCount = Number(inventoryCountRes[0]?.count) || 0
    const totalProducts = Number(totalProductsRes[0]?.count) || 0
    const inventoryValue = Number(inventoryValueRes[0]?.val) || 0
    const activeServices = Number(activeServicesRes[0]?.count) || 0
    const upcomingAppointments = Number(upcomingAppointmentsRes[0]?.count) || 0
    const overdueReminders = Number(overdueRemindersRes[0]?.count) || 0
    const upcomingVaccines = Number(upcomingVaccinesRes[0]?.count) || 0

    // Combine recent activities
    const activityFeed = [...recentVisits, ...recentInvoices, ...recentVaccinations]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

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
