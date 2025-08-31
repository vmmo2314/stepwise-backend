// services/appointmentService.js
const { db } = require("../config/firebaseAdmin")

/**
 * Obtiene la referencia a la subcolección de citas de un doctor.
 * /organizaciones/{clinicaId}/doctores/{doctorId}/citas
 */
// Obtiene la referencia a la subcolección de citas
const doctorAppointmentsColRef = (clinicaId, doctorId) =>
  db.collection("organizaciones")
    .doc(clinicaId)
    .collection("doctores")
    .doc(doctorId)
    .collection("citas")
    
/**
 * Crea una nueva propuesta de cita.
 */
async function createAppointment(appointmentData) {
  try {
    const { clinicaId, doctorId } = appointmentData
    if (!clinicaId || !doctorId) {
      throw new Error("clinicaId y doctorId son requeridos")
    }
    if (!appointmentData.requestedDate || !appointmentData.requestedTime) {
      throw new Error("requestedDate y requestedTime son requeridos")
    }

    const ref = doctorAppointmentsColRef(clinicaId, doctorId).doc()
    const newAppointment = {
      ...appointmentData, // todos los datos ya vienen listos del route
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      doctorResponse: "",
      alternativeDate: "",
      alternativeTime: "",
    }

    await ref.set(newAppointment)
    return { id: ref.id, ...newAppointment }
  } catch (error) {
    console.error("Error al crear cita:", error)
    throw new Error("Error al crear cita.")
  }
}

// busca recorriendo organizaciones hasta encontrar el doctor
async function getClinicaIdByDoctor(doctorId) {
  const orgsSnap = await db.collection("organizaciones").get();
  for (const orgDoc of orgsSnap.docs) {
    const doctorRef = orgDoc.ref.collection("doctores").doc(doctorId);
    const docSnap = await doctorRef.get();
    if (docSnap.exists) {
      return orgDoc.id;
    }
  }
  throw new Error("No se encontró la clínica para este doctor");
}

