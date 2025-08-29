// routes/appointments.js
const express = require("express")
const router = express.Router()
const { db } = require("../config/firebaseAdmin")
const {
  createAppointment,
  getAppointmentsByDoctor,
  acceptAppointmentAuto,
  rejectAppointmentAuto,
  rescheduleAppointmentAuto,
  getAppointmentsByPatient,
} = require("../services/appointmentService");

const { authenticateToken } = require("../middleware/authMiddleware") // Importa el middleware

// POST /api/appointments
router.post("/", authenticateToken, async (req, res) => {
  try {
    // UID del paciente autenticado
    const uid = req.user.uid

    // Obtener datos del paciente desde Firestore
    const patientSnap = await db.collection("patients").doc(uid).get()
    if (!patientSnap.exists) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }
    const patientData = patientSnap.data()

    // Combinar datos que envía el front + datos del paciente
    const appointmentData = {
      ...req.body,
      patientId: patientData.uid,
      patientName: patientData.name,
      patientEmail: patientData.email,
      patientPhone: patientData.info_contacto?.telefono || "",
      patientAge: patientData.datos_personales?.edad || null,
      patientGender: patientData.datos_personales?.sexo || null,
      patientBloodType: patientData.datos_personales?.tipo_sangre || null,
      patientWeight: patientData.datos_personales?.peso_kg || null,
      patientHeight: patientData.datos_personales?.estatura_cm || null,
      patientBMI: patientData.datos_personales?.IMC || null,
    }

    const created = await createAppointment(appointmentData)
    res.status(201).json(created)
  } catch (err) {
    console.error("Error al crear cita:", err)
    res.status(400).json({ error: err.message })
  }
})

// GET /api/appointments/doctor/me?clinicaId=...&status=pending|all
router.get("/doctor/me", authenticateToken, async (req, res) => {
  try {
    const { clinicaId, status = "all" } = req.query
    const doctorId = req.user.uid
    const items = await getAppointmentsByDoctor(clinicaId, doctorId, status)
    res.json(items)
    console.log("Doctor ID desde token:", req.user.uid);
    console.log("Clinica ID:", clinicaId);
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/appointments/doctor/:doctorId
router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params
    const { clinicaId, status = "all" } = req.query
    const items = await getAppointmentsByDoctor(clinicaId, doctorId, status)
    res.json(items)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/appointments/:appointmentId/accept
router.patch("/:appointmentId/accept", authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorNotes = "", doctorName } = req.body; // << permite recibir el nombre del doctor
    const doctorId = req.user.uid;

    if (!doctorName || typeof doctorName !== "string") {
      return res.status(400).json({ error: "doctorName es requerido y debe ser string." });
    }

    const data = await acceptAppointmentAuto({ doctorId, appointmentId, doctorNotes, doctorName });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/appointments/:appointmentId/reject
router.patch("/:appointmentId/reject", authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorNotes = "" } = req.body;
    const doctorId = req.user.uid; // viene del token
    const data = await rejectAppointmentAuto({ doctorId, appointmentId, doctorNotes });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/appointments/:appointmentId/reschedule
router.patch("/:appointmentId/reschedule", authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { alternativeDate, alternativeTime, doctorNotes = "" } = req.body;
    const doctorId = req.user.uid;
    const data = await rescheduleAppointmentAuto({ doctorId, appointmentId, alternativeDate, alternativeTime, doctorNotes });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/appointments/patient/me?status=pending|accepted|rejected|rescheduled|all
router.get("/patient/me", authenticateToken, async (req, res) => {
  try {
    const { status = "all" } = req.query;
    const patientId = req.user.uid; // viene del token validado por authMiddleware
    const items = await getAppointmentsByPatient(patientId, status);
    return res.json(items);
  } catch (err) {
    console.error("Error al obtener citas del paciente:", err);
    // Siempre responde JSON para que el front no intente parsear HTML
    return res.status(400).json({ error: err.message || "Error al obtener citas del paciente." });
  }
});

module.exports = router;