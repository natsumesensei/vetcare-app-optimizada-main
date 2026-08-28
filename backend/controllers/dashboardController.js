const db = require("../database/db");
const { today, sendError } = require("../utils/values");

exports.show = (req, res) => {
  try {
    const date = today();
    const currentMonthPrefix = date.slice(0, 7) + "%";

    // 1. Configuración de moneda
    const clinic = db.prepare("SELECT currency, currency_symbol FROM settings ORDER BY id LIMIT 1").get();
    const currency = clinic?.currency || "EUR";
    const currencySymbol = clinic?.currency_symbol || "€";

    // 2. Contadores clave
    const patients = db.prepare("SELECT COUNT(*) c FROM patients").get().c;

    const appointmentsToday = db
      .prepare(
        `SELECT COUNT(*) c FROM appointments
         WHERE appointment_date = ? AND status != 'Cancelada'`
      )
      .get(date).c;

    const activeHospitalizations = db
      .prepare("SELECT COUNT(*) c FROM hospitalizations WHERE status = 'Hospitalizado'")
      .get().c;

    const lowStock = db
      .prepare("SELECT COUNT(*) c FROM inventory WHERE active = 1 AND stock <= minimum_stock")
      .get().c;

    const overdueVaccines = db
      .prepare("SELECT COUNT(*) c FROM vaccines WHERE next_due_date IS NOT NULL AND next_due_date < ?")
      .get(date).c;

    const overdueParasites = db
      .prepare("SELECT COUNT(*) c FROM parasite_control WHERE next_due_date IS NOT NULL AND next_due_date < ?")
      .get(date).c;

    const pendingInvoicesCount = db
      .prepare("SELECT COUNT(*) c FROM invoices WHERE status = 'Pendiente'")
      .get().c;

    const pendingInvoicesAmount = db
      .prepare("SELECT COALESCE(SUM(total), 0) total FROM invoices WHERE status = 'Pendiente'")
      .get().total;

    const pendingLabs = db
      .prepare("SELECT COUNT(*) c FROM lab_orders WHERE status IN ('Pendiente', 'En proceso')")
      .get().c;

    // 3. Ingresos del mes
    const monthRevenue = db
      .prepare(
        `SELECT COALESCE(SUM(total), 0) total FROM invoices
         WHERE issue_date LIKE ? AND status != 'Anulada'`
      )
      .get(currentMonthPrefix).total;

    // 4. Citas de hoy y próximas
    const todayAppointmentsList = db
      .prepare(
        `SELECT a.*, p.name AS patient_name, p.species, p.breed, p.owner_phone
         FROM appointments a
         LEFT JOIN patients p ON p.id = a.patient_id
         WHERE a.appointment_date = ?
         ORDER BY a.appointment_time ASC`
      )
      .all(date);

    // 5. Pacientes hospitalizados activos
    const hospitalizationsList = db
      .prepare(
        `SELECT h.*, p.name AS patient_name, p.species, p.breed, p.owner_name, p.owner_phone
         FROM hospitalizations h
         LEFT JOIN patients p ON p.id = h.patient_id
         WHERE h.status = 'Hospitalizado'
         ORDER BY h.admission_date DESC`
      )
      .all();

    // 6. Últimas facturas
    const recentInvoices = db
      .prepare(
        `SELECT i.*, p.name AS patient_name
         FROM invoices i
         LEFT JOIN patients p ON p.id = i.patient_id
         ORDER BY i.issue_date DESC, i.id DESC
         LIMIT 5`
      )
      .all();

    // 7. Últimas órdenes de laboratorio
    const recentLabs = db
      .prepare(
        `SELECT o.*, p.name AS patient_name, p.species
         FROM lab_orders o
         LEFT JOIN patients p ON p.id = o.patient_id
         ORDER BY o.order_date DESC, o.id DESC
         LIMIT 5`
      )
      .all();

    // 8. Gráfico de ingresos de los últimos 6 meses
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().slice(0, 7);
      const monthName = d.toLocaleDateString("es-ES", { month: "short" });
      
      const rev = db
        .prepare("SELECT COALESCE(SUM(total), 0) t FROM invoices WHERE issue_date LIKE ? AND status != 'Anulada'")
        .get(`${mStr}%`).t;

      const appts = db
        .prepare("SELECT COUNT(*) c FROM appointments WHERE appointment_date LIKE ? AND status != 'Cancelada'")
        .get(`${mStr}%`).c;

      monthlyStats.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        revenue: Math.round(rev),
        appointments: appts,
      });
    }

    // 9. Distribución de pacientes por especie
    const speciesDistribution = db
      .prepare("SELECT species, COUNT(*) as count FROM patients GROUP BY species ORDER BY count DESC LIMIT 5")
      .all();

    res.json({
      patients,
      appointmentsToday,
      activeHospitalizations,
      lowStock,
      overdueVaccines,
      overdueParasites,
      pendingInvoicesCount,
      pendingInvoicesAmount,
      pendingLabs,
      revenue: monthRevenue,
      currency,
      currencySymbol,
      todayAppointmentsList,
      hospitalizationsList,
      recentInvoices,
      recentLabs,
      monthlyStats,
      speciesDistribution,
    });
  } catch (error) {
    sendError(res, error);
  }
};