async function getAppointmentsByDoctorAuto(doctorId, status = "all") {
  const clinicaId = await getClinicaIdByDoctor(doctorId)
  console.log("Buscando citas en:", clinicaId, doctorId)

  let query = doctorAppointmentsColRef(clinicaId, doctorId)
  if (status !== "all") query = query.where("status", "==", status)
  const snapshot = await query.orderBy("createdAt", "desc").get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

async function updateAppointmentStatusAuto(doctorId, appointmentId, updates) {
  const clinicaId = await getClinicaIdByDoctor(doctorId)
  const ref = doctorAppointmentsColRef(clinicaId, doctorId).doc(appointmentId)
  await ref.update({
    ...updates,
    updatedAt: new Date(),
  })
  const snap = await ref.get()
  return { id: snap.id, ...snap.data() }
}

async function acceptAppointmentAuto({ doctorId, appointmentId, doctorNotes = "", doctorName }) {
  if (!doctorId) throw new Error("doctorId requerido");
  if (!appointmentId) throw new Error("appointmentId requerido");

  // 1) Resolvemos clínica y traemos la cita del doctor
  const clinicaId = await getClinicaIdByDoctor(doctorId);
  if (!clinicaId) throw new Error("No se pudo resolver clinicaId del doctor");

  const apptRef = doctorAppointmentsColRef(clinicaId, doctorId).doc(appointmentId);
  const apptSnap = await apptRef.get();
  if (!apptSnap.exists) throw new Error("Cita no encontrada para este doctor");

  const appt = apptSnap.data() || {};

  // <-- ⚠️ AQUÍ OBTENEMOS EL ID DEL PACIENTE desde la cita
  //     Ajusta los posibles nombres de campo si en tu documento se llama distinto.
  const patientId =
    appt.patientId ||
    appt.patientUID ||
    appt.patientUid ||
    appt.patient?.id ||
    appt.userId || // fallback por si usaste este nombre
    null;

  // 2) Campos que se actualizan al aceptar
  const updates = {
    status: "accepted",
    doctorResponse: doctorNotes,
    processedAt: new Date(),
    doctorId,
    ...(doctorName ? { doctorName } : {}),
  };

  // 3) Persistimos la aceptación en la cita del doctor
  await apptRef.set(updates, { merge: true });

  // 4) ⬅️ NUEVO: Vinculamos doctor ↔ paciente en /patients/{patientId}
  await linkDoctorToPatient({ patientId, doctorId, doctorName });

  // (Opcional) Si también llevas espejo de citas en /organizaciones/.../pacientes/{patientId}/citas/{appointmentId},
  // podrías actualizarlo aquí igual que hiciste con apptRef.

  // 5) Respuesta estándar
  return { id: appointmentId, ...appt, ...updates };
}

async function linkDoctorToPatient({ patientId, doctorId, doctorName }) {
  if (!patientId) {
    console.warn("[ACCEPT] No se pudo vincular doctor→paciente: patientId indefinido");
    return;
  }

  // Si no vino el nombre, lo resolvemos a partir del doc del doctor
  let resolvedName = doctorName;
  try {
    if (!resolvedName && doctorId) {
      const clinicaId = await getClinicaIdByDoctor(doctorId);     // ← ya existe en tu servicio
      const docSnap = await db
        .collection("organizaciones").doc(clinicaId)
        .collection("doctores").doc(doctorId)
        .get();

      if (docSnap.exists) {
        const d = docSnap.data() || {};
        resolvedName =
          d.name ||
          d.displayName ||
          [d.firstName, d.lastName].filter(Boolean).join(" ") ||
          null;
      }
    }
  } catch (e) {
    console.warn("[ACCEPT] No se pudo resolver doctorName automáticamente:", e.message);
  }

  // ✅ Escribimos **doctorName** (string) en /patients/{patientId}
  const patientRef = db.collection("patients").doc(patientId);
  const payload = {
    doctorName: resolvedName || "Doctor",
    doctorUpdatedAt: new Date(), // opcional
  };
  await patientRef.set(payload, { merge: true });

  console.log(`[ACCEPT] /patients/${patientId} =>`, payload);
}


async function rejectAppointmentAuto({ doctorId, appointmentId, doctorNotes = "" }) {
  return updateAppointmentStatusAuto(doctorId, appointmentId, {
    status: "rejected",
    doctorResponse: doctorNotes,
    processedAt: new Date(),
  })
}

async function rescheduleAppointmentAuto({ doctorId, appointmentId, alternativeDate, alternativeTime, doctorNotes = "" }) {
  if (!alternativeDate || !alternativeTime) throw new Error("alternativeDate y alternativeTime son requeridos")
  return updateAppointmentStatusAuto(doctorId, appointmentId, {
    status: "rescheduled",
    alternativeDate,
    alternativeTime,
    doctorResponse: doctorNotes,
    processedAt: new Date(),
  })
}

/**
 * Lista citas para un doctor con filtro opcional de estado.
 */
async function getAppointmentsByDoctor(clinicaId, doctorId, status = "all") {
  try {
    console.log("Buscando citas en:", clinicaId, doctorId);
    if (!clinicaId || !doctorId) throw new Error("clinicaId y doctorId son requeridos")
    let query = doctorAppointmentsColRef(clinicaId, doctorId)
    if (status !== "all") query = query.where("status", "==", status)
    const snapshot = await query.orderBy("createdAt", "desc").get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error("Error al obtener citas:", error)
    throw new Error("Error al obtener citas.")
  }
}

/**
 * Actualiza el estado de una cita.
 */
async function updateAppointmentStatus(clinicaId, doctorId, appointmentId, updates) {
  try {
    const ref = doctorAppointmentsColRef(clinicaId, doctorId).doc(appointmentId)
    await ref.update({
      ...updates,
      updatedAt: new Date(),
    })
    const snap = await ref.get()
    return { id: snap.id, ...snap.data() }
  } catch (error) {
    console.error("Error al actualizar cita:", error)
    throw new Error("Error al actualizar cita.")
  }
}

// Aceptar cita
async function acceptAppointment({ clinicaId, doctorId, appointmentId, doctorNotes = "" }) {
  return updateAppointmentStatus(clinicaId, doctorId, appointmentId, {
    status: "accepted",
    doctorResponse: doctorNotes,
    processedAt: new Date(),
  })
}

// Rechazar cita
async function rejectAppointment({ clinicaId, doctorId, appointmentId, doctorNotes = "" }) {
  return updateAppointmentStatus(clinicaId, doctorId, appointmentId, {
    status: "rejected",
    doctorResponse: doctorNotes,
    processedAt: new Date(),
  })
}

// Reprogramar cita
async function rescheduleAppointment({ clinicaId, doctorId, appointmentId, alternativeDate, alternativeTime, doctorNotes = "" }) {
  if (!alternativeDate || !alternativeTime) throw new Error("alternativeDate y alternativeTime son requeridos")
  return updateAppointmentStatus(clinicaId, doctorId, appointmentId, {
    status: "rescheduled",
    alternativeDate,
    alternativeTime,
    doctorResponse: doctorNotes,
    processedAt: new Date(),
  })
}

/**
 * Lista citas por paciente usando collectionGroup("citas") para recorrer todas las clínicas/doctores.
 * Filtro opcional por status ("pending", "accepted", "rejected", "rescheduled" o "all").
 */
async function getAppointmentsByPatient(patientId, status = "all") {
  if (!patientId) throw new Error("patientId es requerido");

  // Consulta a todas las subcolecciones /citas sin saber clinicaId/doctorId
  let query = db.collectionGroup("citas").where("patientId", "==", patientId);

  if (status !== "all") {
    query = query.where("status", "==", status);
  }

  // Orden por fecha de creación (puede requerir índice compuesto si usas status + orderBy).
  const snap = await query.orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

module.exports = {
  createAppointment,
  getAppointmentsByDoctor,
  updateAppointmentStatus,
  getAppointmentsByDoctorAuto,
  acceptAppointmentAuto,
  rejectAppointmentAuto,
  rescheduleAppointmentAuto,
  getAppointmentsByPatient,
  getClinicaIdByDoctor,
}